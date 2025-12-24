/**
 * =============================================================================
 * CommitHistory Component
 * =============================================================================
 * 
 * Description: Git commit history display panel
 * 
 * Features:
 *   - Fetch commit list (API call)
 *   - Display commit message, SHA, date
 *   - Loading/error/empty state handling
 * 
 * Props:
 *   - userId: GitHub user ID
 *   - repoName: Repository name
 * 
 * API:
 *   - GET /api/git/commits?user_id={}&repo_name={}
 * 
 * Display Info:
 *   - Commit message (first line only)
 *   - SHA (first 7 characters)
 *   - Date (Month Day format)
 * =============================================================================
 */

// Download: https://lucide.dev/icons/download
import { useState, useEffect, useCallback } from 'react';
import { History, GitCommit, Loader2, Download } from 'lucide-react';

// Commit info interface
interface Commit {
    message: string;    // Commit message
    sha: string;        // Commit SHA
    date: string;       // Commit date (ISO format)
}

// CommitHistory Props interface
interface CommitHistoryProps {
    userId: string | null;    // User ID
    repoName: string;         // Repository name
}

const CommitHistory = ({ userId, repoName }: CommitHistoryProps) => {
    // State management
    const [commits, setCommits] = useState<Commit[]>([]);
    const [loading, setLoading] = useState(false);
    const [pulling, setPulling] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetch commit history API call
     * - Re-fetches when userId or repoName changes
     */
    const fetchCommits = useCallback(async () => {
        console.log('Fetching commits for:', userId, repoName);
        if (!userId || !repoName) {
            console.warn('Missing userId or repoName');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/git/commits?user_id=${userId}&repo_name=${repoName}`);
            const data = await response.json();
            if (data.status === 'success') {
                setCommits(data.commits || []);
            } else {
                setError(data.message || 'Failed to fetch commits');
            }
        } catch (err: unknown) {
            console.error('Failed to fetch commits:', err);
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [userId, repoName]);

    // Fetch commits on component mount
    useEffect(() => {
        fetchCommits();
    }, [fetchCommits]);

    /**
     * Pull latest changes from remote
     */
    const pullRepo = async () => {
        if (!userId || !repoName) return;
        setPulling(true);
        setError(null);
        try {
            const response = await fetch('/api/git/pull', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, repo_name: repoName })
            });

            if (!response.ok) {
                let errorMessage = `Server error: ${response.status}`;
                try {
                    const errorData = await response.json();
                    if (errorData.message) {
                        errorMessage += ` - ${errorData.message}`;
                    }
                } catch {
                    // Fallback to text if JSON parsing fails
                    const text = await response.text();
                    if (text) errorMessage += ` - ${text.substring(0, 100)}`;
                }
                setError(errorMessage);
                return;
            }

            const data = await response.json();
            if (data.status === 'success') {
                // After pull, refresh commits
                await fetchCommits();
            } else {
                setError(data.message || 'Failed to pull');
            }
        } catch (err: unknown) {
            console.error('Failed to pull:', err);
            const errorMessage = err instanceof Error ? err.message : 'An unexpected network error occurred';
            setError(errorMessage);
        } finally {
            setPulling(false);
        }
    };

    /**
     * Format date
     * @param dateString ISO date string
     * @returns "Jan 15" format string or "Invalid Date"
     */
    const formatDate = (dateString: string) => {
        if (!dateString) return 'n/a';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="flex flex-col h-full bg-[#fcfcfc]">
            {/* Header */}
            <div className="px-3 py-2 border-b border-[#efefef] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <History size={14} className="text-[#787774]" />
                    <span className="text-[12px] font-semibold text-[#787774] uppercase tracking-wider">
                        Commit History
                    </span>
                </div>
                <button
                    onClick={pullRepo}
                    disabled={pulling || loading}
                    className="p-1 hover:bg-black/5 rounded transition-colors disabled:opacity-50 relative z-10"
                    title="Pull from remote"
                >
                    <Download size={12} className={`text-[#787774] ${pulling ? 'animate-bounce' : ''}`} />
                </button>
            </div>

            {/* Commit list */}
            <div className="flex-1 overflow-y-auto p-2">
                {error && (
                    <div className="p-3 m-1 bg-red-50 border border-red-100 rounded-[4px] text-[12px] text-red-600">
                        {error}
                        <button
                            onClick={() => fetchCommits()}
                            className="block mt-1 font-medium hover:underline"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {loading && commits.length === 0 ? (
                    // Loading state
                    <div className="flex items-center justify-center py-8">
                        <Loader2 size={20} className="animate-spin text-[#787774]" />
                    </div>
                ) : !error && commits.length === 0 ? (
                    // Empty state
                    <div className="py-4 text-center text-[12px] text-[#787774]">
                        No commits found
                    </div>
                ) : !error && (
                    // Commit item list
                    <div className="space-y-1">
                        {commits.map((commit) => (
                            <div
                                key={commit.sha}
                                className="p-2 hover:bg-black/5 rounded-[4px] transition-colors group cursor-default"
                            >
                                <div className="flex items-start gap-2">
                                    {/* Commit icon */}
                                    <GitCommit size={14} className="mt-0.5 text-[#2383e2] shrink-0" />

                                    <div className="flex-1 min-w-0">
                                        {/* Commit message */}
                                        <div className="text-[13px] text-[#37352f] font-medium leading-tight truncate">
                                            {commit.message}
                                        </div>

                                        {/* SHA + Date */}
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-[#787774] font-mono">
                                                {commit.sha ? commit.sha.substring(0, 7) : ''}
                                            </span>
                                            <span className="text-[10px] text-[#787774]">
                                                {formatDate(commit.date)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommitHistory;
