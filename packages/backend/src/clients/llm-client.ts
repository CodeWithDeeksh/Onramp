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

  constructor(config: LLMConfig) {
    this.provider = config.provider;
    this.maxRetries = config.maxRetries || 3;
    this.timeout = config.timeout || 30000;

    // Set default models
    this.model =
      config.model || (config.provider === 'openai' ? 'gpt-4-turbo-preview' : 'claude-3-sonnet');

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
    const prompt = this.buildRepositorySummaryPrompt(readme, structure);
    return await this.callLLM(prompt);
  }

  /**
   * Generate architecture overview
   */
  async generateArchitectureOverview(structure: FileNode[], readme: string): Promise<string> {
    const prompt = this.buildArchitecturePrompt(structure, readme);
    return await this.callLLM(prompt);
  }

  /**
   * Explain modules
   */
  async explainModules(structure: FileNode[], readme: string): Promise<ModuleExplanation[]> {
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
  }

  /**
   * Score repository match against user profile
   */
  async scoreRepositoryMatch(
    profile: UserProfile,
    repository: RepositoryAnalysis
  ): Promise<MatchScore> {
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
  }

  /**
   * Generate contribution path
   */
  async generateContributionPath(
    profile: UserProfile,
    repository: RepositoryAnalysis
  ): Promise<ContributionPath> {
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
  }

  /**
   * Classify issue difficulty
   */
  async classifyIssueDifficulty(
    issue: GitHubIssue,
    repositoryContext: RepositoryAnalysis
  ): Promise<IssueDifficulty> {
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
    return {
      repositoryUrl: url,
      steps: [
        {
          order: 1,
          title: 'Explore the repository',
          description: text.substring(0, 200),
          files: [],
          concepts: [],
          resources: [],
        },
      ],
      estimatedTime: '2-3 hours',
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
}
