import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import CommitHistory from './CommitHistory';
import RepoList from './RepoList';
import FileBrowser from './FileBrowser';
import IssuesPRs from './IssuesPRs';
import SearchPanel from './SearchPanel';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    isMobile?: boolean;
}

const Sidebar = ({ isOpen, onClose, isMobile }: SidebarProps) => {
    const navigate = useNavigate();
    const { repoName, branchName } = useParams();
    const [sidebarTab, setSidebarTab] = useState<'repos' | 'files' | 'issues' | 'search'>('repos');

    const userEmail = localStorage.getItem('userEmail') || 'guest@gition.com';
    const isMobileView = isMobile ?? (typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userEmail');
        navigate('/login');
    };

    // Derived state from URL
    const selectedRepoName = repoName;

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-[60] lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-[70] bg-[#f7f6f3] lg:bg-transparent
                    w-[280px] lg:w-[240px] notion-sidebar flex flex-col group/sidebar overflow-hidden border-r border-[#efefef]
                    transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
            >
                {/* User Profile / Logout */}
                <div className="px-3 py-2 mt-2 flex items-center justify-between hover:bg-black/5 cursor-pointer rounded-[3px] mx-2 group">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-5 h-5 bg-[#37352f] text-white rounded-[3px] flex items-center justify-center font-bold text-[11px] shrink-0">G</div>
                        <span className="font-semibold text-[14px] truncate">{userEmail.split('@')[0]}'s Workspace</span>
                    </div>
                    <button onClick={handleLogout} className="lg:opacity-0 group-hover:opacity-100 p-1 hover:bg-black/5 rounded transition-all text-[#787774]" title="Log out">
                        <LogOut size={14} />
                    </button>
                    <button onClick={onClose} className="lg:hidden p-1 text-[#37352f]/40">
                        <Menu size={16} />
                    </button>
                </div>

                {/* Commit History (only if repo selected) */}
                {selectedRepoName && (
                    <div className="mt-2 mx-2 border border-[#efefef] rounded-[6px] bg-[#fafafa] max-h-[300px] flex flex-col shrink-0">
                        <CommitHistory
                            userId={localStorage.getItem('userLogin') || localStorage.getItem('userId')}
                            repoName={selectedRepoName}
                        />
                    </div>
                )}

                {/* Sidebar Tabs */}
                <div className="flex border-b border-[#efefef] mx-2 mt-3">
                    <button onClick={() => setSidebarTab('repos')} className={`flex-1 py-1.5 text-[12px] font-medium transition-colors ${sidebarTab === 'repos' ? 'text-[#37352f] border-b-2 border-[#37352f]' : 'text-[#787774] hover:text-[#37352f]'}`}>Repos</button>
                    {selectedRepoName && <button onClick={() => setSidebarTab('files')} className={`flex-1 py-1.5 text-[12px] font-medium transition-colors ${sidebarTab === 'files' ? 'text-[#37352f] border-b-2 border-[#37352f]' : 'text-[#787774] hover:text-[#37352f]'}`}>Files</button>}
                    {selectedRepoName && <button onClick={() => setSidebarTab('issues')} className={`flex-1 py-1.5 text-[12px] font-medium transition-colors ${sidebarTab === 'issues' ? 'text-[#37352f] border-b-2 border-[#37352f]' : 'text-[#787774] hover:text-[#37352f]'}`}>Issues</button>}
                    <button onClick={() => setSidebarTab('search')} className={`flex-1 py-1.5 text-[12px] font-medium transition-colors ${sidebarTab === 'search' ? 'text-[#37352f] border-b-2 border-[#37352f]' : 'text-[#787774] hover:text-[#37352f]'}`}>Search</button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto mt-2 px-2">
                    {sidebarTab === 'repos' && (
                        <>
                            <div className="px-2 py-1 text-[11px] font-semibold text-[#787774] uppercase tracking-wider mb-2">Repositories</div>
                            <RepoList onRepoSelect={(repo) => {
                                // Navigate to the repo URL
                                const userId = localStorage.getItem('userLogin') || localStorage.getItem('userId') || 'user';
                                navigate(`/repo/${userId}/${repo.name}`);
                                setSidebarTab('files');
                                if (isMobileView) onClose();
                            }} />
                        </>
                    )}
                    {sidebarTab === 'files' && selectedRepoName && (
                        <FileBrowser
                            userId={localStorage.getItem('userLogin') || localStorage.getItem('userId')}
                            repoName={selectedRepoName}
                            onFileSelect={(path, _name) => {
                                // Navigate to file URL only if we have a branch from the URL
                                if (branchName) {
                                    const userId = localStorage.getItem('userLogin') || localStorage.getItem('userId');
                                    navigate(`/repo/${userId}/${selectedRepoName}/${branchName}/${path}`);
                                    if (isMobileView) onClose();
                                } else {
                                    console.warn("Cannot navigate to file: Branch name missing from URL.");
                                }
                            }}
                            onBack={() => {
                                setSidebarTab('repos');
                                navigate('/');
                            }}
                        />
                    )}
                    {sidebarTab === 'issues' && selectedRepoName && (
                        <IssuesPRs
                            owner={localStorage.getItem('userLogin')}
                            repoName={selectedRepoName}
                        />
                    )}
                    {sidebarTab === 'search' && (
                        <SearchPanel
                            userId={localStorage.getItem('userLogin') || localStorage.getItem('userId')}
                            repoName={selectedRepoName || undefined}
                            onFileSelect={(path, _line) => {
                                if (!selectedRepoName) return;
                                const userId = localStorage.getItem('userLogin') || localStorage.getItem('userId');
                                const currentBranch = branchName || 'main';
                                navigate(`/repo/${userId}/${selectedRepoName}/${currentBranch}/${path}`);
                            }}
                        />
                    )}
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
