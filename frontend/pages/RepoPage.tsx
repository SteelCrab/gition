import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, FileText, BookOpen, StickyNote } from 'lucide-react';
import BranchPage from '../components/BranchPage';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { useRepoContent } from '../hooks/useRepoContent';

type ViewMode = 'page' | 'readme';

const RepoPage = () => {
    const { owner, repoName, branchName, "*": filePath } = useParams();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<ViewMode>('page');

    const { content, loading, error, userId, currentBranch } = useRepoContent(
        owner, repoName, branchName, filePath
    );

    const isFile = !!filePath;

    // Redirect to include default branch if missing in URL
    useEffect(() => {
        if (!owner || !repoName) return;
        if (!branchName) {
            const safeOwner = encodeURIComponent(owner);
            const safeRepo = encodeURIComponent(repoName);
            navigate(`/repo/${safeOwner}/${safeRepo}/main`, { replace: true });
        }
    }, [branchName, owner, repoName, navigate]);

    if (!branchName) return null; // Waiting for redirect

    // File view
    if (isFile) {
        if (loading) {
            return (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="animate-spin text-[#787774]" size={24} />
                    <span className="ml-2 text-[#787774]">Loading...</span>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-[#787774] px-4 text-center">
                    <div className="mb-4 text-red-500 font-medium">Unable to load content</div>
                    <p className="text-[13px] max-w-[300px] mb-6">{error}</p>
                    <button
                        onClick={() => navigate(0)}
                        className="px-4 py-1.5 bg-black text-white text-[13px] rounded-[4px] hover:bg-[#37352f] transition-all"
                    >
                        Try again
                    </button>
                </div>
            );
        }

        const isMarkdown = filePath?.toLowerCase().endsWith('.md');

        if (isMarkdown && content) {
            return (
                <div className="w-full h-full overflow-auto p-8 bg-white">
                    <MarkdownRenderer content={content} />
                </div>
            );
        }

        return (
            <textarea
                value={content || ''}
                readOnly
                className="w-full h-full p-4 font-mono text-[13px] leading-relaxed resize-none focus:outline-none bg-[#1e1e1e] text-[#d4d4d4]"
                spellCheck={false}
                style={{ tabSize: 2 }}
            />
        );
    }

    // Repo Root - Tab view (Branch Page / README)
    return (
        <div className="flex flex-col h-full">
            {/* Tab Header */}
            <div className="flex items-center border-b border-[#efefef] bg-white">
                <button
                    onClick={() => setViewMode('page')}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium transition-colors border-b-2 -mb-[1px] ${viewMode === 'page'
                        ? 'text-[#37352f] border-[#37352f]'
                        : 'text-[#787774] border-transparent hover:text-[#37352f]'
                        }`}
                >
                    <StickyNote size={14} />
                    Branch Notes
                </button>
                <button
                    onClick={() => setViewMode('readme')}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium transition-colors border-b-2 -mb-[1px] ${viewMode === 'readme'
                        ? 'text-[#37352f] border-[#37352f]'
                        : 'text-[#787774] border-transparent hover:text-[#37352f]'
                        }`}
                >
                    <BookOpen size={14} />
                    README
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
                {viewMode === 'page' ? (
                    <BranchPage
                        userId={userId ?? null}
                        repoName={repoName || ''}
                        branchName={currentBranch}
                    />
                ) : (
                    // README View
                    loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="animate-spin text-[#787774]" size={24} />
                            <span className="ml-2 text-[#787774]">Loading...</span>
                        </div>
                    ) : content ? (
                        <div className="h-full overflow-auto bg-white p-8">
                            <MarkdownRenderer content={content} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-[#787774]">
                            <FileText size={48} strokeWidth={1} className="mb-4 opacity-50" />
                            <p>No README found</p>
                        </div>
                    )
                )}
            </div >
        </div >
    );
};

export default RepoPage;
