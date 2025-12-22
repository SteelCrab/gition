import React, { useState, useEffect } from 'react';
import { GitBranch, Lock, Globe, Star, RefreshCw, Loader2, ChevronDown, ChevronRight, ExternalLink, Download, FolderOpen, File, Folder, Search, X } from 'lucide-react';

const RepoList = ({ onRepoSelect }) => {
    const [repos, setRepos] = useState([]);
    const [stats, setStats] = useState({ total: 0, public: 0, private: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedRepo, setExpandedRepo] = useState(null);
    const [cloneStatus, setCloneStatus] = useState({});
    const [repoFiles, setRepoFiles] = useState({});
    const [loadingFiles, setLoadingFiles] = useState({});

    const fetchRepos = async () => {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('githubToken');
        if (!token) {
            setError('Not authenticated');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/repos', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.error) {
                setError(data.error);
            } else {
                setRepos(data.repos);
                setStats({ total: data.total, public: data.public, private: data.private });
                // Check clone status for each repo
                checkCloneStatuses(data.repos);
            }
        } catch (err) {
            setError('Failed to fetch repositories');
        } finally {
            setLoading(false);
        }
    };

    const checkCloneStatuses = async (repoList) => {
        const userId = localStorage.getItem('userId') || localStorage.getItem('userLogin');
        if (!userId) return;

        const statuses = {};
        // Check all repos in parallel
        await Promise.all(
            repoList.map(async (repo) => {
                try {
                    const response = await fetch(`/api/git/status?user_id=${userId}&repo_name=${repo.name}`);
                    const data = await response.json();
                    if (data.cloned) {
                        statuses[repo.name] = 'cloned';
                    }
                } catch (err) {
                    // Ignore errors, just means not cloned
                }
            })
        );
        setCloneStatus(prev => ({ ...prev, ...statuses }));
    };

    const fetchFiles = async (repoName) => {
        const userId = localStorage.getItem('userId') || localStorage.getItem('userLogin');
        if (!userId) return;

        setLoadingFiles(prev => ({ ...prev, [repoName]: true }));
        try {
            const response = await fetch(`/api/git/files?user_id=${userId}&repo_name=${repoName}`);
            const data = await response.json();
            if (data.status === 'success') {
                setRepoFiles(prev => ({ ...prev, [repoName]: data.files }));
            }
        } catch (err) {
            console.error('Failed to fetch files:', err);
        } finally {
            setLoadingFiles(prev => ({ ...prev, [repoName]: false }));
        }
    };

    useEffect(() => {
        fetchRepos();
    }, []);

    // Filter repos by search query and visibility filter
    const filteredRepos = repos.filter(repo => {
        const matchesFilter = filter === 'all' ||
            (filter === 'public' && !repo.private) ||
            (filter === 'private' && repo.private);
        const matchesSearch = !searchQuery ||
            repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesFilter && matchesSearch;
    });

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    };

    const getLanguageColor = (lang) => {
        const colors = {
            JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
            Java: '#b07219', Rust: '#dea584', Go: '#00ADD8',
            HTML: '#e34c26', CSS: '#563d7c', Ruby: '#701516',
        };
        return colors[lang] || '#8b8b8b';
    };

    const handleClone = async (repo, e) => {
        e.stopPropagation();
        if (cloneStatus[repo.name] === 'cloned') {
            fetchFiles(repo.name);
            if (onRepoSelect) onRepoSelect(repo);
            return;
        }

        setCloneStatus(prev => ({ ...prev, [repo.name]: 'cloning' }));
        try {
            const userId = localStorage.getItem('userId') || localStorage.getItem('userLogin');
            const token = localStorage.getItem('githubToken');
            const response = await fetch('/api/git/clone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clone_url: repo.clone_url,
                    access_token: token,
                    user_id: userId,
                    repo_name: repo.name
                })
            });
            const result = await response.json();
            if (result.status === 'success' || result.status === 'exists') {
                setCloneStatus(prev => ({ ...prev, [repo.name]: 'cloned' }));
                fetchFiles(repo.name);
            } else {
                setCloneStatus(prev => ({ ...prev, [repo.name]: 'error' }));
            }
        } catch (err) {
            setCloneStatus(prev => ({ ...prev, [repo.name]: 'error' }));
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-[#787774]" size={20} />
                <span className="ml-2 text-[13px] text-[#787774]">Loading...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-6 px-2">
                <p className="text-red-500 text-[13px] mb-3">{error}</p>
                <button onClick={fetchRepos} className="px-3 py-1.5 bg-black text-white rounded-[6px] text-[12px] hover:bg-[#37352f]">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Search Input */}
            <div className="relative px-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#787774]" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search repositories..."
                    className="w-full pl-8 pr-8 py-1.5 text-[12px] bg-[#f7f6f3] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#37352f]/20"
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#787774] hover:text-[#37352f]">
                        <X size={12} />
                    </button>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 px-1">
                {[
                    { key: 'all', label: 'All', count: stats.total },
                    { key: 'public', label: 'Public', count: stats.public, icon: Globe },
                    { key: 'private', label: 'Private', count: stats.private, icon: Lock },
                ].map(({ key, label, count, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-[4px] text-[11px] font-medium transition-colors ${filter === key ? 'bg-[#37352f] text-white' : 'text-[#787774] hover:bg-black/5'
                            }`}
                    >
                        {Icon && <Icon size={10} />}
                        {label}
                        <span className={`ml-0.5 ${filter === key ? 'text-white/70' : 'text-[#787774]/60'}`}>{count}</span>
                    </button>
                ))}
                <button onClick={fetchRepos} className="ml-auto p-1 hover:bg-black/5 rounded-[3px] text-[#787774]" title="Refresh">
                    <RefreshCw size={12} />
                </button>
            </div>

            {/* Repo List */}
            <div className="space-y-1">
                {filteredRepos.length === 0 ? (
                    <p className="text-center text-[13px] text-[#787774] py-4">
                        {searchQuery ? `No results for "${searchQuery}"` : 'No repositories found'}
                    </p>
                ) : (
                    filteredRepos.map((repo) => (
                        <div key={repo.id} className="group">
                            <div
                                className={`flex items-center gap-2 p-2 rounded-[6px] cursor-pointer transition-all ${expandedRepo === repo.id ? 'bg-[#f7f6f3]' : 'hover:bg-[#f7f6f3]/60'
                                    }`}
                                onClick={() => setExpandedRepo(expandedRepo === repo.id ? null : repo.id)}
                            >
                                <div className="shrink-0 text-[#787774]">
                                    {expandedRepo === repo.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-medium text-[13px] text-[#37352f] truncate">{repo.name}</span>
                                        {repo.private ? <Lock size={10} className="text-yellow-600 shrink-0" /> : <Globe size={10} className="text-green-600 shrink-0" />}
                                        {cloneStatus[repo.name] === 'cloned' && (
                                            <span className="text-[9px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full">cloned</span>
                                        )}
                                    </div>
                                </div>
                                {repo.language && (
                                    <span className="flex items-center gap-1 text-[11px] text-[#787774] shrink-0">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getLanguageColor(repo.language) }} />
                                    </span>
                                )}
                            </div>

                            {/* Expanded Details */}
                            {expandedRepo === repo.id && (
                                <div className="ml-6 mr-2 mb-2 p-3 bg-white border border-[#efefef] rounded-[8px] space-y-3">
                                    {repo.description && (
                                        <p className="text-[12px] text-[#787774] leading-relaxed">{repo.description}</p>
                                    )}

                                    <div className="flex flex-wrap gap-2 text-[11px]">
                                        <span className="flex items-center gap-1 px-2 py-0.5 bg-[#f7f6f3] rounded-full text-[#787774]">
                                            <GitBranch size={10} />{repo.default_branch}
                                        </span>
                                        <span className="px-2 py-0.5 bg-[#f7f6f3] rounded-full text-[#787774]">
                                            Updated {formatDate(repo.updated_at)}
                                        </span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); window.open(repo.html_url, '_blank'); }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#37352f] text-white rounded-[6px] text-[11px] font-medium hover:bg-black transition-colors"
                                        >
                                            <ExternalLink size={11} />GitHub
                                        </button>
                                        <button
                                            onClick={(e) => handleClone(repo, e)}
                                            disabled={cloneStatus[repo.name] === 'cloning'}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[11px] font-medium transition-colors ${cloneStatus[repo.name] === 'cloned'
                                                ? 'bg-green-500 text-white hover:bg-green-600'
                                                : cloneStatus[repo.name] === 'cloning'
                                                    ? 'bg-gray-200 text-gray-500 cursor-wait'
                                                    : 'border border-[#e0e0e0] text-[#37352f] hover:bg-[#f7f6f3]'
                                                }`}
                                        >
                                            {cloneStatus[repo.name] === 'cloning' ? (
                                                <><Loader2 size={11} className="animate-spin" /> Cloning...</>
                                            ) : cloneStatus[repo.name] === 'cloned' ? (
                                                <><FolderOpen size={11} /> Open</>
                                            ) : (
                                                <><Download size={11} /> Clone</>
                                            )}
                                        </button>
                                    </div>

                                    {/* File List */}
                                    {cloneStatus[repo.name] === 'cloned' && (
                                        <div className="mt-3 border-t border-[#efefef] pt-3">
                                            <div className="text-[11px] font-medium text-[#787774] mb-2">Files</div>
                                            {loadingFiles[repo.name] ? (
                                                <div className="flex items-center gap-2 text-[11px] text-[#787774]">
                                                    <Loader2 size={12} className="animate-spin" /> Loading files...
                                                </div>
                                            ) : repoFiles[repo.name] ? (
                                                <div className="space-y-0.5 max-h-[200px] overflow-y-auto">
                                                    {repoFiles[repo.name].map((file, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="flex items-center gap-2 px-2 py-1 hover:bg-[#f7f6f3] rounded cursor-pointer text-[12px]"
                                                            onClick={() => console.log('Open file:', file.path)}
                                                        >
                                                            {file.type === 'directory' ? (
                                                                <Folder size={12} className="text-[#787774]" />
                                                            ) : (
                                                                <File size={12} className="text-[#787774]" />
                                                            )}
                                                            <span className="truncate text-[#37352f]">{file.name}</span>
                                                            {file.size && (
                                                                <span className="text-[10px] text-[#787774] ml-auto">
                                                                    {file.size > 1024 ? `${(file.size / 1024).toFixed(1)}KB` : `${file.size}B`}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => fetchFiles(repo.name)}
                                                    className="text-[11px] text-blue-500 hover:underline"
                                                >
                                                    Load files
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default RepoList;
