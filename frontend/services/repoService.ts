export interface FileContentResponse {
  status: string;
  content?: string;
  binary?: boolean;
  message?: string;
}

export const repoService = {
  async fetchFileContent(
    userId: string,
    repoName: string,
    filePath: string,
    branch: string
  ): Promise<FileContentResponse> {
    const response = await fetch(
      `/api/git/file?user_id=${encodeURIComponent(userId)}&repo_name=${encodeURIComponent(repoName)}&path=${encodeURIComponent(filePath)}&branch=${encodeURIComponent(branch)}`,
      { credentials: 'include' }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch file');
    }

    return response.json();
  },

  async fetchReadme(
    userId: string,
    repoName: string,
    branch: string
  ): Promise<FileContentResponse> {
    const response = await fetch(
      `/api/git/file?user_id=${encodeURIComponent(userId)}&repo_name=${encodeURIComponent(repoName)}&path=${encodeURIComponent('README.md')}&branch=${encodeURIComponent(branch)}`,
      { credentials: 'include' }
    );

    if (!response.ok) {
      return { status: 'error', message: 'README not found' };
    }

    return response.json();
  }
};