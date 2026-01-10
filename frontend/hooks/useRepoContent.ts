import { useState, useEffect, useMemo } from 'react';
import { repoService } from '../services/repoService';

export const useRepoContent = (
  owner: string | undefined,
  repoName: string | undefined,
  branchName: string | undefined,
  filePath: string | undefined
) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = useMemo(() => 
    localStorage.getItem('userLogin') || localStorage.getItem('userId') || owner,
    [owner]
  );
  const currentBranch = branchName || 'main';

  useEffect(() => {
    const fetchContent = async () => {
      if (!owner || !repoName || !branchName) return;

      setLoading(true);
      setError(null);
      setContent(null);

      try {
        if (filePath) {
          // Fetch specific file
          const data = await repoService.fetchFileContent(
            userId || '',
            repoName,
            filePath,
            currentBranch
          );

          if (data.status === 'success') {
            setContent(data.binary ? '[Binary file - cannot display]' : data.content || '');
          } else {
            throw new Error(data.message || 'Error loading content');
          }
        } else {
          // Fetch README for repo root
          const data = await repoService.fetchReadme(userId || '', repoName, currentBranch);
          
          if (data.status === 'success' && !data.binary) {
            setContent(data.content || null);
          } else {
            setContent(null);
          }
        }
      } catch (err: unknown) {
        console.error("[Internal] Failed to fetch content");
        setError("Failed to load content. The file might be missing or there's a connection issue.");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [owner, repoName, filePath, branchName, userId]);

  return {
    content,
    loading,
    error,
    userId,
    currentBranch
  };
};