import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, FileText } from 'lucide-react';

const RepoPage = () => {
    const { owner, repoName, branchName, "*": filePath } = useParams();
    const navigate = useNavigate();

    const [content, setContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isFile = !!filePath;
    const currentBranch = branchName || 'main'; // Default to main if not present

    // Redirect to include default branch if missing in URL
    useEffect(() => {
        if (!owner || !repoName) return;
        if (!branchName) {
            const safeOwner = encodeURIComponent(owner);
            const safeRepo = encodeURIComponent(repoName);
            navigate(`/repo/${safeOwner}/${safeRepo}/main`, { replace: true });
        }
    }, [branchName, owner, repoName, navigate]);

    useEffect(() => {
        const fetchContent = async () => {
            if (!owner || !repoName) return;
            // Avoid fetching if branchName is missing (will redirect)
            if (!branchName) return;

            setLoading(true);
            setError(null);
            setContent(null);

            try {
                // Determine what to fetch: specific file or README
                const targetPath = filePath || 'README.md';
                const userId = localStorage.getItem('userLogin') || localStorage.getItem('userId') || owner;

                // Stateless fetch: pass branch as a parameter
                const response = await fetch(
                    `/api/git/file?user_id=${encodeURIComponent(userId)}&repo_name=${encodeURIComponent(repoName)}&path=${encodeURIComponent(targetPath)}&branch=${encodeURIComponent(currentBranch)}`
                );

                if (!response.ok) {
                    if (response.status === 404 && !filePath) {
                        // README not found for repo root, show placeholder
                        setContent(null); // Will trigger "No README" view
                        setLoading(false);
                        return;
                    }
                    throw new Error('Failed to fetch file');
                }

                const data = await response.json();

                if (data.status === 'success') {
                    if (data.binary) {
                        setContent('[Binary file - cannot display]');
                    } else {
                        setContent(data.content);
                    }
                } else {
                    throw new Error(data.message || 'Error loading content');
                }

            } catch (err: unknown) {
                // Log internal details for debugging (simulated internal logging)
                console.error("[Internal] Failed to fetch repository content");
                setError("Failed to load content. The file might be missing or there's a connection issue.");
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, [owner, repoName, filePath, branchName, currentBranch]); // Re-fetch when any of these change

    if (!branchName) return null; // Waiting for redirect

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
                    onClick={() => window.location.reload()}
                    className="px-4 py-1.5 bg-black text-white text-[13px] rounded-[4px] hover:bg-[#37352f] transition-all"
                >
                    Try again
                </button>
            </div>
        );
    }

    if (isFile) {
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

    // Repo Root (README view)
    if (content) {
        return (
            <div className="max-w-[800px] mx-auto px-12 sm:px-24 py-16">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-[#37352f] text-white rounded-[6px] flex items-center justify-center font-bold text-[16px]">
                        {repoName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-[28px] font-bold text-[#37352f]">{repoName}</h1>
                        {/* Description could be fetched separately if needed */}
                    </div>
                </div>
                <div className="border-t border-[#efefef] pt-6">
                    <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-[14px] text-[#37352f] leading-relaxed">
                            {content}
                        </pre>
                    </div>
                </div>
            </div>
        );
    }

    // No README
    return (
        <div className="flex items-center justify-center h-full text-[#787774]">
            <div className="text-center">
                <div className="w-16 h-16 bg-[#f7f6f3] rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText size={28} className="text-[#787774]" />
                </div>
                <p className="text-[16px] font-medium">{repoName}</p>
                <p className="text-[13px] mt-1">No README.md found</p>
            </div>
        </div>
    );
};

export default RepoPage;
