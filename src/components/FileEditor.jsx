import { useState, useEffect, useCallback } from 'react';
import { File, Folder, ChevronRight, X, Loader2, ArrowLeft } from 'lucide-react';

const FileEditor = ({ userId, repoName, onClose }) => {
    const [currentPath, setCurrentPath] = useState('');
    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileContent, setFileContent] = useState('');
    const [originalContent, setOriginalContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [_saving, _setSaving] = useState(false);
    const [error, setError] = useState(null);

    const loadFiles = useCallback(async (path) => {
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
        } catch (_err) {
            setError('Failed to load files');
        } finally {
            setLoading(false);
        }
    }, [userId, repoName]);

    // Load files on mount
    useEffect(() => {
        if (userId && repoName) {
            loadFiles('');
        }
    }, [userId, repoName, loadFiles]);

    const loadFileContent = async (filePath) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/git/file?user_id=${userId}&repo_name=${repoName}&path=${encodeURIComponent(filePath)}`);
            const data = await response.json();
            if (data.status === 'success') {
                if (data.binary) {
                    setFileContent('[Binary file - cannot display]');
                    setOriginalContent('[Binary file - cannot display]');
                } else {
                    setFileContent(data.content || '');
                    setOriginalContent(data.content || '');
                }
                setSelectedFile(filePath);
            } else {
                setError(data.message);
            }
        } catch (_err) {
            setError('Failed to load file');
        } finally {
            setLoading(false);
        }
    };

    const handleFileClick = (file) => {
        if (file.type === 'directory') {
            loadFiles(file.path);
        } else {
            loadFileContent(file.path);
        }
    };

    const handleBack = () => {
        if (selectedFile) {
            setSelectedFile(null);
            setFileContent('');
        } else if (currentPath) {
            const parts = currentPath.split('/');
            parts.pop();
            loadFiles(parts.join('/'));
        }
    };

    const hasChanges = fileContent !== originalContent;

    if (!userId || !repoName) {
        return (
            <div className="flex items-center justify-center h-full text-[#787774]">
                Select a repository to view files
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#efefef] bg-[#fafafa]">
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-black/5 rounded text-[#787774]"
                    title="Close"
                >
                    <X size={16} />
                </button>

                {(selectedFile || currentPath) && (
                    <button
                        onClick={handleBack}
                        className="p-1.5 hover:bg-black/5 rounded text-[#787774]"
                        title="Back"
                    >
                        <ArrowLeft size={16} />
                    </button>
                )}

                <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium text-[#37352f] truncate">
                        {repoName}
                    </div>
                    <div className="text-[12px] text-[#787774] truncate">
                        {selectedFile || currentPath || '/'}
                    </div>
                </div>

                {hasChanges && (
                    <span className="text-[11px] px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                        Unsaved
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="animate-spin text-[#787774]" size={24} />
                        <span className="ml-2 text-[#787774]">Loading...</span>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-full text-red-500">
                        {error}
                    </div>
                ) : selectedFile ? (
                    /* File Editor */
                    <div className="h-full flex flex-col">
                        <textarea
                            value={fileContent}
                            onChange={(e) => setFileContent(e.target.value)}
                            className="flex-1 w-full p-4 font-mono text-[13px] leading-relaxed resize-none focus:outline-none bg-[#1e1e1e] text-[#d4d4d4]"
                            spellCheck={false}
                            style={{ tabSize: 2 }}
                        />
                    </div>
                ) : (
                    /* File Browser */
                    <div className="h-full overflow-y-auto p-2">
                        {files.length === 0 ? (
                            <div className="text-center text-[#787774] py-8">
                                No files found
                            </div>
                        ) : (
                            <div className="space-y-0.5">
                                {files.map((file, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleFileClick(file)}
                                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#f7f6f3] rounded-[6px] text-left transition-colors group"
                                    >
                                        {file.type === 'directory' ? (
                                            <Folder size={16} className="text-[#787774] shrink-0" />
                                        ) : (
                                            <File size={16} className="text-[#787774] shrink-0" />
                                        )}
                                        <span className="flex-1 text-[13px] text-[#37352f] truncate">
                                            {file.name}
                                        </span>
                                        {file.size && (
                                            <span className="text-[11px] text-[#787774]">
                                                {file.size > 1024 ? `${(file.size / 1024).toFixed(1)}KB` : `${file.size}B`}
                                            </span>
                                        )}
                                        <ChevronRight size={14} className="text-[#787774] opacity-0 group-hover:opacity-100 shrink-0" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileEditor;
