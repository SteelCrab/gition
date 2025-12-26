/**
 * =============================================================================
 * BranchSelector Component
 * =============================================================================
 * 
 * Description: Git branch selection dropdown with filter and search
 * 
 * Features:
 *   - Fetch all branches for a repository (local + remote)
 *   - Display current branch with badge
 *   - Local/Remote branch type badges
 *   - Filter tabs (All / Local / Remote)
 *   - Branch search functionality
 *   - Loading state indicator
 * 
 * Props:
 *   - userId: GitHub user ID
 *   - repoName: Repository name
 *   - onBranchChange: Callback when branch changes
 * 
 * API:
 *   - GET /api/git/branches: Fetch branch list
 * =============================================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { GitBranch, ChevronDown, Loader2, Search, X, Globe, HardDrive } from 'lucide-react';

// Branch info interface
interface Branch {
    name: string;              // Branch name
    type: 'local' | 'remote';  // Branch type
    is_current: boolean;       // Whether currently checked out
    commit_sha?: string;       // Latest commit SHA
    commit_message?: string;   // Latest commit message
}

// Filter type
type FilterType = 'all' | 'local' | 'remote';

// BranchSelector Props interface
interface BranchSelectorProps {
    userId: string | null;                        // GitHub user ID
    repoName: string;                             // Repository name
    onBranchChange?: (branchName: string) => void; // Branch change callback
}

const BranchSelector = ({ userId, repoName, onBranchChange }: BranchSelectorProps) => {
    // State management
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string>('main');
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [switching, setSwitching] = useState(false);
    const [filter, setFilter] = useState<FilterType>('all');
    const [searchQuery, setSearchQuery] = useState('');

    /**
     * Fetch branch list API call
     */
    const fetchBranches = useCallback(async () => {
        if (!userId || !repoName) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/git/branches?user_id=${encodeURIComponent(userId)}&repo_name=${encodeURIComponent(repoName)}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch branches: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server returned non-JSON response');
            }

            const data = await response.json();
            if (data.status === 'success') {
                const branchList = (data.branches || []) as Branch[];
                setBranches(branchList);

                // Auto-select current branch, default to 'main' if none
                const currentBranch = branchList.find(b => b.is_current);
                if (currentBranch) {
                    setSelectedBranch(currentBranch.name);
                } else {
                    // Prefer 'main' branch as default
                    const mainBranch = branchList.find(b => b.name === 'main');
                    if (mainBranch) {
                        setSelectedBranch('main');
                    } else if (branchList.length > 0) {
                        setSelectedBranch(branchList[0].name);
                    }
                }
            } else {
                throw new Error(data.message || 'Unknown error');
            }
        } catch (_err) {
            console.error('Failed to fetch branches:', _err);
        } finally {
            setLoading(false);
        }
    }, [userId, repoName]);

    // Fetch branches on component mount
    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    /**
     * Branch selection handler - calls checkout API
     */
    const handleBranchSelect = async (branch: Branch) => {
        // Skip if already on this branch
        if (branch.is_current) {
            setIsOpen(false);
            setSearchQuery('');
            return;
        }

        setSwitching(true);
        try {
            const response = await fetch('/api/git/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    repo_name: repoName,
                    branch_name: branch.name
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Checkout failed (${response.status}): ${errorText}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server returned non-JSON response');
            }

            const data = await response.json();

            if (data.status === 'success') {
                setSelectedBranch(branch.name);
                setIsOpen(false);
                setSearchQuery('');
                onBranchChange?.(branch.name);

                // Refresh branch list to update current badge
                await fetchBranches();
            } else {
                throw new Error(data.message || 'Unknown error');
            }
        } catch (err) {
            console.error('Checkout error:', err);
            alert(err instanceof Error ? err.message : 'Failed to switch branch. Please try again.');
        } finally {
            setSwitching(false);
        }
    };

    // Filter and search branches
    const filteredBranches = branches.filter(branch => {
        const matchesFilter = filter === 'all' || branch.type === filter;
        const matchesSearch = !searchQuery ||
            branch.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    // Count by type
    const localCount = branches.filter(b => b.type === 'local').length;
    const remoteCount = branches.filter(b => b.type === 'remote').length;

    // Don't render if no repoName
    if (!repoName) return null;

    return (
        <div className="relative">
            {/* Branch selector button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={switching}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-[3px] transition-colors ${switching ? 'opacity-50 cursor-not-allowed bg-black/5' : 'hover:bg-black/5'
                    }`}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label={`Current branch: ${selectedBranch}. Click to change.`}
            >
                {switching ? (
                    <Loader2 size={14} className="animate-spin text-[#787774]" />
                ) : (
                    <GitBranch size={14} className="text-[#787774]" />
                )}
                <span className="text-[13px] font-medium text-[#37352f] truncate max-w-[120px]">
                    {switching ? 'Switching...' : selectedBranch}
                </span>
                <ChevronDown size={14} className="text-[#787774]" />
            </button>

            {/* Dropdown menu */}
            {isOpen && (
                <>
                    {/* Backdrop overlay */}
                    <div className="fixed inset-0 z-[80]" onClick={() => { setIsOpen(false); setSearchQuery(''); }} />

                    {/* Dropdown panel */}
                    <div
                        className="absolute right-0 mt-1 w-[280px] bg-white border border-[#efefef] rounded-[6px] shadow-lg z-[90] overflow-hidden animate-fadeIn"
                        role="listbox"
                        tabIndex={-1}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                setIsOpen(false);
                                setSearchQuery('');
                            }
                        }}
                    >
                        {/* Header */}
                        <div className="px-3 py-2 text-[11px] font-semibold text-[#787774] uppercase tracking-wider border-b border-[#efefef] bg-[#fafafa] flex items-center justify-between">
                            <span>Branches</span>
                            <span className="text-[10px] font-normal normal-case">
                                {branches.length} total
                            </span>
                        </div>

                        {/* Search input */}
                        <div className="p-2 border-b border-[#efefef]">
                            <div className="relative">
                                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#787774]" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search branches..."
                                    className="w-full pl-7 pr-7 py-1.5 text-[12px] bg-[#f7f6f3] rounded-[4px] focus:outline-none focus:ring-1 focus:ring-[#37352f]/20"
                                    autoFocus
                                    aria-label="Search branches"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#787774] hover:text-[#37352f]"
                                        aria-label="Clear search"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Filter tabs */}
                        <div className="flex gap-1 p-2 border-b border-[#efefef] bg-[#fafafa]">
                            <button
                                onClick={() => setFilter('all')}
                                className={`flex items-center gap-1 px-2 py-1 rounded-[4px] text-[10px] font-medium transition-colors ${filter === 'all' ? 'bg-[#37352f] text-white' : 'text-[#787774] hover:bg-black/5'
                                    }`}
                            >
                                All <span className="opacity-70">{branches.length}</span>
                            </button>
                            <button
                                onClick={() => setFilter('local')}
                                className={`flex items-center gap-1 px-2 py-1 rounded-[4px] text-[10px] font-medium transition-colors ${filter === 'local' ? 'bg-[#37352f] text-white' : 'text-[#787774] hover:bg-black/5'
                                    }`}
                            >
                                <HardDrive size={10} /> Local <span className="opacity-70">{localCount}</span>
                            </button>
                            <button
                                onClick={() => setFilter('remote')}
                                className={`flex items-center gap-1 px-2 py-1 rounded-[4px] text-[10px] font-medium transition-colors ${filter === 'remote' ? 'bg-[#37352f] text-white' : 'text-[#787774] hover:bg-black/5'
                                    }`}
                            >
                                <Globe size={10} /> Remote <span className="opacity-70">{remoteCount}</span>
                            </button>
                        </div>

                        {/* Branch list */}
                        <div className="max-h-[300px] overflow-y-auto p-1">
                            {loading && branches.length === 0 ? (
                                // Loading spinner
                                <div className="flex items-center justify-center p-4">
                                    <Loader2 size={16} className="animate-spin text-[#787774]" />
                                </div>
                            ) : filteredBranches.length === 0 ? (
                                <div className="p-3 text-[12px] text-[#787774] text-center">
                                    {searchQuery ? `No branches matching "${searchQuery}"` : 'No branches found'}
                                </div>
                            ) : (
                                filteredBranches.map((branch) => (
                                    <button
                                        key={`${branch.type}-${branch.name}`}
                                        onClick={() => handleBranchSelect(branch)}
                                        role="option"
                                        aria-selected={selectedBranch === branch.name}
                                        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-[4px] text-left text-[12px] hover:bg-[#f7f6f3] transition-colors ${selectedBranch === branch.name ? 'bg-[#f7f6f3] font-medium text-[#37352f]' : 'text-[#787774]'
                                            }`}
                                    >
                                        <GitBranch size={12} className="shrink-0" />
                                        <span className="truncate flex-1">{branch.name}</span>

                                        {/* Type badge */}
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${branch.type === 'local'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-purple-100 text-purple-700'
                                            }`}>
                                            {branch.type === 'local' ? 'local' : 'remote'}
                                        </span>

                                        {/* Current badge */}
                                        {branch.is_current && (
                                            <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                                                current
                                            </span>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div >
    );
};

export default BranchSelector;
