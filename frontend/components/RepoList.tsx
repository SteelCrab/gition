/**
 * =============================================================================
 * RepoList Component
 * =============================================================================
 * 
 * Description: GitHub repository list with clone/browse functionality
 * 
 * Features:
 *   - Fetch user's repositories (public + private)
 *   - Search/filter repositories
 *   - Clone repositories to server
 *   - Browse cloned repository files
 *   - Display repository metadata (language, branch, date)
 * 
 * Props:
 *   - onRepoSelect: Callback when repository is selected
 * 
 * API:
 *   - GET /api/repos: Fetch repository list
 *   - GET /api/git/status: Check clone status
 *   - POST /api/git/clone: Clone repository
 *   - GET /api/git/files: Fetch file list
 * 
 * State:
 *   - repos: Repository list
 *   - stats: Repository counts (total, public, private)
 *   - filter: Visibility filter (all, public, private)
 *   - searchQuery: Search query
 *   - expandedRepo: Currently expanded repository ID
 *   - cloneStatus: Clone status by repo name
 *   - repoFiles: File list by repo name
 * =============================================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { GitBranch, Lock, Globe, RefreshCw, Loader2, ChevronDown, ChevronRight, ExternalLink, Download, FolderOpen, File, Folder, Search, X } from 'lucide-react';
import { bytesToSize } from '../utils/format';

// Repository interface
interface Repository {
    id: number;
    name: string;
    description?: string;
    private: boolean;
    default_branch: string;
    html_url: string;
    clone_url: string;
    updated_at: string;
    language?: string;
}

// Repository file interface
import { FileInfo } from '../types';

// RepoList Props interface
interface RepoListProps {
    onRepoSelect?: (repo: Repository) => void;
}

const RepoList = ({ onRepoSelect }: RepoListProps) => {
    // State management
    const [repos, setRepos] = useState<Repository[]>([]);
    const [stats, setStats] = useState({ total: 0, public: 0, private: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedRepo, setExpandedRepo] = useState<number | null>(null);
    const [cloneStatus, setCloneStatus] = useState<Record<string, string>>({});
    const [repoFiles, setRepoFiles] = useState<Record<string, FileInfo[]>>({});
    const [loadingFiles, setLoadingFiles] = useState<Record<string, boolean>>({});

    /**
     * Check clone status for all repositories
     * - Called after fetching repo list
     */
    const checkCloneStatuses = useCallback(async (repoList: Repository[]) => {
        const userId = localStorage.getItem('userLogin') || localStorage.getItem('userId');
        if (!userId) return;

        const statuses: Record<string, string> = {};
        // Check all repos in parallel
        await Promise.all(
            repoList.map(async (repo) => {
                try {
                    const response = await fetch(`/api/git/status?user_id=${encodeURIComponent(userId)}&repo_name=${encodeURIComponent(repo.name)}`, {
                        credentials: 'include'
                    });
                    const data = await response.json();
                    if (data.cloned) {
                        statuses[repo.name] = 'cloned';
                    }
                } catch (_err) {
                    // Ignore errors, just means not cloned
                }
            })
        );
        setCloneStatus(prev => ({ ...prev, ...statuses }));
    }, []);

    /**
     * Fetch repository list from backend
     */
    const fetchRepos = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/repos', {
                credentials: 'include'
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
        } catch (_err) {
            setError('Failed to fetch repositories');
        } finally {
            setLoading(false);
        }
    }, [checkCloneStatuses]);

    /**
     * Fetch file list for a cloned repository
     */
    const fetchFiles = useCallback(async (repoName: string) => {
        const userId = localStorage.getItem('userLogin') || localStorage.getItem('userId');
        if (!userId) return;

        setLoadingFiles(prev => ({ ...prev, [repoName]: true }));
        try {
            const response = await fetch(`/api/git/files?user_id=${encodeURIComponent(userId)}&repo_name=${encodeURIComponent(repoName)}`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.status === 'success') {
                setRepoFiles(prev => ({ ...prev, [repoName]: data.files }));
            }
        } catch (_err) {
            console.error('Failed to fetch files:', _err);
        } finally {
            setLoadingFiles(prev => ({ ...prev, [repoName]: false }));
        }
    }, []);

    // Fetch repos on component mount
    useEffect(() => {
        fetchRepos();
    }, [fetchRepos]);

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

    /**
     * Format relative date
     */
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    /**
     * Get language color for display
     */
    const getLanguageColor = (lang: string) => {
        const colors: Record<string, string> = {
            JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
            Java: '#b07219', Rust: '#dea584', Go: '#00ADD8',
            HTML: '#e34c26', CSS: '#563d7c', Ruby: '#701516',
        };
        return colors[lang] || '#8b8b8b';
    };

    /**
     * Handle clone button click
     * - If already cloned, fetch files and select repo
     * - Otherwise, clone the repository
     */
    const handleClone = async (repo: Repository, e: React.MouseEvent) => {
        e.stopPropagation();
        if (cloneStatus[repo.name] === 'cloned') {
            fetchFiles(repo.name);
            if (onRepoSelect) onRepoSelect(repo);
            return;
        }

        setCloneStatus(prev => ({ ...prev, [repo.name]: 'cloning' }));
        try {
            const userId = localStorage.getItem('userLogin') || localStorage.getItem('userId');
            const response = await fetch('/api/git/clone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    clone_url: repo.clone_url,
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
        } catch (_err) {
            setCloneStatus(prev => ({ ...prev, [repo.name]: 'error' }));
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-[#787774]" size={20} />
                <span className="ml-2 text-[13px] text-[#787774]">Loading...</span>
            </div>
        );
    }

    // Error state
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
                            {/* Repository row */}
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
                                    {/* Description */}
                                    {repo.description && (
                                        <p className="text-[12px] text-[#787774] leading-relaxed">{repo.description}</p>
                                    )}

                                    {/* Metadata badges */}
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

                                    {/* File List (for cloned repos) */}
                                    {cloneStatus[repo.name] === 'cloned' && (
                                        <div className="mt-3 border-t border-[#efefef] pt-3">
                                            <div className="text-[11px] font-medium text-[#787774] mb-2">Files</div>
                                            {loadingFiles[repo.name] ? (
                                                <div className="flex items-center gap-2 text-[11px] text-[#787774]">
                                                    <Loader2 size={12} className="animate-spin" /> Loading files...
                                                </div>
                                            ) : repoFiles[repo.name] ? (
                                                <div className="space-y-0.5 max-h-[200px] overflow-y-auto">
                                                    {repoFiles[repo.name].map((file) => (
                                                        <div
                                                            key={file.path}
                                                            className="flex items-center gap-2 px-2 py-1 hover:bg-[#f7f6f3] rounded cursor-pointer text-[12px]"
                                                            onClick={() => {/* TODO: Implement file viewing functionality */ console.log('Open file:', file.path) }}
                                                        >
                                                            {file.type === 'directory' ? (
                                                                <Folder size={12} className="text-[#787774]" />
                                                            ) : (
                                                                <File size={12} className="text-[#787774]" />
                                                            )}
                                                            <span className="truncate text-[#37352f]">{file.name}</span>
                                                            {file.size && (
                                                                <span className="text-[10px] text-[#787774] ml-auto">
                                                                    {bytesToSize(file.size)}
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
