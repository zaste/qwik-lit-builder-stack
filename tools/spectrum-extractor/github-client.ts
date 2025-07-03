/**
 * GitHub API Client for Spectrum Repository Analysis
 */

export interface GitHubFileContent {
  name: string;
  path: string;
  content?: string;
  download_url?: string;
  type: 'file' | 'dir';
}

export interface GitHubRepoInfo {
  name: string;
  full_name: string;
  description: string;
  topics: string[];
  language: string;
  stargazers_count: number;
}

export class GitHubClient {
  private baseUrl = 'https://api.github.com';
  
  constructor(private token?: string) {}

  /**
   * Get repository information
   */
  async getRepository(owner: string, repo: string): Promise<GitHubRepoInfo> {
    const response = await this.makeRequest(`/repos/${owner}/${repo}`);
    return {
      name: response.name,
      full_name: response.full_name,
      description: response.description,
      topics: response.topics || [],
      language: response.language,
      stargazers_count: response.stargazers_count
    };
  }

  /**
   * Get directory contents
   */
  async getDirectoryContents(owner: string, repo: string, path: string = ''): Promise<GitHubFileContent[]> {
    const response = await this.makeRequest(`/repos/${owner}/${repo}/contents/${path}`);
    
    if (Array.isArray(response)) {
      return response.map(item => ({
        name: item.name,
        path: item.path,
        download_url: item.download_url,
        type: item.type
      }));
    }
    
    return [{
      name: response.name,
      path: response.path,
      download_url: response.download_url,
      type: response.type
    }];
  }

  /**
   * Get file content
   */
  async getFileContent(owner: string, repo: string, path: string): Promise<string> {
    const response = await this.makeRequest(`/repos/${owner}/${repo}/contents/${path}`);
    
    if (response.content) {
      // Decode base64 content
      return atob(response.content.replace(/\s/g, ''));
    }
    
    if (response.download_url) {
      // Fallback to download URL
      const fileResponse = await fetch(response.download_url);
      return await fileResponse.text();
    }
    
    throw new Error(`Cannot get content for ${path}`);
  }

  /**
   * Search for files in repository
   */
  async searchFiles(owner: string, repo: string, query: string): Promise<GitHubFileContent[]> {
    const response = await this.makeRequest(`/search/code?q=${encodeURIComponent(query)}+repo:${owner}/${repo}`);
    
    return response.items?.map((item: any) => ({
      name: item.name,
      path: item.path,
      type: 'file' as const
    })) || [];
  }

  /**
   * Make authenticated request to GitHub API
   */
  private async makeRequest(endpoint: string): Promise<any> {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Spectrum-Extractor/1.0'
    };

    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, { headers });
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('GitHub API rate limit exceeded. Consider adding a GitHub token.');
      }
      throw new Error(`GitHub API error: ${response.statusText}`);
    }
    
    return await response.json();
  }
}

/**
 * Create GitHub client instance
 */
export function createGitHubClient(token?: string): GitHubClient {
  return new GitHubClient(token);
}