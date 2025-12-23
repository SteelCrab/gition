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

import { useState, useEffect, useCallback } from 'react';
import { History, GitCommit, Loader2 } from 'lucide-react';

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

    /**
     * Fetch commit history API call
     * - Re-fetches when userId or repoName changes
     */
    const fetchCommits = useCallback(async () => {
        if (!userId || !repoName) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/git/commits?user_id=${userId}&repo_name=${repoName}`);
            const data = await response.json();
            if (data.status === 'success') {
                setCommits(data.commits || []);
            }
        } catch (_err) {
            console.error('Failed to fetch commits:', _err);
        } finally {
            setLoading(false);
        }
    }, [userId, repoName]);

    // Fetch commits on component mount
    useEffect(() => {
        fetchCommits();
    }, [fetchCommits]);

    /**
     * Format date
     * @param dateString ISO date string
     * @returns "Jan 15" format string
     */
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="flex flex-col h-full bg-[#fcfcfc]">
            {/* Header */}
            <div className="px-3 py-2 border-b border-[#efefef] flex items-center gap-2">
                <History size={14} className="text-[#787774]" />
                <span className="text-[12px] font-semibold text-[#787774] uppercase tracking-wider">
                    Commit History
                </span>
            </div>

            {/* Commit list */}
            <div className="flex-1 overflow-y-auto p-2">
                {loading && commits.length === 0 ? (
                    // Loading state
                    <div className="flex items-center justify-center py-8">
                        <Loader2 size={20} className="animate-spin text-[#787774]" />
                    </div>
                ) : commits.length === 0 ? (
                    // Empty state
                    <div className="py-4 text-center text-[12px] text-[#787774]">
                        No commits found
                    </div>
                ) : (
                    // Commit item list
                    <div className="space-y-1">
                        {commits.map((commit, idx) => (
                            <div
                                key={idx}
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
