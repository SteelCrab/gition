import React, { useState, useEffect } from 'react';
import { File, Folder, ChevronRight, ChevronDown, Loader2, ArrowLeft, RefreshCw, Home } from 'lucide-react';

const FileBrowser = ({ userId, repoName, onFileSelect, onBack }) => {
    const [currentPath, setCurrentPath] = useState('');
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedFolders, setExpandedFolders] = useState({});

    useEffect(() => {
        if (userId && repoName) {
            loadFiles('');
        }
    }, [userId, repoName]);

    const loadFiles = async (path) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/git/files?user_id=${userId}&repo_name=${repoName}&path=${encodeURIComponent(path)}`);
            const data = await response.json();
            if (data.status === 'success') {
                setFiles(data.files);
                setCurrentPath(path);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to load files');
        } finally {
            setLoading(false);
        }
    };

    const handleFileClick = (file) => {
        if (file.type === 'directory') {
            loadFiles(file.path);
        } else {
            if (onFileSelect) {
                onFileSelect(file.path, file.name);
            }
        }
    };

    const handleBack = () => {
        if (currentPath) {
            const parts = currentPath.split('/');
            parts.pop();
            loadFiles(parts.join('/'));
        } else if (onBack) {
            onBack();
        }
    };

    const getFileIcon = (file) => {
        if (file.type === 'directory') {
            return <Folder size={14} className="text-yellow-600" />;
        }

        const ext = file.name.split('.').pop().toLowerCase();
        const colors = {
            js: 'text-yellow-500', jsx: 'text-blue-400', ts: 'text-blue-600', tsx: 'text-blue-500',
            py: 'text-green-500', json: 'text-yellow-600', md: 'text-gray-500',
            css: 'text-pink-500', html: 'text-orange-500', sql: 'text-blue-400',
        };
        return <File size={14} className={colors[ext] || 'text-gray-400'} />;
    };

    if (!userId || !repoName) {
        return (
            <div className="p-3 text-center text-[12px] text-[#787774]">
                Select a repository first
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-1 px-2 py-2 border-b border-[#efefef]">
                <button
                    onClick={onBack}
                    className="p-1 hover:bg-black/5 rounded text-[#787774]"
                    title="Back to repos"
                >
                    <ArrowLeft size={14} />
                </button>
                <button
                    onClick={() => loadFiles('')}
                    className="p-1 hover:bg-black/5 rounded text-[#787774]"
                    title="Go to root"
                >
                    <Home size={14} />
                </button>
                <div className="flex-1 min-w-0 px-1">
                    <div className="text-[12px] font-medium text-[#37352f] truncate">{repoName}</div>
                    <div className="text-[10px] text-[#787774] truncate">{currentPath || '/'}</div>
                </div>
                <button
                    onClick={() => loadFiles(currentPath)}
                    className="p-1 hover:bg-black/5 rounded text-[#787774]"
                    title="Refresh"
                >
                    <RefreshCw size={12} />
                </button>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto py-1">
                {loading ? (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 size={16} className="animate-spin text-[#787774]" />
                    </div>
                ) : error ? (
                    <div className="p-3 text-center text-[12px] text-red-500">{error}</div>
                ) : files.length === 0 ? (
                    <div className="p-3 text-center text-[12px] text-[#787774]">Empty folder</div>
                ) : (
                    <div className="space-y-0.5 px-1">
                        {currentPath && (
                            <button
                                onClick={handleBack}
                                className="w-full flex items-center gap-2 px-2 py-1 hover:bg-[#f7f6f3] rounded text-left text-[12px] text-[#787774]"
                            >
                                <ChevronRight size={12} className="rotate-180" />
                                <span>..</span>
                            </button>
                        )}
                        {files.map((file, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleFileClick(file)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-[#f7f6f3] rounded text-left group transition-colors"
                            >
                                {getFileIcon(file)}
                                <span className="flex-1 text-[12px] text-[#37352f] truncate">{file.name}</span>
                                {file.type === 'directory' && (
                                    <ChevronRight size={12} className="text-[#787774] opacity-0 group-hover:opacity-100" />
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileBrowser;
