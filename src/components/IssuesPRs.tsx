/**
 * =============================================================================
 * IssuesPRs Component
 * =============================================================================
 * 
 * Description: GitHub Issues and Pull Requests display panel
 * 
 * Features:
 *   - Tab switching between Issues and PRs
 *   - Fetch open issues/PRs from GitHub API
 *   - Display issue labels with colors
 *   - Display PR draft status
 *   - External link to GitHub
 * 
 * Props:
 *   - owner: Repository owner (username or org)
 *   - repoName: Repository name
 * 
 * API:
 *   - GET github.com/repos/{owner}/{repo}/issues
 *   - GET github.com/repos/{owner}/{repo}/pulls
 * 
 * State:
 *   - activeTab: Current tab ('issues' | 'pulls')
 *   - issues: Issues list
 *   - pulls: Pull requests list
 *   - loading: Loading state for each tab
 * =============================================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { GitPullRequest, CircleDot, ExternalLink, Loader2 } from 'lucide-react';

// Label interface
interface Label {
    id: number;
    name: string;
    color: string;
}

// User interface
interface User {
    login: string;
}

// Issue interface
interface Issue {
    id: number;
    number: number;
    title: string;
    html_url: string;
    created_at: string;
    labels: Label[];
    user: User;
    pull_request?: unknown; // Use unknown for better type safety
}

// Pull Request interface
interface PullRequest {
    id: number;
    number: number;
    title: string;
    html_url: string;
    created_at: string;
    user: User;
    draft: boolean;
}

// IssuesPRs Props interface
interface IssuesPRsProps {
    owner: string | null;      // Repository owner
    repoName: string | null;   // Repository name
}

const IssuesPRs = ({ owner, repoName }: IssuesPRsProps) => {
    // State management
    const [issues, setIssues] = useState<Issue[]>([]);
    const [pulls, setPRs] = useState<PullRequest[]>([]);
    const [loading, setLoading] = useState({ issues: true, pulls: true });
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'issues' | 'pulls'>('issues');

    /**
     * Fetch issues from GitHub API
     * - Filters out PRs (they appear in issues endpoint too)
     */
    const fetchIssues = useCallback(async () => {
        if (!owner || !repoName) return;
        setLoading(prev => ({ ...prev, issues: true }));
        setError(null);
        try {
            const token = localStorage.getItem('github_token');
            const headers: HeadersInit = {
                'Accept': 'application/vnd.github.v3+json',
            };
            if (token) headers['Authorization'] = `token ${token}`;

            const response = await fetch(
                `https://api.github.com/repos/${owner}/${repoName}/issues?state=open&per_page=10`,
                { headers }
            );

            if (!response.ok) {
                if (response.status === 403) throw new Error('API rate limit exceeded. Please log in.');
                throw new Error('Failed to fetch issues');
            }

            const data = await response.json();
            if (Array.isArray(data)) {
                setIssues(data.filter((issue: Issue) => !issue.pull_request));
            }
        } catch (err: unknown) {
            console.error('Failed to fetch issues:', err);
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
            setError(errorMessage);
        } finally {
            setLoading(prev => ({ ...prev, issues: false }));
        }
    }, [owner, repoName]);

    /**
     * Fetch pull requests from GitHub API
     */
    const fetchPulls = useCallback(async () => {
        if (!owner || !repoName) return;
        setLoading(prev => ({ ...prev, pulls: true }));
        setError(null);
        try {
            const token = localStorage.getItem('github_token');
            const headers: HeadersInit = {
                'Accept': 'application/vnd.github.v3+json',
            };
            if (token) headers['Authorization'] = `token ${token}`;

            const response = await fetch(
                `https://api.github.com/repos/${owner}/${repoName}/pulls?state=open&per_page=10`,
                { headers }
            );

            if (!response.ok) {
                if (response.status === 403) throw new Error('API rate limit exceeded. Please log in.');
                throw new Error('Failed to fetch pull requests');
            }

            const data = await response.json();
            if (Array.isArray(data)) {
                setPRs(data);
            }
        } catch (err: unknown) {
            console.error('Failed to fetch pulls:', err);
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
            setError(errorMessage);
        } finally {
            setLoading(prev => ({ ...prev, pulls: false }));
        }
    }, [owner, repoName]);

    // Fetch data on component mount
    useEffect(() => {
        fetchIssues();
        fetchPulls();
    }, [fetchIssues, fetchPulls]);

    /**
     * Format date for display
     * @param dateString ISO date string
     * @returns Formatted date string (e.g., "Jan 15, 2024")
     */
    const formatDate = (dateString: string) => {
        if (!dateString) return 'n/a';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    /**
     * Validate hex color format (Defense-in-depth)
     * @param color Hex color without # prefix
     * @returns true if valid 6-digit hex
     */
    const isValidHexColor = (color: string): boolean => {
        return /^[0-9A-Fa-f]{6}$/.test(color);
    };

    return (
        <div className="flex flex-col h-full bg-white border-l border-[#efefef]">
            {/* Tab switcher */}
            <div className="flex border-b border-[#efefef]">
                <button
                    onClick={() => { setActiveTab('issues'); setError(null); }}
                    className={`flex-1 px-4 py-3 text-[13px] font-medium transition-colors ${activeTab === 'issues' ? 'text-[#37352f] border-b-2 border-[#37352f]' : 'text-[#787774] hover:text-[#37352f]'}`}
                >
                    Issues {issues.length > 0 && `(${issues.length})`}
                </button>
                <button
                    onClick={() => { setActiveTab('pulls'); setError(null); }}
                    className={`flex-1 px-4 py-3 text-[13px] font-medium transition-colors ${activeTab === 'pulls' ? 'text-[#37352f] border-b-2 border-[#37352f]' : 'text-[#787774] hover:text-[#37352f]'}`}
                >
                    Pull Requests {pulls.length > 0 && `(${pulls.length})`}
                </button>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto">
                {error && (
                    <div className="p-4 m-3 bg-red-50 border border-red-100 rounded-[4px] text-[12px] text-red-600">
                        {error}
                        <button
                            onClick={() => activeTab === 'issues' ? fetchIssues() : fetchPulls()}
                            className="block mt-2 font-medium hover:underline"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {activeTab === 'issues' ? (
                    // Issues tab content
                    loading.issues ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 size={20} className="animate-spin text-[#787774]" />
                        </div>
                    ) : !error && issues.length === 0 ? (
                        <div className="p-4 text-center text-[12px] text-[#787774]">
                            No open issues
                        </div>
                    ) : !error && (
                        <div className="divide-y divide-[#efefef]">
                            {issues.map((issue) => (
                                <a
                                    key={issue.id}
                                    href={issue.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block px-3 py-2.5 hover:bg-[#f7f6f3] transition-colors"
                                >
                                    <div className="flex items-start gap-2">
                                        {/* Issue icon (green) */}
                                        <CircleDot size={14} className="mt-0.5 text-green-600 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            {/* Issue title */}
                                            <div className="text-[12px] font-medium text-[#37352f] leading-tight truncate">
                                                {issue.title}
                                            </div>
                                            {/* Issue number + date */}
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-[#787774]">
                                                    #{issue.number}
                                                </span>
                                                <span className="text-[10px] text-[#787774]">
                                                    {formatDate(issue.created_at)}
                                                </span>
                                            </div>
                                            {/* Labels */}
                                            {issue.labels && issue.labels.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                    {issue.labels.map(label => (
                                                        isValidHexColor(label.color) && (
                                                            <span
                                                                key={label.id}
                                                                className="px-1.5 py-0.5 rounded-[2px] text-[9px] font-medium border"
                                                                style={{
                                                                    backgroundColor: `#${label.color}20`,
                                                                    borderColor: `#${label.color}40`,
                                                                    color: `#${label.color}`
                                                                }}
                                                            >
                                                                {label.name}
                                                            </span>
                                                        )
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <ExternalLink size={10} className="text-[#787774] shrink-0" />
                                    </div>
                                </a>
                            ))}
                        </div>
                    )
                ) : (
                    // Pull Requests tab content
                    loading.pulls ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 size={20} className="animate-spin text-[#787774]" />
                        </div>
                    ) : !error && pulls.length === 0 ? (
                        <div className="p-4 text-center text-[12px] text-[#787774]">
                            No open pull requests
                        </div>
                    ) : !error && (
                        <div className="divide-y divide-[#efefef]">
                            {pulls.map((pr) => (
                                <a
                                    key={pr.id}
                                    href={pr.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block px-3 py-2.5 hover:bg-[#f7f6f3] transition-colors"
                                >
                                    <div className="flex items-start gap-2">
                                        {/* PR icon (gray for draft, green for ready) */}
                                        <GitPullRequest size={14} className={`mt-0.5 shrink-0 ${pr.draft ? 'text-gray-400' : 'text-green-600'}`} />
                                        <div className="flex-1 min-w-0">
                                            {/* PR title with draft indicator */}
                                            <div className="text-[12px] font-medium text-[#37352f] leading-tight">
                                                {pr.draft && <span className="text-[#787774]">[Draft] </span>}
                                                {pr.title}
                                            </div>
                                            {/* PR number + author */}
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-[#787774]">
                                                    #{pr.number}
                                                </span>
                                                <span className="text-[10px] text-[#787774]">
                                                    by {pr.user.login}
                                                </span>
                                            </div>
                                        </div>
                                        <ExternalLink size={10} className="text-[#787774] shrink-0" />
                                    </div>
                                </a>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default IssuesPRs;
