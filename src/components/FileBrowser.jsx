import { useState, useEffect, useCallback } from 'react';
import { ChevronRight, File, Folder, ArrowLeft } from 'lucide-react';

const FileBrowser = ({ userId, repoName, onFileSelect, onBack }) => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [path, setPath] = useState('');

    const loadFiles = useCallback(async () => {
        if (!userId || !repoName) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/git/files?user_id=${userId}&repo_name=${repoName}&path=${encodeURIComponent(path)}`);
            const data = await response.json();
            if (data.status === 'success') {
                setFiles(data.files || []);
            } else {
                setError(data.message || 'Failed to load files');
            }
        } catch (_err) {
            setError('Error connecting to server');
        } finally {
            setLoading(false);
        }
    }, [userId, repoName, path]);

    useEffect(() => {
        loadFiles();
    }, [loadFiles]);

    const handleBack = () => {
        if (path === '') {
            onBack?.();
        } else {
            const parts = path.split('/');
            parts.pop();
            setPath(parts.join('/'));
        }
    };

    const handleFileClick = (file) => {
        if (file.type === 'directory') {
            setPath(file.path);
        } else {
            onFileSelect?.(file.path);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#efefef]">
                <button
                    onClick={handleBack}
                    className="p-1.5 hover:bg-black/5 rounded text-[#787774]"
                >
                    <ArrowLeft size={16} />
                </button>
                <div className="text-[14px] font-medium text-[#37352f] truncate">
                    {path || '/'}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="w-5 h-5 border-2 border-[#37352f] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : error ? (
                    <div className="p-4 text-center text-red-500 text-[13px]">
                        {error}
                    </div>
                ) : files.length === 0 ? (
                    <div className="p-8 text-center text-[#787774] text-[13px]">
                        No files found
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        {files.map((file, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleFileClick(file)}
                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#f7f6f3] rounded-[6px] text-left transition-colors group"
                            >
                                {file.type === 'directory' ? (
                                    <Folder size={16} className="text-[#787774] shrink-0" />
                                ) : (
                                    <File size={16} className="text-[#787774] shrink-0" />
                                )}
                                <span className="flex-1 text-[13px] text-[#37352f] truncate">
                                    {file.name}
                                </span>
                                <ChevronRight size={14} className="text-[#787774] opacity-0 group-hover:opacity-100 shrink-0" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileBrowser;
