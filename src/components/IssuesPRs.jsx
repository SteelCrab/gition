import React, { useState, useEffect } from 'react';
import { AlertCircle, GitPullRequest, MessageSquare, Loader2, RefreshCw, ExternalLink, Tag } from 'lucide-react';

const IssuesPRs = ({ owner, repoName }) => {
    const [activeTab, setActiveTab] = useState('issues');
    const [issues, setIssues] = useState([]);
    const [pulls, setPulls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchIssues = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token || !owner || !repoName) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/github/issues?owner=${owner}&repo=${repoName}&state=open`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.status === 'success') {
                setIssues(data.issues);
            }
        } catch (err) {
            setError('Failed to load issues');
        } finally {
            setLoading(false);
        }
    };

    const fetchPulls = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token || !owner || !repoName) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/github/pulls?owner=${owner}&repo=${repoName}&state=open`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.status === 'success') {
                setPulls(data.pulls);
            }
        } catch (err) {
            setError('Failed to load pull requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'issues') {
            fetchIssues();
        } else {
            fetchPulls();
        }
    }, [activeTab, owner, repoName]);

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    };

    if (!owner || !repoName) {
        return (
            <div className="p-4 text-center text-[12px] text-[#787774]">
                Select a repository to view Issues & PRs
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Tabs */}
            <div className="flex border-b border-[#efefef]">
                <button
                    onClick={() => setActiveTab('issues')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] font-medium transition-colors ${activeTab === 'issues'
                            ? 'text-[#37352f] border-b-2 border-[#37352f]'
                            : 'text-[#787774] hover:text-[#37352f]'
                        }`}
                >
                    <AlertCircle size={12} />
                    Issues ({issues.length})
                </button>
                <button
                    onClick={() => setActiveTab('pulls')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] font-medium transition-colors ${activeTab === 'pulls'
                            ? 'text-[#37352f] border-b-2 border-[#37352f]'
                            : 'text-[#787774] hover:text-[#37352f]'
                        }`}
                >
                    <GitPullRequest size={12} />
                    PRs ({pulls.length})
                </button>
                <button
                    onClick={() => activeTab === 'issues' ? fetchIssues() : fetchPulls()}
                    className="px-2 text-[#787774] hover:text-[#37352f]"
                    title="Refresh"
                >
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 size={16} className="animate-spin text-[#787774]" />
                    </div>
                ) : error ? (
                    <div className="p-4 text-center text-[12px] text-red-500">{error}</div>
                ) : activeTab === 'issues' ? (
                    issues.length === 0 ? (
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
                                        <AlertCircle size={14} className="text-green-600 mt-0.5 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[12px] font-medium text-[#37352f] leading-tight">
                                                {issue.title}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <span className="text-[10px] text-[#787774]">
                                                    #{issue.number}
                                                </span>
                                                <span className="text-[10px] text-[#787774]">
                                                    by {issue.user.login}
                                                </span>
                                                <span className="text-[10px] text-[#787774]">
                                                    {formatDate(issue.updated_at)}
                                                </span>
                                                {issue.comments > 0 && (
                                                    <span className="flex items-center gap-0.5 text-[10px] text-[#787774]">
                                                        <MessageSquare size={10} /> {issue.comments}
                                                    </span>
                                                )}
                                            </div>
                                            {issue.labels.length > 0 && (
                                                <div className="flex items-center gap-1 mt-1 flex-wrap">
                                                    {issue.labels.slice(0, 3).map((label) => (
                                                        <span
                                                            key={label.name}
                                                            className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                                                            style={{
                                                                backgroundColor: `#${label.color}20`,
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
                    pulls.length === 0 ? (
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
                                                <span className="text-[10px] text-[#787774]">
                                                    {formatDate(pr.updated_at)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 mt-1 text-[10px]">
                                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-mono">
                                                    {pr.head.ref}
                                                </span>
                                                <span className="text-[#787774]">→</span>
                                                <span className="px-1.5 py-0.5 bg-gray-100 text-[#787774] rounded font-mono">
                                                    {pr.base.ref}
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
