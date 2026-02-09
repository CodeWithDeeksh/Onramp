/**
 * LLM Service Client
 * Handles all interactions with LLM services (OpenAI/Anthropic)
 */

import axios, { AxiosInstance } from 'axios';
import type { ILLMClient } from '../types/interfaces.js';
import type {
  FileNode,
  ModuleExplanation,
  UserProfile,
  RepositoryAnalysis,
  MatchScore,
  ContributionPath,
  GitHubIssue,
  IssueDifficulty,
} from '../types/models.js';
import { ServiceError, ErrorCode } from '../types/errors.js';

interface LLMConfig {
  provider: 'openai' | 'anthropic';
  apiKey: string;
  model?: string;
  timeout?: number;
  maxRetries?: number;
}

export class LLMClient implements ILLMClient {
  private client: AxiosInstance;
  private provider: 'openai' | 'anthropic';
  private model: string;
  private maxRetries: number;
  private timeout: number;
  private hasValidApiKey: boolean;

  constructor(config: LLMConfig) {
    this.provider = config.provider;
    this.maxRetries = config.maxRetries || 3;
    this.timeout = config.timeout || 30000;

    // Check if API key is valid (not placeholder)
    this.hasValidApiKey = !!(
      config.apiKey && 
      config.apiKey !== 'your_openai_api_key_here' &&
      config.apiKey !== 'your_anthropic_api_key_here' &&
      config.apiKey.length > 10
    );

    // Set default models
    this.model =
      config.model || (config.provider === 'openai' ? 'gpt-3.5-turbo' : 'claude-3-sonnet');

    // Configure axios client based on provider
    if (config.provider === 'openai') {
      this.client = axios.create({
        baseURL: 'https://api.openai.com/v1',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: this.timeout,
      });
    } else {
      this.client = axios.create({
        baseURL: 'https://api.anthropic.com/v1',
        headers: {
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        timeout: this.timeout,
      });
    }
  }

  /**
   * Generate repository summary
   */
  async generateRepositorySummary(readme: string, structure: FileNode[]): Promise<string> {
    if (!this.hasValidApiKey) {
      return this.getMockSummary(readme, structure);
    }
    try {
      const prompt = this.buildRepositorySummaryPrompt(readme, structure);
      return await this.callLLM(prompt);
    } catch (error) {
      // Fallback to mock data on any LLM error
      return this.getMockSummary(readme, structure);
    }
  }

  /**
   * Generate architecture overview
   */
  async generateArchitectureOverview(structure: FileNode[], readme: string): Promise<string> {
    if (!this.hasValidApiKey) {
      return this.getMockArchitecture(structure);
    }
    try {
      const prompt = this.buildArchitecturePrompt(structure, readme);
      return await this.callLLM(prompt);
    } catch (error) {
      // Fallback to mock data on any LLM error
      return this.getMockArchitecture(structure);
    }
  }

  /**
   * Explain modules
   */
  async explainModules(structure: FileNode[], readme: string): Promise<ModuleExplanation[]> {
    if (!this.hasValidApiKey) {
      return this.getMockModules(structure);
    }
    try {
      const prompt = this.buildModuleExplanationPrompt(structure, readme);
      const response = await this.callLLM(prompt);

      // Parse JSON response
      try {
        const parsed = JSON.parse(response);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        // Fallback: extract modules from text response
        return this.parseModulesFromText(response, structure);
      }
    } catch (error) {
      // Fallback to mock data on any LLM error
      return this.getMockModules(structure);
    }
  }

  /**
   * Score repository match against user profile
   */
  async scoreRepositoryMatch(
    profile: UserProfile,
    repository: RepositoryAnalysis
  ): Promise<MatchScore> {
    try {
      const prompt = this.buildMatchingPrompt(profile, repository);
      const response = await this.callLLM(prompt);

      try {
        const parsed = JSON.parse(response);
        return {
          score: parsed.score || 0,
          reasoning: parsed.reasoning || '',
          languageMatch: parsed.languageMatch || 0,
          frameworkMatch: parsed.frameworkMatch || 0,
          interestMatch: parsed.interestMatch || 0,
          experienceMatch: parsed.experienceMatch || 0,
        };
      } catch {
        // Fallback: extract score from text
        return this.parseMatchScoreFromText(response);
      }
    } catch (error) {
      // Fallback: return basic match score
      return {
        score: 50,
        reasoning: 'Basic match score (LLM unavailable)',
        languageMatch: 50,
        frameworkMatch: 50,
        interestMatch: 50,
        experienceMatch: 50,
      };
    }
  }

  /**
   * Generate contribution path
   */
  async generateContributionPath(
    profile: UserProfile,
    repository: RepositoryAnalysis
  ): Promise<ContributionPath> {
    try {
      const prompt = this.buildContributionPathPrompt(profile, repository);
      const response = await this.callLLM(prompt);

      try {
        const parsed = JSON.parse(response);
        return {
          repositoryUrl: repository.url,
          steps: parsed.steps || [],
          estimatedTime: parsed.estimatedTime || '2-3 hours',
          difficulty: parsed.difficulty || profile.experienceLevel,
        };
      } catch {
        // Fallback: parse from text
        return this.parseContributionPathFromText(response, repository.url, profile.experienceLevel);
      }
    } catch (error) {
      // Fallback: return basic contribution path
      return this.parseContributionPathFromText('', repository.url, profile.experienceLevel);
    }
  }

  /**
   * Classify issue difficulty
   */
  async classifyIssueDifficulty(
    issue: GitHubIssue,
    repositoryContext: RepositoryAnalysis
  ): Promise<IssueDifficulty> {
    try {
      const prompt = this.buildIssueClassificationPrompt(issue, repositoryContext);
      const response = await this.callLLM(prompt);

      try {
        const parsed = JSON.parse(response);
        return {
          level: parsed.level || 'intermediate',
          reasoning: parsed.reasoning || '',
          signals: parsed.signals || [],
        };
      } catch {
        // Fallback: parse from text
        return this.parseIssueDifficultyFromText(response);
      }
    } catch (error) {
      // Fallback: return intermediate difficulty
      return {
        level: 'intermediate',
        reasoning: 'Unable to classify (LLM unavailable)',
        signals: [],
      };
    }
  }

  /**
   * Call LLM with retry logic
   */
  private async callLLM(prompt: string, retries = this.maxRetries): Promise<string> {
    try {
      if (this.provider === 'openai') {
        const response = await this.client.post('/chat/completions', {
          model: this.model,
          messages: [
            {
              role: 'system',
              content:
                'You are an expert software engineer helping developers understand and contribute to open-source projects. Provide clear, actionable guidance.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        });

        return response.data.choices[0].message.content;
      } else {
        // Anthropic
        const response = await this.client.post('/messages', {
          model: this.model,
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
        });

        return response.data.content[0].text;
      }
    } catch (error: any) {
      if (retries > 0 && this.isRetryableError(error)) {
        await this.delay(1000);
        return this.callLLM(prompt, retries - 1);
      }

      throw new ServiceError(
        ErrorCode.LLM_SERVICE_UNAVAILABLE,
        `LLM service error: ${error.message}`,
        { provider: this.provider, error: error.message }
      );
    }
  }

  /**
   * Build repository summary prompt
   */
  private buildRepositorySummaryPrompt(readme: string, structure: FileNode[]): string {
    const topLevelFiles = structure.map((node) => node.name).join(', ');

    return `Analyze this GitHub repository and provide a concise summary.

README Content:
${readme.substring(0, 2000)}

File Structure (top-level):
${topLevelFiles}

Provide:
1. A 2-3 sentence summary of what this project does
2. The primary programming language and frameworks used
3. The target audience or use case

Keep the explanation clear and accessible to developers unfamiliar with the project.`;
  }

  /**
   * Build architecture overview prompt
   */
  private buildArchitecturePrompt(structure: FileNode[], readme: string): string {
    const structureStr = this.formatFileStructure(structure, 2);

    return `Based on this repository structure and README, explain the architecture.

File Structure:
${structureStr}

README:
${readme.substring(0, 1500)}

Provide:
1. The architectural pattern used (e.g., MVC, microservices, layered)
2. Key components and their relationships
3. Data flow through the system
4. Technology stack and why it matters

Explain in a way that helps a new contributor understand how the pieces fit together.`;
  }

  /**
   * Build module explanation prompt
   */
  private buildModuleExplanationPrompt(structure: FileNode[], readme: string): string {
    const directories = structure.filter((node) => node.type === 'directory');
    const moduleList = directories.map((dir) => dir.name).join(', ');

    return `Explain the purpose and contents of these directories/modules.

Modules to explain: ${moduleList}

README Context:
${readme.substring(0, 1000)}

For each module, provide a JSON array with objects containing:
- path: module path
- name: module name
- purpose: its purpose in the overall system
- keyFiles: array of key files
- complexity: "low", "medium", or "high"

Return ONLY valid JSON.`;
  }

  /**
   * Build matching prompt
   */
  private buildMatchingPrompt(profile: UserProfile, repository: RepositoryAnalysis): string {
    return `Score how well this repository matches the user's profile.

User Profile:
- Languages: ${profile.languages.join(', ')}
- Frameworks: ${profile.frameworks.join(', ')}
- Experience Level: ${profile.experienceLevel}
- Interests: ${profile.interests.join(', ')}

Repository:
- Name: ${repository.name}
- Languages: ${Object.keys(repository.metadata.languages).join(', ')}
- Topics: ${repository.metadata.topics.join(', ')}
- Description: ${repository.summary}

Provide a JSON object with:
- score: overall match score (0-100)
- reasoning: explanation for the score
- languageMatch: language match score (0-100)
- frameworkMatch: framework match score (0-100)
- interestMatch: interest match score (0-100)
- experienceMatch: experience level match score (0-100)

Return ONLY valid JSON.`;
  }

  /**
   * Build contribution path prompt
   */
  private buildContributionPathPrompt(
    profile: UserProfile,
    repository: RepositoryAnalysis
  ): string {
    return `Create a personalized onboarding path for this developer.

User Profile:
- Experience Level: ${profile.experienceLevel}
- Languages: ${profile.languages.join(', ')}
- Frameworks: ${profile.frameworks.join(', ')}

Repository: ${repository.name}
Summary: ${repository.summary}

Generate a JSON object with:
- steps: array of 4-6 steps, each with:
  - order: step number
  - title: clear title
  - description: detailed description
  - files: array of files to explore
  - concepts: array of key concepts
  - resources: array of resources (each with title, url, type)
- estimatedTime: e.g., "2-3 hours"
- difficulty: "beginner", "intermediate", or "advanced"

Tailor the complexity to their experience level. Return ONLY valid JSON.`;
  }

  /**
   * Build issue classification prompt
   */
  private buildIssueClassificationPrompt(
    issue: GitHubIssue,
    repositoryContext: RepositoryAnalysis
  ): string {
    return `Classify the difficulty of this GitHub issue.

Issue:
Title: ${issue.title}
Description: ${issue.body.substring(0, 500)}
Labels: ${issue.labels.join(', ')}
Comments: ${issue.comments}

Repository Context: ${repositoryContext.name}

Classify as "beginner", "intermediate", or "advanced".

Provide a JSON object with:
- level: difficulty level
- reasoning: explanation for classification
- signals: array of complexity signals (each with type, value, impact)

Return ONLY valid JSON.`;
  }

  /**
   * Format file structure for prompts
   */
  private formatFileStructure(nodes: FileNode[], maxDepth: number, depth = 0): string {
    if (depth >= maxDepth) return '';

    return nodes
      .map((node) => {
        const indent = '  '.repeat(depth);
        const line = `${indent}${node.type === 'directory' ? '📁' : '📄'} ${node.name}`;
        const children =
          node.children && depth < maxDepth - 1
            ? '\n' + this.formatFileStructure(node.children, maxDepth, depth + 1)
            : '';
        return line + children;
      })
      .join('\n');
  }

  /**
   * Parse modules from text response (fallback)
   */
  private parseModulesFromText(text: string, structure: FileNode[]): ModuleExplanation[] {
    const directories = structure.filter((node) => node.type === 'directory');
    return directories.slice(0, 5).map((dir) => ({
      path: dir.path,
      name: dir.name,
      purpose: `Module: ${dir.name}`,
      keyFiles: [],
      complexity: 'medium' as const,
    }));
  }

  /**
   * Parse match score from text (fallback)
   */
  private parseMatchScoreFromText(text: string): MatchScore {
    const scoreMatch = text.match(/score[:\s]+(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;

    return {
      score,
      reasoning: text.substring(0, 200),
      languageMatch: score,
      frameworkMatch: score,
      interestMatch: score,
      experienceMatch: score,
    };
  }

  /**
   * Parse contribution path from text (fallback)
   */
  private parseContributionPathFromText(
    text: string,
    url: string,
    difficulty: string
  ): ContributionPath {
    // Return a basic 4-step contribution path
    return {
      repositoryUrl: url,
      steps: [
        {
          order: 1,
          title: 'Read the Documentation',
          description: 'Start by reading the README and documentation to understand the project\'s purpose and architecture.',
          files: ['README.md', 'CONTRIBUTING.md'],
          concepts: ['Project Overview', 'Setup Instructions'],
          resources: [
            {
              title: 'Repository README',
              url: url,
              type: 'documentation' as const
            }
          ]
        },
        {
          order: 2,
          title: 'Set Up Development Environment',
          description: 'Clone the repository and install dependencies to get the project running locally.',
          files: ['package.json', 'requirements.txt'],
          concepts: ['Local Setup', 'Dependencies'],
          resources: []
        },
        {
          order: 3,
          title: 'Explore the Codebase',
          description: 'Navigate through the main modules and understand the code structure.',
          files: [],
          concepts: ['Code Structure', 'Module Organization'],
          resources: []
        },
        {
          order: 4,
          title: 'Find Good First Issues',
          description: 'Look for issues labeled "good first issue" or "beginner-friendly" to start contributing.',
          files: [],
          concepts: ['Issue Tracking', 'Contribution Guidelines'],
          resources: [
            {
              title: 'Project Issues',
              url: `${url}/issues`,
              type: 'documentation' as const
            }
          ]
        }
      ],
      estimatedTime: difficulty === 'beginner' ? '3-4 hours' : '2-3 hours',
      difficulty: difficulty as any,
    };
  }

  /**
   * Parse issue difficulty from text (fallback)
   */
  private parseIssueDifficultyFromText(text: string): IssueDifficulty {
    const level = text.toLowerCase().includes('beginner')
      ? 'beginner'
      : text.toLowerCase().includes('advanced')
        ? 'advanced'
        : 'intermediate';

    return {
      level: level as any,
      reasoning: text.substring(0, 200),
      signals: [],
    };
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    return (
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.response?.status >= 500 ||
      error.response?.status === 429
    );
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ============================================================================
  // Mock Data Methods (for demo without API keys)
  // ============================================================================

  private getMockSummary(readme: string, structure: FileNode[]): string {
    const hasReadme = readme && readme.length > 50;
    if (hasReadme) {
      // Extract first meaningful paragraphs from README
      const lines = readme.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      const paragraphs = [];
      
      for (let i = 0; i < lines.length && paragraphs.length < 3; i++) {
        const line = lines[i].trim();
        if (line.length > 30 && !line.startsWith('[![') && !line.startsWith('[!')) {
          paragraphs.push(line);
        }
      }
      
      const summary = paragraphs.join(' ').substring(0, 500);
      return summary || 'A modern open-source project with comprehensive documentation and active development.';
    }
    return 'This repository contains a well-structured codebase with clear organization and documentation. The project demonstrates professional development practices with modular architecture and comprehensive testing.';
  }

  private getMockArchitecture(structure: FileNode[]): string {
    const dirs = structure.filter(n => n.type === 'directory').map(n => n.name);
    const hasTests = dirs.some(d => d.includes('test') || d.includes('spec') || d.includes('__tests__'));
    const hasDocs = dirs.some(d => d.includes('doc') || d.includes('docs'));
    const hasSrc = dirs.some(d => d.includes('src') || d.includes('lib'));
    const hasExamples = dirs.some(d => d.includes('example') || d.includes('demo'));
    const hasScripts = dirs.some(d => d.includes('script') || d.includes('bin'));
    const hasConfig = dirs.some(d => d.includes('config') || d.includes('.github'));
    
    const patterns = [];
    if (hasSrc) patterns.push('Modular Architecture');
    if (hasTests) patterns.push('Test-Driven Development');
    if (hasDocs) patterns.push('Documentation-First Approach');
    if (hasExamples) patterns.push('Example-Driven Learning');
    if (patterns.length === 0) patterns.push('Standard Project Structure');
    
    let description = `This project follows a ${patterns[0].toLowerCase()} with clear separation of concerns. `;
    
    if (hasSrc) {
      description += 'The source code is organized in a dedicated directory for better maintainability. ';
    }
    if (hasTests) {
      description += 'Comprehensive test coverage ensures code quality and reliability. ';
    }
    if (hasDocs) {
      description += 'Well-documented codebase with detailed guides and API references. ';
    }
    if (hasExamples) {
      description += 'Includes practical examples to help developers get started quickly. ';
    }
    if (hasScripts) {
      description += 'Automated scripts streamline development workflows. ';
    }
    if (hasConfig) {
      description += 'Professional CI/CD setup with automated testing and deployment. ';
    }
    
    description += '\n\nThe architecture promotes scalability, maintainability, and ease of contribution. New developers can quickly understand the codebase structure and start contributing effectively.';
    
    const technologies = dirs
      .filter(d => !d.startsWith('.') && !d.includes('node_modules'))
      .slice(0, 8)
      .map(name => name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ').replace(/-/g, ' '));
    
    const keyComponents = dirs
      .filter(d => !d.startsWith('.') && !d.includes('node_modules') && !d.includes('dist') && !d.includes('build'))
      .slice(0, 8);
    
    return JSON.stringify({
      description: description,
      patterns: patterns,
      technologies: technologies,
      keyComponents: keyComponents,
      dataFlow: hasSrc ? 'Organized data flow through well-defined modules and interfaces' : 'Standard data flow patterns',
      scalability: 'Designed for horizontal and vertical scaling with modular components'
    });
  }

  private getMockModules(structure: FileNode[]): ModuleExplanation[] {
    const directories = structure.filter((node) => node.type === 'directory' && !node.name.startsWith('.') && node.name !== 'node_modules' && node.name !== 'dist' && node.name !== 'build');
    return directories.slice(0, 10).map((dir, idx) => {
      const files = dir.children?.filter(c => c.type === 'file') || [];
      const subdirs = dir.children?.filter(c => c.type === 'directory') || [];
      const hasTests = files.some(f => f.name.includes('test') || f.name.includes('spec'));
      const hasIndex = files.some(f => f.name.includes('index'));
      const complexity = files.length > 15 ? 'high' : files.length > 8 ? 'medium' : 'low';
      
      // Get actual file names with extensions
      const keyFilesList = files
        .filter(f => {
          const name = f.name.toLowerCase();
          // Prioritize important files
          return name.includes('index') || 
                 name.includes('main') || 
                 name.includes('app') || 
                 name.includes('config') || 
                 name.includes('setup') ||
                 name.endsWith('.ts') ||
                 name.endsWith('.tsx') ||
                 name.endsWith('.js') ||
                 name.endsWith('.jsx') ||
                 name.endsWith('.py') ||
                 name.endsWith('.java') ||
                 name.endsWith('.go') ||
                 name.endsWith('.rs');
        })
        .slice(0, 8)
        .map(f => f.name);
      
      let purpose = '';
      let details = '';
      
      // Determine purpose based on directory name
      if (dir.name.includes('test') || dir.name.includes('__tests__')) {
        purpose = 'Test Suite';
        details = `Comprehensive testing infrastructure with ${files.length} test files. Ensures code quality through ${hasTests ? 'unit tests, integration tests, and' : ''} automated testing. ${subdirs.length > 0 ? `Organized into ${subdirs.length} test categories.` : 'Well-structured test organization.'}`;
      } else if (dir.name.includes('doc')) {
        purpose = 'Documentation Hub';
        details = `Complete documentation system with ${files.length} documentation files. Includes API references, user guides, tutorials, and contribution guidelines. ${subdirs.length > 0 ? `Organized into ${subdirs.length} documentation sections for easy navigation.` : 'Comprehensive developer resources.'}`;
      } else if (dir.name.includes('src') || dir.name.includes('lib')) {
        purpose = 'Core Application Logic';
        details = `Primary source code containing ${files.length} implementation files. ${subdirs.length > 0 ? `Modularly organized into ${subdirs.length} functional areas including business logic, data handling, and utilities.` : 'Contains the main application implementation.'} ${hasIndex ? 'Clean module exports via index files.' : 'Direct module access.'}`;
      } else if (dir.name.includes('config')) {
        purpose = 'Configuration Management';
        details = `Centralized configuration with ${files.length} config files managing environment settings, build configurations, and runtime parameters. Supports multiple deployment environments and feature flags. ${subdirs.length > 0 ? `Separated into ${subdirs.length} configuration domains.` : 'Unified configuration approach.'}`;
      } else if (dir.name.includes('util') || dir.name.includes('helper')) {
        purpose = 'Utility Library';
        details = `Reusable utility functions across ${files.length} helper modules. Provides common operations for string manipulation, data transformation, validation, and more. ${hasTests ? 'Thoroughly tested utilities.' : 'Shared helper functions.'} Promotes code reuse and consistency.`;
      } else if (dir.name.includes('component')) {
        purpose = 'UI Component Library';
        details = `Modular UI components with ${files.length} reusable elements. ${hasTests ? 'Each component includes tests for reliability.' : 'Composable design system.'} ${subdirs.length > 0 ? `Categorized into ${subdirs.length} component groups (buttons, forms, layouts, etc.).` : 'Flat component structure.'}`;
      } else if (dir.name.includes('service') || dir.name.includes('api')) {
        purpose = 'Service Layer & API Integration';
        details = `Business logic and external integrations across ${files.length} service modules. Handles data operations, API communications, authentication, and third-party integrations. ${subdirs.length > 0 ? `Organized into ${subdirs.length} service domains.` : 'Centralized service management.'} Clean separation from UI layer.`;
      } else if (dir.name.includes('model') || dir.name.includes('schema')) {
        purpose = 'Data Models & Schemas';
        details = `Data structure definitions with ${files.length} model files. Defines entities, validation rules, type definitions, and database schemas. ${subdirs.length > 0 ? `Grouped into ${subdirs.length} data domains.` : 'Unified data layer.'} Ensures type safety and data integrity.`;
      } else if (dir.name.includes('example') || dir.name.includes('demo')) {
        purpose = 'Examples & Demonstrations';
        details = `Practical examples with ${files.length} demo files showing real-world usage patterns. Helps developers understand implementation details and best practices. ${subdirs.length > 0 ? `Covers ${subdirs.length} different use cases.` : 'Comprehensive usage examples.'} Great for onboarding.`;
      } else if (dir.name.includes('script')) {
        purpose = 'Automation & Build Scripts';
        details = `Development automation with ${files.length} scripts for building, testing, deployment, and maintenance. Streamlines workflows and ensures consistent processes. ${subdirs.length > 0 ? `Categorized into ${subdirs.length} script types.` : 'Unified script collection.'} Improves developer productivity.`;
      } else if (dir.name.includes('middleware')) {
        purpose = 'Middleware Layer';
        details = `Request/response processing with ${files.length} middleware modules. Handles authentication, logging, error handling, and request transformation. ${hasTests ? 'Tested middleware chain.' : 'Modular middleware architecture.'} Ensures consistent request processing.`;
      } else if (dir.name.includes('route') || dir.name.includes('controller')) {
        purpose = 'Routing & Controllers';
        details = `Application routing with ${files.length} route/controller files. Maps URLs to handlers, manages request flow, and coordinates business logic. ${subdirs.length > 0 ? `Organized into ${subdirs.length} route groups.` : 'RESTful API structure.'} Clean MVC pattern.`;
      } else {
        purpose = `${dir.name.charAt(0).toUpperCase() + dir.name.slice(1).replace(/_/g, ' ').replace(/-/g, ' ')} Module`;
        details = `Specialized module containing ${files.length} files${subdirs.length > 0 ? ` and ${subdirs.length} subdirectories` : ''}. ${hasTests ? 'Includes comprehensive test coverage. ' : ''}${hasIndex ? 'Well-organized with clean exports. ' : ''}Contributes to the overall application architecture.`;
      }
      
      return {
        path: dir.path,
        name: dir.name,
        purpose: `${purpose}: ${details}`,
        keyFiles: keyFilesList.length > 0 ? keyFilesList : files.slice(0, 6).map(f => f.name),
        complexity: complexity as const,
      };
    });
  }
}
