import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, FileText } from 'lucide-react';

const RepoPage = () => {
    const { owner, repoName, branchName, "*": filePath } = useParams();
    const navigate = useNavigate();
    const [content, setContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isReadme, setIsReadme] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!repoName || !owner) return;

            // Redirect if branch is missing
            if (!branchName) {
                navigate(`/repo/${owner}/${repoName}/main`, { replace: true });
                return;
            }

            setLoading(true);
            setError(null);
            setContent(null);

            const userId = localStorage.getItem('userLogin') || localStorage.getItem('userId') || owner;
            const targetBranch = branchName || 'main'; // Should be present due to redirect above

            try {
                // Fetch Content using stateless API (checkout is handled by backend or implied)
                // Note: Modified backend to accept 'branch' param in /api/git/file if not already supported.
                // Assuming backend /api/git/file supports `branch` or `ref` param. 
                // Based on previous code, we were adding &branch=${branch} but then removed it.
                // Now we RE-ADD it and REMOVE the checkout call.

                let targetPath = filePath;
                let fetchReadme = false;

                if (!targetPath) {
                    fetchReadme = true;
                }

                if (fetchReadme) {
                    const readmeFiles = ['README.md', 'readme.md', 'README.MD', 'Readme.md'];
                    for (const readmeFile of readmeFiles) {
                        try {
                            // Stateless call: pass branch explicitly
                            const response = await fetch(`/api/git/file?user_id=${userId}&repo_name=${repoName}&path=${encodeURIComponent(readmeFile)}&branch=${targetBranch}`);
                            const data = await response.json();
                            if (data.status === 'success' && !data.binary && data.content) {
                                setContent(data.content);
                                setIsReadme(true);
                                setLoading(false);
                                return;
                            }
                        } catch (e) { /* continue */ }
                    }
                    // If loop finishes without return, no README found
                    setIsReadme(false);
                } else if (targetPath) {
                    // Load specific file
                    const response = await fetch(`/api/git/file?user_id=${userId}&repo_name=${repoName}&path=${encodeURIComponent(targetPath)}&branch=${targetBranch}`);
                    const data = await response.json();
                    if (data.status === 'success') {
                        if (data.binary) {
                            setContent('[Binary file - cannot display]');
                        } else {
                            setContent(data.content || '');
                        }
                        setIsReadme(false);
                    } else {
                        setError('File not found or could not be loaded');
                    }
                }
            } catch (err) {
                console.error("Failed to load content", err);
                setError('Error loading content');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [owner, repoName, branchName, filePath, navigate]);

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
                {error}
            </div>
        );
    }

    if (!content && isReadme === false && !filePath) {
        // No README found and no file selected
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
    }

    if (filePath) {
        // File Editor View
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

    // README View
    return (
        <div className="max-w-[800px] mx-auto px-12 sm:px-24 py-16">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#37352f] text-white rounded-[6px] flex items-center justify-center font-bold text-[16px]">
                    {repoName?.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h1 className="text-[28px] font-bold text-[#37352f]">{repoName}</h1>
                    <p className="text-[14px] text-[#787774]">{owner}</p>
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
};

export default RepoPage;
