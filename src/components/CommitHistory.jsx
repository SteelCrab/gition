import React, { useState, useEffect } from 'react';
import { GitCommit, Loader2, RefreshCw, Plus, Minus, FileText } from 'lucide-react';

const CommitHistory = ({ userId, repoName }) => {
    const [commits, setCommits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchCommits = async () => {
        if (!userId || !repoName) return;

        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/git/commits?user_id=${userId}&repo_name=${repoName}&max_count=20`);
            const data = await response.json();
            if (data.status === 'success') {
                setCommits(data.commits);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to load commits');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCommits();
    }, [userId, repoName]);

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

    if (!userId || !repoName) {
        return (
            <div className="p-3 text-center text-[11px] text-[#787774]">
                Select a repository to view commits
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#efefef]">
                <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#37352f]">
                    <GitCommit size={14} />
                    <span>Commits</span>
                </div>
                <button
                    onClick={fetchCommits}
                    disabled={loading}
                    className="p-1 hover:bg-black/5 rounded text-[#787774]"
                    title="Refresh"
                >
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Commit List */}
            <div className="overflow-y-auto max-h-[200px]">
                {loading && commits.length === 0 ? (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 size={14} className="animate-spin text-[#787774]" />
                    </div>
                ) : error ? (
                    <div className="p-2 text-center text-[11px] text-red-500">{error}</div>
                ) : commits.length === 0 ? (
                    <div className="p-3 text-center text-[11px] text-[#787774]">No commits found</div>
                ) : (
                    <div className="divide-y divide-[#efefef]">
                        {commits.map((commit) => (
                            <div key={commit.full_sha} className="px-3 py-2 hover:bg-[#f7f6f3] transition-colors">
                                <div className="flex items-start gap-2">
                                    <div className="mt-0.5">
                                        <GitCommit size={12} className="text-[#787774]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[12px] text-[#37352f] truncate font-medium">
                                            {commit.message}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1 rounded">
                                                {commit.sha}
                                            </span>
                                            <span className="text-[10px] text-[#787774]">
                                                {commit.author}
                                            </span>
                                            <span className="text-[10px] text-[#787774]">
                                                {formatDate(commit.date)}
                                            </span>
                                        </div>
                                        {(commit.stats.insertions > 0 || commit.stats.deletions > 0) && (
                                            <div className="flex items-center gap-2 mt-1 text-[10px]">
                                                <span className="flex items-center gap-0.5 text-green-600">
                                                    <Plus size={10} /> {commit.stats.insertions}
                                                </span>
                                                <span className="flex items-center gap-0.5 text-red-600">
                                                    <Minus size={10} /> {commit.stats.deletions}
                                                </span>
                                                <span className="flex items-center gap-0.5 text-[#787774]">
                                                    <FileText size={10} /> {commit.stats.files}
                                                </span>
                                            </div>
                                        )}
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
