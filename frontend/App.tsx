import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import {
    FileText,
    Code,
    Terminal,
    Plus,
    GitBranch,
    Loader2,
    Menu,
    LogOut,
} from 'lucide-react';
import CodeBlock from './components/CodeBlock';
import SlashMenuItem from './components/SlashMenuItem';
import TextBlock from './components/TextBlock';
import PipelineBlock from './components/PipelineBlock';
import LoginPage from './components/LoginPage';
import AuthCallback from './components/AuthCallback';
import RepoList from './components/RepoList';
import SearchPanel from './components/SearchPanel';
import FileBrowser from './components/FileBrowser';
import CommitHistory from './components/CommitHistory';
import BranchSelector from './components/BranchSelector';
import IssuesPRs from './components/IssuesPRs';
import { initRepo, cloneRepo, listFiles, readFile } from './lib/git';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 font-sans text-red-600">
                    <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
                    <details className="whitespace-pre-wrap font-mono text-sm p-4 bg-red-50 rounded">
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

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

interface Block {
    id: string;
    type: 'text' | 'code' | 'pipeline';
    content?: string;
    language?: string;
    filename?: string;
    label?: string;
}

const MainEditor = () => {
    const navigate = useNavigate();
    const [leftPanelOpen, setLeftPanelOpen] = useState(false);
    const [_rightPanelOpen, _setRightPanelOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [_activeTab, _setActiveTab] = useState('pipeline');
    const [showSlashMenu, setShowSlashMenu] = useState(false);
    const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
    const [isCloning, setIsCloning] = useState(false);
    const [_repoFiles, setRepoFiles] = useState<string[]>([]);
    const [sidebarTab, setSidebarTab] = useState('repos'); // repos, files, search
    const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
    const [_showFileEditor, _setShowFileEditor] = useState(false);
    const [selectedFile, setSelectedFile] = useState<{ path: string; name: string } | null>(null);
    const [fileContent, setFileContent] = useState('');
    const [loadingFile, setLoadingFile] = useState(false);
    const [readmeContent, setReadmeContent] = useState<string | null>(null);
    const [loadingReadme, setLoadingReadme] = useState(false);
    const [blocks, setBlocks] = useState<Block[]>([
        { id: '1', type: 'text', content: 'Welcome to gition. This repository demonstrates the power of combining Git version control with a rich block editor and integrated CI/CD pipelines.' },
        { id: '2', type: 'code', language: 'bash', filename: 'CLI installation', content: 'git clone https://github.com/gition/gition.git\ncd gition && pnpm install\npnpm dev' },
        { id: '3', type: 'text', content: 'Below is an interactive pipeline block. Trigger builds and deployments directly from this document.' },
        { id: '4', type: 'pipeline', label: 'production-rollout (isomorphic-git)' }
    ]);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 1024px)');

        const handleChange = (e: MediaQueryListEvent) => {
            setIsMobile(!e.matches);
            if (!e.matches) {
                setLeftPanelOpen(false);
                _setRightPanelOpen(false);
            } else {
                setLeftPanelOpen(true);
                _setRightPanelOpen(true);
            }
        };

        setIsMobile(!mediaQuery.matches);
        setLeftPanelOpen(mediaQuery.matches);
        _setRightPanelOpen(mediaQuery.matches);

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Auto-load README when repo is selected
    useEffect(() => {
        const loadReadme = async () => {
            if (!selectedRepo) {
                setReadmeContent(null);
                return;
            }

            const userId = localStorage.getItem('userLogin') || localStorage.getItem('userId');
            if (!userId) return;

            setLoadingReadme(true);
            try {
                // Try README.md first, then readme.md
                const readmeFiles = ['README.md', 'readme.md', 'README.MD', 'Readme.md'];
                for (const readmeFile of readmeFiles) {
                    const response = await fetch(`/api/git/file?user_id=${userId}&repo_name=${selectedRepo.name}&path=${encodeURIComponent(readmeFile)}`);
                    const data = await response.json();
                    if (data.status === 'success' && !data.binary && data.content) {
                        setReadmeContent(data.content);
                        return;
                    }
                }
                setReadmeContent(null);
            } catch (err) {
                console.error('Failed to load README:', err);
                setReadmeContent(null);
            } finally {
                setLoadingReadme(false);
            }
        };
        loadReadme();
    }, [selectedRepo]);

    const userEmail = localStorage.getItem('userEmail') || 'guest@gition.com';

    useEffect(() => {
        const prepareGit = async () => {
            await initRepo();
            const files = await listFiles();
            setRepoFiles(files);
        };
        prepareGit();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userEmail');
        navigate('/login');
    };

    const handleUpdateBlock = (id: string, updates: Partial<Block> | string) => {
        setBlocks(prev => prev.map(block =>
            block.id === id ? { ...block, ...(typeof updates === 'string' ? { content: updates } : updates) } : block
        ));
    };

    const handleAddBlock = (type: 'text' | 'code' | 'pipeline') => {
        const newBlock: Block = {
            id: Date.now().toString(),
            type,
            content: type === 'text' ? '' : type === 'code' ? '// Start coding...' : undefined,
            ...(type === 'code' ? { language: 'javascript', filename: 'new-file.js' } : {}),
            ...(type === 'pipeline' ? { label: 'new-pipeline' } : {})
        };
        setBlocks(prev => [...prev, newBlock]);
        setShowSlashMenu(false);
    };

    const handleClone = useCallback(async (url: string) => {
        setIsCloning(true);
        try {
            await cloneRepo(url);
            const files = await listFiles();
            setRepoFiles(files);
            if (files.includes('README.md')) {
                const content = await readFile('README.md');
                setBlocks([
                    { id: 'readme-header', type: 'text', content: '# Imported from Repository' },
                    { id: 'readme-content', type: 'text', content: content }
                ]);
            }
        } catch (_err) {
            console.error('Clone failed:', _err);
        } finally {
            setIsCloning(false);
        }
    }, []);

    return (
        <div className="flex h-screen bg-white text-[#37352f] overflow-hidden relative" onClick={() => setShowSlashMenu(false)}>

            {isMobile && leftPanelOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-[60]"
                    onClick={() => setLeftPanelOpen(false)}
                />
            )}

            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-[70] bg-[#f7f6f3] lg:bg-transparent
                    w-[280px] lg:w-[240px] notion-sidebar flex flex-col group/sidebar overflow-hidden border-r border-[#efefef]
                    transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none
                    ${leftPanelOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'}
                `}
            >
                <div className="px-3 py-2 mt-2 flex items-center justify-between hover:bg-black/5 cursor-pointer rounded-[3px] mx-2 group">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-5 h-5 bg-[#37352f] text-white rounded-[3px] flex items-center justify-center font-bold text-[11px] shrink-0">G</div>
                        <span className="font-semibold text-[14px] truncate">{userEmail.split('@')[0]}&apos;s Workspace</span>
                    </div>
                    <button onClick={handleLogout} className="lg:opacity-0 group-hover:opacity-100 p-1 hover:bg-black/5 rounded transition-all text-[#787774]" title="Log out">
                        <LogOut size={14} />
                    </button>
                    {isMobile && (
                        <button onClick={() => setLeftPanelOpen(false)} className="lg:hidden p-1 text-[#37352f]/40">
                            <Menu size={16} />
                        </button>
                    )}
                </div>

                {/* Commit History (shown when repo is selected) */}
                {selectedRepo && (
                    <div className="mt-2 mx-2 border border-[#efefef] rounded-[6px] bg-[#fafafa] max-h-[300px] flex flex-col shrink-0">
                        <CommitHistory
                            userId={localStorage.getItem('userLogin') || localStorage.getItem('userId')}
                            repoName={selectedRepo.name}
                        />
                    </div>
                )}

                {/* Sidebar Tabs */}
                <div className="flex border-b border-[#efefef] mx-2 mt-3">
                    <button
                        onClick={() => setSidebarTab('repos')}
                        className={`flex-1 py-1.5 text-[12px] font-medium transition-colors ${sidebarTab === 'repos'
                            ? 'text-[#37352f] border-b-2 border-[#37352f]'
                            : 'text-[#787774] hover:text-[#37352f]'
                            }`}
                    >
                        Repos
                    </button>
                    {selectedRepo && (
                        <button
                            onClick={() => setSidebarTab('files')}
                            className={`flex-1 py-1.5 text-[12px] font-medium transition-colors ${sidebarTab === 'files'
                                ? 'text-[#37352f] border-b-2 border-[#37352f]'
                                : 'text-[#787774] hover:text-[#37352f]'
                                }`}
                        >
                            Files
                        </button>
                    )}
                    {selectedRepo && (
                        <button
                            onClick={() => setSidebarTab('issues')}
                            className={`flex-1 py-1.5 text-[12px] font-medium transition-colors ${sidebarTab === 'issues'
                                ? 'text-[#37352f] border-b-2 border-[#37352f]'
                                : 'text-[#787774] hover:text-[#37352f]'
                                }`}
                        >
                            Issues
                        </button>
                    )}
                    <button
                        onClick={() => setSidebarTab('search')}
                        className={`flex-1 py-1.5 text-[12px] font-medium transition-colors ${sidebarTab === 'search'
                            ? 'text-[#37352f] border-b-2 border-[#37352f]'
                            : 'text-[#787774] hover:text-[#37352f]'
                            }`}
                    >
                        Search
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto mt-2 px-2">
                    {sidebarTab === 'repos' && (
                        <>
                            <div className="px-2 py-1 text-[11px] font-semibold text-[#787774] uppercase tracking-wider mb-2">Repositories</div>
                            <RepoList onRepoSelect={(repo) => {
                                setSelectedRepo(repo);
                                setSidebarTab('files');
                            }} />
                        </>
                    )}
                    {sidebarTab === 'files' && selectedRepo && (
                        <FileBrowser
                            userId={localStorage.getItem('userLogin') || localStorage.getItem('userId')}
                            repoName={selectedRepo.name}
                            onFileSelect={async (path, name) => {
                                setSelectedFile({ path, name });
                                setLoadingFile(true);
                                try {
                                    const userId = localStorage.getItem('userLogin') || localStorage.getItem('userId');
                                    const response = await fetch(`/api/git/file?user_id=${userId}&repo_name=${selectedRepo.name}&path=${encodeURIComponent(path)}`);
                                    const data = await response.json();
                                    if (data.status === 'success' && !data.binary) {
                                        setFileContent(data.content || '');
                                    } else if (data.binary) {
                                        setFileContent('[Binary file - cannot display]');
                                    }
                                } catch (_err) {
                                    setFileContent('Error loading file');
                                } finally {
                                    setLoadingFile(false);
                                }
                            }}
                            onBack={() => {
                                setSidebarTab('repos');
                                setSelectedRepo(null);
                                setSelectedFile(null);
                                setFileContent('');
                            }}
                        />
                    )}
                    {sidebarTab === 'issues' && selectedRepo && (
                        <IssuesPRs
                            owner={localStorage.getItem('userLogin')}
                            repoName={selectedRepo.name}
                        />
                    )}
                    {sidebarTab === 'search' && (
                        <SearchPanel
                            userId={localStorage.getItem('userLogin') || localStorage.getItem('userId')}
                            repoName={selectedRepo?.name}
                            onFileSelect={async (path, _line) => {
                                if (!selectedRepo) return;
                                setSelectedFile({ path, name: path.split('/').pop() || path });
                                setLoadingFile(true);
                                try {
                                    const userId = localStorage.getItem('userLogin') || localStorage.getItem('userId');
                                    const response = await fetch(`/api/git/file?user_id=${userId}&repo_name=${selectedRepo.name}&path=${encodeURIComponent(path)}`);
                                    const data = await response.json();
                                    if (data.status === 'success' && !data.binary) {
                                        setFileContent(data.content || '');
                                    }
                                } catch (_err) {
                                    setFileContent('Error loading file');
                                } finally {
                                    setLoadingFile(false);
                                }
                            }}
                        />
                    )}
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0 bg-white relative transition-all duration-300">
                <header className="h-[45px] border-b border-[#efefef] flex items-center justify-between px-3 sm:px-4 sticky top-0 bg-white z-40">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        {(!leftPanelOpen || isMobile) && (
                            <button onClick={() => setLeftPanelOpen(true)} className={`p-1.5 hover:bg-black/5 rounded-[3px] text-[#37352f]/60 ${leftPanelOpen && isMobile ? 'opacity-0 pointer-events-none' : ''}`}>
                                <Menu size={16} />
                            </button>
                        )}
                        <div className="text-[13px] sm:text-[14px] font-medium ml-1 truncate">
                            {selectedFile ? (
                                <>
                                    {selectedRepo?.name} <span className="text-[#37352f]/30">/</span> {selectedFile.name}
                                </>
                            ) : (
                                <>{userEmail.split('@')[0]} <span className="text-[#37352f]/30">/</span> workspace</>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                        {selectedRepo && (
                            <BranchSelector
                                userId={localStorage.getItem('userLogin') || localStorage.getItem('userId')}
                                repoName={selectedRepo.name}
                                onBranchChange={(_branch) => {
                                    // Reload README when branch changes
                                    setReadmeContent(null);
                                    setLoadingReadme(true);
                                    const userId = localStorage.getItem('userLogin') || localStorage.getItem('userId');
                                    fetch(`/api/git/file?user_id=${userId}&repo_name=${selectedRepo.name}&path=README.md`)
                                        .then(res => res.json())
                                        .then(data => {
                                            if (data.status === 'success' && !data.binary && data.content) {
                                                setReadmeContent(data.content);
                                            }
                                        })
                                        .finally(() => setLoadingReadme(false));
                                }}
                            />
                        )}
                        {selectedFile && (
                            <button
                                onClick={() => { setSelectedFile(null); setFileContent(''); }}
                                className="text-[13px] px-2 py-0.5 hover:bg-black/5 rounded"
                            >
                                Close
                            </button>
                        )}
                        <button onClick={() => setIsCommitModalOpen(true)} className="bg-black text-white px-3 py-1 rounded-[3px] font-medium text-[13px] hover:bg-[#37352f]">Commit</button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto">
                    {selectedFile ? (
                        loadingFile ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="animate-spin text-[#787774]" size={24} />
                                <span className="ml-2 text-[#787774]">Loading...</span>
                            </div>
                        ) : (
                            <textarea
                                value={fileContent}
                                onChange={(e) => setFileContent(e.target.value)}
                                className="w-full h-full p-4 font-mono text-[13px] leading-relaxed resize-none focus:outline-none bg-[#1e1e1e] text-[#d4d4d4]"
                                spellCheck={false}
                                style={{ tabSize: 2 }}
                            />
                        )
                    ) : selectedRepo && (loadingReadme || readmeContent) ? (
                        loadingReadme ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="animate-spin text-[#787774]" size={24} />
                                <span className="ml-2 text-[#787774]">Loading README...</span>
                            </div>
                        ) : (
                            <div className="max-w-[800px] mx-auto px-12 sm:px-24 py-16">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-[#37352f] text-white rounded-[6px] flex items-center justify-center font-bold text-[16px]">
                                        {selectedRepo.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h1 className="text-[28px] font-bold text-[#37352f]">{selectedRepo.name}</h1>
                                        {selectedRepo.description && (
                                            <p className="text-[14px] text-[#787774]">{selectedRepo.description}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="border-t border-[#efefef] pt-6">
                                    <div className="prose prose-sm max-w-none">
                                        <pre className="whitespace-pre-wrap font-sans text-[14px] text-[#37352f] leading-relaxed">
                                            {readmeContent}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        )
                    ) : selectedRepo ? (
                        <div className="flex items-center justify-center h-full text-[#787774]">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-[#f7f6f3] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileText size={28} className="text-[#787774]" />
                                </div>
                                <p className="text-[16px] font-medium">{selectedRepo.name}</p>
                                <p className="text-[13px] mt-1">No README.md found</p>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-[800px] mx-auto px-12 sm:px-24 py-16">
                            <h1 className="text-[40px] font-bold text-[#37352f] mb-2" contentEditable suppressContentEditableWarning>Gition</h1>
                            <p className="text-[18px] text-[#787774] mb-8 font-medium">Developer&apos;s All-in-One Collaboration Platform</p>

                            <div className="space-y-1">
                                {blocks.map(block => {
                                    switch (block.type) {
                                        case 'text':
                                            return block.content !== undefined ? <TextBlock key={block.id} id={block.id} content={block.content} onUpdate={handleUpdateBlock} /> : null;
                                        case 'code':
                                            return block.content !== undefined ? <CodeBlock key={block.id} id={block.id} content={block.content} language={block.language || 'text'} filename={block.filename || ''} onUpdate={handleUpdateBlock} /> : null;
                                        case 'pipeline':
                                            return block.label !== undefined ? <PipelineBlock key={block.id} label={block.label} /> : null;
                                        default:
                                            return null;
                                    }
                                })}
                            </div>

                            <div className="mt-12 relative group">
                                <div className="flex items-center gap-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); setShowSlashMenu(!showSlashMenu); }}>
                                    <Plus size={18} className="text-[#37352f]/30" />
                                    <span className="text-[14px] text-[#37352f]/30">Click to add blocks, or type &quot;/&quot; for commands</span>
                                </div>
                                {isCloning && (
                                    <div className="absolute inset-0 bg-white/80 z-[70] flex items-center justify-center">
                                        <Loader2 size={24} className="animate-spin text-[#2383e2] mr-2" />
                                        <span className="text-[14px] font-medium">Cloning...</span>
                                    </div>
                                )}
                                {showSlashMenu && (
                                    <div className="absolute z-[60] bottom-full mb-2 w-[240px] bg-white border border-[#efefef] rounded-[3px] shadow-lg animate-fadeIn overflow-hidden">
                                        <div onClick={() => handleAddBlock('text')}><SlashMenuItem icon={FileText} label="Text" desc="Plain writing" /></div>
                                        <div onClick={() => handleAddBlock('code')}><SlashMenuItem icon={Code} label="Code Block" desc="Monospaced snippet" /></div>
                                        <div onClick={() => handleClone('https://github.com/isomorphic-git/isomorphic-git.git')}><SlashMenuItem icon={GitBranch} label="Clone Repo" desc="Import public Git repo" /></div>
                                        <div onClick={() => handleAddBlock('pipeline')}><SlashMenuItem icon={Terminal} label="Pipeline" desc="Interactive build step" /></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

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

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const App = () => {
    return (
        <BrowserRouter>
            <ErrorBoundary>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <MainEditor />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </ErrorBoundary>
        </BrowserRouter>
    );
};

export default App;
