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
        if (!branchName) {
            navigate(`/repo/${owner}/${repoName}/main`, { replace: true });
        }
    }, [branchName, owner, repoName, navigate]);

    useEffect(() => {
        const fetchContent = async () => {
            // Avoid fetching if branchName is missing (will redirect) 
            // or if we already have content for this exact path/branch? 
            // Simpler to just fetch on dependency change.
            if (!branchName) return;

            setLoading(true);
            setError(null);
            setContent(null);

            try {
                // Determine what to fetch: specific file or README
                const targetPath = filePath || 'README.md';

                // Stateless fetch: pass branch as a parameter
                // Note: The backend API must support 'branch' query param for this to work statelessly.
                // Assuming /api/git/file accepts branch
                const response = await fetch(
                    `/api/git/file?user_id=${owner}&repo_name=${repoName}&path=${encodeURIComponent(targetPath)}&branch=${currentBranch}`
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

            } catch (err: any) {
                console.error("Error loading content:", err);
                setError(err.message || "Failed to load content");
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, [owner, repoName, currentBranch, filePath, branchName]); // Re-fetch when any of these change

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
            <div className="flex items-center justify-center h-full text-red-500">
                <p>Error: {error}</p>
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
