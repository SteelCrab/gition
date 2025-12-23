import { useState, useEffect, useCallback } from 'react';
import { GitPullRequest, CircleDot, ExternalLink, Loader2 } from 'lucide-react';

interface Label {
    id: number;
    name: string;
    color: string;
}

interface User {
    login: string;
}

interface Issue {
    id: number;
    number: number;
    title: string;
    html_url: string;
    created_at: string;
    labels: Label[];
    user: User;
    pull_request?: object;
}

interface PullRequest {
    id: number;
    number: number;
    title: string;
    html_url: string;
    created_at: string;
    user: User;
    draft: boolean;
}

interface IssuesPRsProps {
    owner: string | null;
    repoName: string | null;
}

const IssuesPRs = ({ owner, repoName }: IssuesPRsProps) => {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [pulls, setPRs] = useState<PullRequest[]>([]);
    const [loading, setLoading] = useState({ issues: true, pulls: true });
    const [activeTab, setActiveTab] = useState<'issues' | 'pulls'>('issues');

    const fetchIssues = useCallback(async () => {
        if (!owner || !repoName) return;
        setLoading(prev => ({ ...prev, issues: true }));
        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repoName}/issues?state=open&per_page=10`);
            const data = await response.json();
            if (Array.isArray(data)) {
                // Filter out pull requests as GitHub API returns both in issues endpoint
                setIssues(data.filter((issue: Issue) => !issue.pull_request));
            }
        } catch (_err) {
            console.error('Failed to fetch issues:', _err);
        } finally {
            setLoading(prev => ({ ...prev, issues: false }));
        }
    }, [owner, repoName]);

    const fetchPulls = useCallback(async () => {
        if (!owner || !repoName) return;
        setLoading(prev => ({ ...prev, pulls: true }));
        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repoName}/pulls?state=open&per_page=10`);
            const data = await response.json();
            if (Array.isArray(data)) {
                setPRs(data);
            }
        } catch (_err) {
            console.error('Failed to fetch pulls:', _err);
        } finally {
            setLoading(prev => ({ ...prev, pulls: false }));
        }
    }, [owner, repoName]);

    useEffect(() => {
        fetchIssues();
        fetchPulls();
    }, [fetchIssues, fetchPulls]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="flex flex-col h-full bg-white border-l border-[#efefef]">
            <div className="flex border-b border-[#efefef]">
                <button
                    onClick={() => setActiveTab('issues')}
                    className={`flex-1 px-4 py-3 text-[13px] font-medium transition-colors ${activeTab === 'issues' ? 'text-[#37352f] border-b-2 border-[#37352f]' : 'text-[#787774] hover:text-[#37352f]'}`}
                >
                    Issues {issues.length > 0 && `(${issues.length})`}
                </button>
                <button
                    onClick={() => setActiveTab('pulls')}
                    className={`flex-1 px-4 py-3 text-[13px] font-medium transition-colors ${activeTab === 'pulls' ? 'text-[#37352f] border-b-2 border-[#37352f]' : 'text-[#787774] hover:text-[#37352f]'}`}
                >
                    Pull Requests {pulls.length > 0 && `(${pulls.length})`}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {activeTab === 'issues' ? (
                    loading.issues ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 size={20} className="animate-spin text-[#787774]" />
                        </div>
                    ) : issues.length === 0 ? (
                        <div className="p-4 text-center text-[12px] text-[#787774]">
                            No open issues
                        </div>
                    ) : (
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
                                        <CircleDot size={14} className="mt-0.5 text-green-600 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[12px] font-medium text-[#37352f] leading-tight truncate">
                                                {issue.title}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-[#787774]">
                                                    #{issue.number}
                                                </span>
                                                <span className="text-[10px] text-[#787774]">
                                                    {formatDate(issue.created_at)}
                                                </span>
                                            </div>
                                            {issue.labels && issue.labels.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                    {issue.labels.map(label => (
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
                    loading.pulls ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 size={20} className="animate-spin text-[#787774]" />
                        </div>
                    ) : pulls.length === 0 ? (
                        <div className="p-4 text-center text-[12px] text-[#787774]">
                            No open pull requests
                        </div>
                    ) : (
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
                                        <GitPullRequest size={14} className={`mt-0.5 shrink-0 ${pr.draft ? 'text-gray-400' : 'text-green-600'}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[12px] font-medium text-[#37352f] leading-tight">
                                                {pr.draft && <span className="text-[#787774]">[Draft] </span>}
                                                {pr.title}
                                            </div>
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
