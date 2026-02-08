/**
 * Issue Analyzer Service
 * Fetches and classifies GitHub issues by difficulty
 */

import {
  IIssueAnalyzerService,
  IGitHubClient,
  ILLMClient,
  IRepositoryService,
} from '../types/interfaces.js';
import {
  ClassifiedIssue,
  GitHubIssue,
  IssueDifficulty,
  RepositoryAnalysis,
} from '../types/models.js';

export class IssueAnalyzerService implements IIssueAnalyzerService {
  constructor(
    private readonly githubClient: IGitHubClient,
    private readonly llmClient: ILLMClient,
    private readonly repositoryService: IRepositoryService
  ) {}

  /**
   * Fetches and classifies all open issues for a repository
   */
  async fetchAndClassifyIssues(owner: string, repo: string): Promise<ClassifiedIssue[]> {
    // Fetch open issues from GitHub
    const issues = await this.githubClient.getIssues(owner, repo, 'open');

    // Get repository analysis for context
    const repositoryUrl = `https://github.com/${owner}/${repo}`;
    const repository = await this.repositoryService.analyzeRepository(repositoryUrl);

    // Classify each issue
    const classifiedIssues = await Promise.all(
      issues.map(async (issue) => {
        const difficulty = await this.classifyIssue(issue, repository);
        return {
          issue,
          difficulty,
        };
      })
    );

    return classifiedIssues;
  }

  /**
   * Classifies a single issue's difficulty level
   */
  async classifyIssue(
    issue: GitHubIssue,
    repositoryContext: RepositoryAnalysis
  ): Promise<IssueDifficulty> {
    // Use LLM to classify issue difficulty
    const difficulty = await this.llmClient.classifyIssueDifficulty(issue, repositoryContext);
    return difficulty;
  }

  /**
   * Filters issues by difficulty level
   */
  filterIssuesByDifficulty(
    issues: ClassifiedIssue[],
    difficulty: 'beginner' | 'intermediate' | 'advanced'
  ): ClassifiedIssue[] {
    return issues.filter((classifiedIssue) => classifiedIssue.difficulty.level === difficulty);
  }
}
