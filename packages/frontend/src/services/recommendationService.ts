import apiClient from './api';
import type {
  ProjectRecommendation,
  RecommendationRequest,
} from '../types';

// Mock recommendations for demo mode
const getMockRecommendations = (userId: string): ProjectRecommendation[] => {
  return [
    {
      repository: {
        owner: 'facebook',
        name: 'react',
        url: 'https://github.com/facebook/react',
        summary: 'A JavaScript library for building user interfaces. React makes it painless to create interactive UIs.',
        architecture: {
          description: 'Component-based architecture with virtual DOM',
          patterns: ['Component-Based', 'Unidirectional Data Flow'],
          technologies: ['JavaScript', 'JSX', 'Babel'],
          keyComponents: ['React Core', 'React DOM', 'Reconciler']
        },
        modules: [
          {
            path: 'packages/react',
            name: 'react',
            purpose: 'Core React library',
            keyFiles: ['React.js', 'ReactElement.js'],
            complexity: 'medium' as const
          }
        ],
        entryPoints: [
          {
            file: 'README.md',
            reason: 'Start with the official documentation',
            difficulty: 'beginner' as const
          }
        ],
        metadata: {
          stars: 220000,
          forks: 45000,
          openIssues: 1200,
          language: 'JavaScript',
          languages: { JavaScript: 80, TypeScript: 20 },
          topics: ['react', 'javascript', 'ui', 'frontend'],
          lastUpdated: new Date(),
          license: 'MIT'
        },
        analyzedAt: new Date()
      },
      score: 95,
      reasoning: 'Perfect match for your JavaScript and React skills. Great for learning modern UI development.',
      matchedSkills: ['JavaScript', 'React'],
      matchedInterests: ['web development', 'frontend']
    },
    {
      repository: {
        owner: 'microsoft',
        name: 'vscode',
        url: 'https://github.com/microsoft/vscode',
        summary: 'Visual Studio Code - Open source code editor. Built with web technologies.',
        architecture: {
          description: 'Electron-based desktop application',
          patterns: ['MVC', 'Extension-Based'],
          technologies: ['TypeScript', 'Electron', 'Node.js'],
          keyComponents: ['Editor', 'Extensions', 'Workbench']
        },
        modules: [
          {
            path: 'src/vs',
            name: 'vs',
            purpose: 'Core VS Code modules',
            keyFiles: ['workbench.ts', 'editor.ts'],
            complexity: 'high' as const
          }
        ],
        entryPoints: [
          {
            file: 'CONTRIBUTING.md',
            reason: 'Learn how to contribute to VS Code',
            difficulty: 'intermediate' as const
          }
        ],
        metadata: {
          stars: 160000,
          forks: 28000,
          openIssues: 5000,
          language: 'TypeScript',
          languages: { TypeScript: 90, JavaScript: 10 },
          topics: ['vscode', 'editor', 'typescript'],
          lastUpdated: new Date(),
          license: 'MIT'
        },
        analyzedAt: new Date()
      },
      score: 88,
      reasoning: 'Great for TypeScript developers. Large, well-maintained project with good documentation.',
      matchedSkills: ['TypeScript', 'JavaScript'],
      matchedInterests: ['development tools']
    },
    {
      repository: {
        owner: 'vercel',
        name: 'next.js',
        url: 'https://github.com/vercel/next.js',
        summary: 'The React Framework for Production. Next.js gives you the best developer experience.',
        architecture: {
          description: 'Full-stack React framework',
          patterns: ['Server-Side Rendering', 'Static Generation'],
          technologies: ['React', 'Node.js', 'Webpack'],
          keyComponents: ['Router', 'Compiler', 'Server']
        },
        modules: [
          {
            path: 'packages/next',
            name: 'next',
            purpose: 'Core Next.js framework',
            keyFiles: ['server.ts', 'router.ts'],
            complexity: 'medium' as const
          }
        ],
        entryPoints: [
          {
            file: 'contributing.md',
            reason: 'Start contributing to Next.js',
            difficulty: 'intermediate' as const
          }
        ],
        metadata: {
          stars: 120000,
          forks: 25000,
          openIssues: 2000,
          language: 'JavaScript',
          languages: { JavaScript: 60, TypeScript: 40 },
          topics: ['nextjs', 'react', 'ssr', 'framework'],
          lastUpdated: new Date(),
          license: 'MIT'
        },
        analyzedAt: new Date()
      },
      score: 92,
      reasoning: 'Excellent for React developers wanting to learn full-stack development.',
      matchedSkills: ['React', 'JavaScript'],
      matchedInterests: ['web development', 'full-stack']
    }
  ];
};

export const recommendationService = {
  /**
   * Get project recommendations for a user
   */
  getRecommendations: async (
    userId: string,
    limit?: number
  ): Promise<ProjectRecommendation[]> => {
    try {
      const response = await apiClient.post<ProjectRecommendation[]>(
        '/recommendations',
        { userId, limit } as RecommendationRequest
      );
      return response.data;
    } catch (error) {
      // Fallback to mock recommendations if API fails
      console.log('API unavailable, using mock recommendations');
      const mockRecs = getMockRecommendations(userId);
      return limit ? mockRecs.slice(0, limit) : mockRecs;
    }
  },
};
