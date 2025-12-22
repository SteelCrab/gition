import React, { useState, useEffect } from 'react';
import { GitBranch, ChevronDown, Check, Loader2, Cloud } from 'lucide-react';

const BranchSelector = ({ userId, repoName, onBranchChange }) => {
    const [branches, setBranches] = useState([]);
    const [currentBranch, setCurrentBranch] = useState(null);
    const [loading, setLoading] = useState(false);
    const [switching, setSwitching] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState(null);

    const fetchBranches = async () => {
        if (!userId || !repoName) return;

        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/git/branches?user_id=${userId}&repo_name=${repoName}`);
            const data = await response.json();
            if (data.status === 'success') {
                setBranches(data.branches);
                setCurrentBranch(data.current_branch);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to load branches');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, [userId, repoName]);

    const handleCheckout = async (branchName) => {
        if (branchName === currentBranch) {
            setIsOpen(false);
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
                    branch_name: branchName
                })
            });
            const data = await response.json();
            if (data.status === 'success') {
                setCurrentBranch(data.current_branch);
                if (onBranchChange) {
                    onBranchChange(data.current_branch);
                }
                // Refresh branches list
                fetchBranches();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to switch branch');
        } finally {
            setSwitching(false);
            setIsOpen(false);
        }
    };

    if (!userId || !repoName) return null;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={loading || switching}
                className="flex items-center gap-1.5 px-2 py-1 text-[12px] bg-[#f7f6f3] hover:bg-[#efefef] rounded-[4px] transition-colors"
            >
                <GitBranch size={12} className="text-[#787774]" />
                {loading ? (
                    <Loader2 size={12} className="animate-spin text-[#787774]" />
                ) : (
                    <span className="font-medium text-[#37352f] max-w-[100px] truncate">
                        {currentBranch || 'main'}
                    </span>
                )}
                <ChevronDown size={12} className={`text-[#787774] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 w-[220px] bg-white border border-[#efefef] rounded-[6px] shadow-lg z-50 overflow-hidden">
                        <div className="px-3 py-2 border-b border-[#efefef]">
                            <div className="text-[11px] font-semibold text-[#787774] uppercase tracking-wider">Branches</div>
                        </div>
                        <div className="max-h-[250px] overflow-y-auto">
                            {branches.length === 0 ? (
                                <div className="px-3 py-4 text-center text-[12px] text-[#787774]">
                                    No branches found
                                </div>
                            ) : (
                                branches.map((branch) => (
                                    <button
                                        key={branch.name}
                                        onClick={() => handleCheckout(branch.name)}
                                        disabled={switching}
                                        className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[#f7f6f3] transition-colors ${branch.is_current ? 'bg-[#f7f6f3]' : ''
                                            }`}
                                    >
                                        <div className="w-4 h-4 flex items-center justify-center">
                                            {branch.is_current && <Check size={12} className="text-green-600" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[12px] font-medium text-[#37352f] truncate">
                                                    {branch.name}
                                                </span>
                                                {branch.type === 'remote' && (
                                                    <Cloud size={10} className="text-[#787774] shrink-0" />
                                                )}
                                            </div>
                                            <div className="text-[10px] text-[#787774] truncate">
                                                {branch.commit_sha} · {branch.commit_message}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                        {error && (
                            <div className="px-3 py-2 border-t border-[#efefef] text-[11px] text-red-500">
                                {error}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default BranchSelector;
