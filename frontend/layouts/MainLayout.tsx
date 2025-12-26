import { useState, useEffect } from 'react';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Menu } from 'lucide-react';
import BranchSelector from '../components/BranchSelector';
import Dashboard from '../pages/Dashboard';
import RepoPage from '../pages/RepoPage';

const MainLayout = () => {
    // State
    const [leftPanelOpen, setLeftPanelOpen] = useState(false);
    const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
    const [commitMessage, setCommitMessage] = useState('');
    const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 1024 : false));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [commitError, setCommitError] = useState<string | null>(null);

    // Hooks
    const { owner, repoName, branchName, "*": filePath } = useParams();
    const navigate = useNavigate();

    // Effects
    useEffect(() => {
        if (typeof window === 'undefined') return;

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

    const handleCommit = async () => {
        if (!commitMessage.trim()) {
            setCommitError('Please enter a commit message.');
            return;
        }

        setIsSubmitting(true);
        setCommitError(null);

        try {
            // TODO: Replace with actual backend API call
            // const response = await fetch('/api/git/commit', { ... });
            // Log structured action without sensitive content
            console.log('Initiating commit action for repository:', displayRepo);

            // Simulate API delay
            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    // Random failure simulation
                    if (Math.random() < 0.1) reject(new Error('Network timeout'));
                    else resolve(true);
                }, 1500);
            });

            // On success:
            setIsCommitModalOpen(false);
            setCommitMessage('');
        } catch (err: unknown) {
            console.error('Commit failed'); // Don't log internal error details to console in production
            setCommitError('Failed to commit changes. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex h-screen bg-white text-[#37352f] overflow-hidden relative">
            <Sidebar isOpen={leftPanelOpen} onClose={() => setLeftPanelOpen(false)} isMobile={isMobile} />

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
                                    if (!displayRepo || !newBranch) return;

                                    const currentPath = filePath || '';
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
                                        const currentBranch = branchName || 'main';
                                        navigate(`/repo/${userId}/${displayRepo}/${currentBranch}`);
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
                    <Routes>
                        <Route index element={<Dashboard />} />
                        <Route path="repo/:owner/:repoName" element={<RepoPage />} />
                        <Route path="repo/:owner/:repoName/:branchName" element={<RepoPage />} />
                        <Route path="repo/:owner/:repoName/:branchName/*" element={<RepoPage />} />
                    </Routes>
                </div>

                {/* Commit Modal */}
                {isCommitModalOpen && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center z-[100]" onClick={() => !isSubmitting && setIsCommitModalOpen(false)}>
                        <div className="bg-white w-[400px] rounded-[6px] shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                            <h2 className="text-[18px] font-bold mb-4">Commit Changes</h2>
                            <textarea
                                className="w-full h-32 p-3 bg-[#f7f6f3] rounded-[6px] text-[14px] outline-none mb-2"
                                placeholder="What did you work on?"
                                autoFocus
                                disabled={isSubmitting}
                                value={commitMessage}
                                onChange={(e) => {
                                    setCommitMessage(e.target.value);
                                    if (commitError) setCommitError(null);
                                }}
                            />

                            {commitError && (
                                <div className="text-red-500 text-[12px] mb-4">{commitError}</div>
                            )}

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setIsCommitModalOpen(false)}
                                    className="px-3 py-1 text-[13px] hover:bg-black/5 rounded"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCommit}
                                    className="px-3 py-1 bg-[#2383e2] text-white rounded-[3px] font-medium text-[13px] flex items-center gap-2 disabled:opacity-50"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Committing...
                                        </>
                                    ) : (
                                        'Push & Commit'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default MainLayout;
