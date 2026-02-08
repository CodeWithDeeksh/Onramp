/**
 * Repository Service
 * Orchestrates repository analysis by coordinating GitHub client and LLM client
 */

import {
  IRepositoryService,
  IGitHubClient,
  ILLMClient,
  ICacheStore,
} from '../types/interfaces.js';
import {
  RepositoryAnalysis,
  RepositoryMetadata,
  EntryPoint,
} from '../types/models.js';
import { RepositoryError, ErrorCode } from '../types/errors.js';
import { RepositoryAnalysisSchema } from '../validation/schemas.js';

export class RepositoryService implements IRepositoryService {
  private readonly CACHE_TTL = 3600; // 1 hour in seconds
  private readonly CACHE_KEY_PREFIX = 'repo_analysis:';

  constructor(
    private readonly githubClient: IGitHubClient,
    private readonly llmClient: ILLMClient,
    private readonly cacheStore: ICacheStore
  ) {}

  /**
   * Analyzes a GitHub repository and returns comprehensive analysis
   * Implements caching to avoid redundant API calls
   */
  async analyzeRepository(url: string): Promise<RepositoryAnalysis> {
    // Parse repository URL
    const { owner, repo } = this.parseRepositoryUrl(url);

    // Check cache first
    const cached = await this.getCachedAnalysis(owner, repo);
    if (cached) {
      return cached;
    }

    // Fetch repository data from GitHub
    const [repository, fileStructure, readme] = await Promise.all([
      this.githubClient.getRepository(owner, repo),
      this.githubClient.getFileStructure(owner, repo),
      this.githubClient.getReadme(owner, repo),
    ]);

    // Generate analysis using LLM
    const [summary, architecture, modules] = await Promise.all([
      this.llmClient.generateRepositorySummary(readme, fileStructure),
      this.llmClient.generateArchitectureOverview(fileStructure, readme),
      this.llmClient.explainModules(fileStructure, readme),
    ]);

    // Identify entry points based on file structure and modules
    const entryPoints = this.identifyEntryPoints(fileStructure, modules);

    // Build metadata
    const metadata = this.buildMetadata(repository);

    // Construct analysis result
    const analysis: RepositoryAnalysis = {
      owner,
      name: repo,
      url,
      summary,
      architecture: typeof architecture === 'string' ? JSON.parse(architecture) : architecture,
      modules,
      entryPoints,
      metadata,
      analyzedAt: new Date(),
    };

    // Validate the analysis
    RepositoryAnalysisSchema.parse(analysis);

    // Cache the result
    await this.cacheAnalysis(owner, repo, analysis);

    return analysis;
  }

  /**
   * Retrieves repository metadata without full analysis
   */
  async getRepositoryMetadata(owner: string, repo: string): Promise<RepositoryMetadata> {
    const repository = await this.githubClient.getRepository(owner, repo);
    return this.buildMetadata(repository);
  }

  /**
   * Retrieves cached analysis if available
   */
  async getCachedAnalysis(owner: string, repo: string): Promise<RepositoryAnalysis | null> {
    const key = this.buildCacheKey(owner, repo);
    const cached = await this.cacheStore.get<RepositoryAnalysis>(key);

    if (cached) {
      // Ensure dates are properly deserialized
      return {
        ...cached,
        analyzedAt: new Date(cached.analyzedAt),
        metadata: {
          ...cached.metadata,
          lastUpdated: new Date(cached.metadata.lastUpdated),
        },
      };
    }

    return null;
  }

  /**
   * Caches repository analysis
   */
  async cacheAnalysis(
    owner: string,
    repo: string,
    analysis: RepositoryAnalysis
  ): Promise<void> {
    const key = this.buildCacheKey(owner, repo);
    await this.cacheStore.set(key, analysis, this.CACHE_TTL);
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Parses GitHub repository URL and extracts owner and repo name
   */
  private parseRepositoryUrl(url: string): { owner: string; repo: string } {
    const githubUrlPattern = /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/?$/;
    const match = url.match(githubUrlPattern);

    if (!match) {
      throw new RepositoryError(
        ErrorCode.INVALID_REPOSITORY_URL,
        'Invalid GitHub repository URL format. Expected: https://github.com/{owner}/{repo}',
        { url }
      );
    }

    return {
      owner: match[1],
      repo: match[2],
    };
  }

  /**
   * Builds cache key for repository analysis
   */
  private buildCacheKey(owner: string, repo: string): string {
    return `${this.CACHE_KEY_PREFIX}${owner}/${repo}`;
  }

  /**
   * Builds repository metadata from GitHub API response
   */
  private buildMetadata(repository: any): RepositoryMetadata {
    return {
      stars: repository.stargazers_count,
      forks: repository.forks_count,
      openIssues: repository.open_issues_count,
      language: repository.language || 'Unknown',
      languages: {}, // Will be populated by GitHub API if available
      topics: repository.topics || [],
      lastUpdated: new Date(repository.updated_at),
      license: repository.license?.name || null,
    };
  }

  /**
   * Identifies entry points for beginners based on file structure and modules
   */
  private identifyEntryPoints(fileStructure: any[], modules: any[]): EntryPoint[] {
    const entryPoints: EntryPoint[] = [];

    // Common entry point files
    const commonEntryFiles = [
      'README.md',
      'CONTRIBUTING.md',
      'index.js',
      'index.ts',
      'main.js',
      'main.ts',
      'app.js',
      'app.ts',
      'server.js',
      'server.ts',
    ];

    // Find common entry files
    const findFiles = (nodes: any[], targetFiles: string[]): string[] => {
      const found: string[] = [];
      for (const node of nodes) {
        if (node.type === 'file' && targetFiles.includes(node.name)) {
          found.push(node.path);
        }
        if (node.children) {
          found.push(...findFiles(node.children, targetFiles));
        }
      }
      return found;
    };

    const foundFiles = findFiles(fileStructure, commonEntryFiles);

    // Add README as beginner entry point
    const readme = foundFiles.find((f) => f.endsWith('README.md'));
    if (readme) {
      entryPoints.push({
        file: readme,
        reason: 'Start here to understand the project overview and setup instructions',
        difficulty: 'beginner',
      });
    }

    // Add CONTRIBUTING as beginner entry point
    const contributing = foundFiles.find((f) => f.endsWith('CONTRIBUTING.md'));
    if (contributing) {
      entryPoints.push({
        file: contributing,
        reason: 'Learn how to contribute to this project',
        difficulty: 'beginner',
      });
    }

    // Add main entry file as intermediate
    const mainFile = foundFiles.find(
      (f) =>
        f.endsWith('index.js') ||
        f.endsWith('index.ts') ||
        f.endsWith('main.js') ||
        f.endsWith('main.ts') ||
        f.endsWith('app.js') ||
        f.endsWith('app.ts')
    );
    if (mainFile) {
      entryPoints.push({
        file: mainFile,
        reason: 'Main application entry point - understand the core initialization',
        difficulty: 'intermediate',
      });
    }

    // Add module entry points based on complexity
    for (const module of modules.slice(0, 3)) {
      // Top 3 modules
      if (module.keyFiles && module.keyFiles.length > 0) {
        entryPoints.push({
          file: module.keyFiles[0],
          reason: `Explore the ${module.name} module - ${module.purpose}`,
          difficulty: module.complexity === 'low' ? 'beginner' : 'intermediate',
        });
      }
    }

    return entryPoints;
  }
}
