import { useState, useEffect, useCallback } from 'react';
import { GitBranch, ChevronDown, Loader2 } from 'lucide-react';

interface Branch {
    name: string;
    is_current: boolean;
    commit_sha?: string;
    commit_message?: string;
}

interface BranchSelectorProps {
    userId: string | null;
    repoName: string;
    onBranchChange?: (branchName: string) => void;
}

const BranchSelector = ({ userId, repoName, onBranchChange }: BranchSelectorProps) => {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string>('main');
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchBranches = useCallback(async () => {
        if (!userId || !repoName) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/git/branches?user_id=${userId}&repo_name=${repoName}`);
            const data = await response.json();
            if (data.status === 'success') {
                // Determine the currently selected branch from the response or default to the first one
                const branchList = (data.branches || []) as Branch[];
                setBranches(branchList);

                const currentBranch = branchList.find(b => b.is_current);
                if (currentBranch) {
                    setSelectedBranch(currentBranch.name);
                } else if (branchList.length > 0) {
                    setSelectedBranch(branchList[0].name);
                }
            }
        } catch (_err) {
            console.error('Failed to fetch branches:', _err);
        } finally {
            setLoading(false);
        }
    }, [userId, repoName]);

    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    const handleBranchSelect = (branch: Branch) => {
        setSelectedBranch(branch.name);
        setIsOpen(false);
        onBranchChange?.(branch.name);
    };

    if (!repoName) return null;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-2 py-1 hover:bg-black/5 rounded-[3px] transition-colors"
            >
                <GitBranch size={14} className="text-[#787774]" />
                <span className="text-[13px] font-medium text-[#37352f] truncate max-w-[120px]">
                    {selectedBranch}
                </span>
                <ChevronDown size={14} className="text-[#787774]" />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[80]" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-1 w-[200px] bg-white border border-[#efefef] rounded-[3px] shadow-lg z-[90] overflow-hidden animate-fadeIn">
                        <div className="px-3 py-2 text-[11px] font-semibold text-[#787774] uppercase tracking-wider border-b border-[#efefef] bg-[#fafafa]">
                            Branches
                        </div>
                        <div className="max-h-[300px] overflow-y-auto p-1">
                            {loading && branches.length === 0 ? (
                                <div className="flex items-center justify-center p-4">
                                    <Loader2 size={16} className="animate-spin text-[#787774]" />
                                </div>
                            ) : branches.length === 0 ? (
                                <div className="p-3 text-[12px] text-[#787774] text-center">
                                    No branches found
                                </div>
                            ) : (
                                branches.map((branch) => (
                                    <button
                                        key={branch.name}
                                        onClick={() => handleBranchSelect(branch)}
                                        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-[2px] text-left text-[13px] hover:bg-[#f7f6f3] transition-colors ${selectedBranch === branch.name ? 'bg-[#f7f6f3] font-medium text-[#37352f]' : 'text-[#787774]'}`}
                                    >
                                        <GitBranch size={12} />
                                        <span className="truncate">{branch.name}</span>
                                        {branch.is_current && (
                                            <span className="ml-auto text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                                                Current
                                            </span>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default BranchSelector;
