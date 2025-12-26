import { useState, useEffect } from 'react';
import { Outlet, useParams, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Menu } from 'lucide-react';
import BranchSelector from '../components/BranchSelector';

const MainLayout = () => {
    // State
    const [leftPanelOpen, setLeftPanelOpen] = useState(false);
    const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    // Hooks
    const { owner, repoName, branchName, "*": filePath } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Effects
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Derived Logic
    const userEmail = localStorage.getItem('userEmail') || 'guest@gition.com';
    const displayRepo = repoName;
    const displayFile = filePath ? filePath.split('/').pop() : null;

    return (
        <div className="flex h-screen bg-white text-[#37352f] overflow-hidden relative">
            <Sidebar isOpen={leftPanelOpen} onClose={() => setLeftPanelOpen(false)} />

            <main className="flex-1 flex flex-col min-w-0 bg-white relative transition-all duration-300">
                {/* Header */}
                <header className="h-[45px] border-b border-[#efefef] flex items-center justify-between px-3 sm:px-4 sticky top-0 bg-white z-40">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        {/* Mobile Menu Button */}
                        <button onClick={() => setLeftPanelOpen(true)} className={`lg:hidden p-1.5 hover:bg-black/5 rounded-[3px] text-[#37352f]/60`}>
                            <Menu size={16} />
                        </button>

                        <div className="text-[13px] sm:text-[14px] font-medium ml-1 truncate">
                            {displayFile ? (
                                <>
                                    {displayRepo} <span className="text-[#37352f]/30">/</span> {displayFile}
                                </>
                            ) : displayRepo ? (
                                <>
                                    {userEmail.split('@')[0]} <span className="text-[#37352f]/30">/</span> {displayRepo}
                                </>
                            ) : (
                                <>{userEmail.split('@')[0]} <span className="text-[#37352f]/30">/</span> workspace</>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                        {displayRepo && (
                            <BranchSelector
                                userId={localStorage.getItem('userLogin') || localStorage.getItem('userId')}
                                repoName={displayRepo}
                                onBranchChange={(newBranch) => {
                                    // Navigate to new branch URL
                                    // Github keeps path. Let's try to keep path.
                                    const currentPath = filePath || ''; // wildcard part
                                    // Reconstruct URL: /repo/:owner/:repo/:newBranch/:path
                                    const userId = owner || localStorage.getItem('userLogin') || 'user';
                                    const targetPath = currentPath ? `/${currentPath}` : '';
                                    navigate(`/repo/${userId}/${displayRepo}/${newBranch}${targetPath}`);
                                }}
                            />
                        )}
                        {displayFile && (
                            <button
                                onClick={() => {
                                    if (displayRepo) {
                                        const userId = owner || localStorage.getItem('userLogin') || 'user';
                                        const branch = branchName || 'main';
                                        navigate(`/repo/${userId}/${displayRepo}/${branch}`);
                                    } else {
                                        navigate('/');
                                    }
                                }}
                                className="text-[13px] px-2 py-0.5 hover:bg-black/5 rounded"
                            >
                                Close
                            </button>
                        )}
                        <button onClick={() => setIsCommitModalOpen(true)} className="bg-black text-white px-3 py-1 rounded-[3px] font-medium text-[13px] hover:bg-[#37352f]">Commit</button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto">
                    <Outlet context={{ setLeftPanelOpen }} />
                </div>

                {/* Commit Modal */}
                {isCommitModalOpen && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center z-[100]" onClick={() => setIsCommitModalOpen(false)}>
                        <div className="bg-white w-[400px] rounded-[6px] shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                            <h2 className="text-[18px] font-bold mb-4">Commit Changes</h2>
                            <textarea className="w-full h-32 p-3 bg-[#f7f6f3] rounded-[6px] text-[14px] outline-none mb-4" placeholder="What did you work on?" autoFocus />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setIsCommitModalOpen(false)} className="px-3 py-1 text-[13px] hover:bg-black/5 rounded">Cancel</button>
                                <button onClick={() => setIsCommitModalOpen(false)} className="px-3 py-1 bg-[#2383e2] text-white rounded-[3px] font-medium text-[13px]">Push & Commit</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default MainLayout;
