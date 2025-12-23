/**
 * =============================================================================
 * FileEditor Component
 * =============================================================================
 * 
 * Description: Combined file browser + code editor component
 * 
 * Features:
 *   - Directory navigation (folder click)
 *   - File content viewing/editing
 *   - Binary file detection
 *   - Change detection (Unsaved indicator)
 * 
 * Props:
 *   - userId: GitHub user ID
 *   - repoName: Repository name
 *   - onClose: Editor close callback
 * 
 * API:
 *   - GET /api/git/files: Fetch file list
 *   - GET /api/git/file: Fetch file content
 * 
 * State:
 *   - currentPath: Current directory path
 *   - files: File/folder list
 *   - selectedFile: Selected file path
 *   - fileContent: Content being edited
 *   - originalContent: Original content (for change detection)
 * 
 * View Modes:
 *   - File browser view: When selectedFile is null
 *   - Editor view: When selectedFile is set
 * =============================================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { File, Folder, ChevronRight, X, Loader2, ArrowLeft } from 'lucide-react';
import { FileInfo } from '../types';

// FileEditor Props interface
interface FileEditorProps {
    userId: string | null;     // User ID
    repoName: string;          // Repository name
    onClose: () => void;       // Close callback
}

const FileEditor = ({ userId, repoName, onClose }: FileEditorProps) => {
    // State management
    const [currentPath, setCurrentPath] = useState('');
    const [files, setFiles] = useState<FileInfo[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [fileContent, setFileContent] = useState('');
    const [originalContent, setOriginalContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [_saving, _setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetch file list
     * @param path Directory path
     */
    const loadFiles = useCallback(async (path: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `/api/git/files?user_id=${userId}&repo_name=${repoName}&path=${encodeURIComponent(path)}`
            );
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

    // Fetch root file list on component mount
    useEffect(() => {
        if (userId && repoName) {
            loadFiles('');
        }
    }, [userId, repoName, loadFiles]);

    /**
     * Fetch file content
     * @param filePath File path
     */
    const loadFileContent = async (filePath: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `/api/git/file?user_id=${userId}&repo_name=${repoName}&path=${encodeURIComponent(filePath)}`
            );
            const data = await response.json();
            if (data.status === 'success') {
                if (data.binary) {
                    // Binary files cannot be displayed
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

    /**
     * File/folder click handler
     */
    const handleFileClick = (file: FileInfo) => {
        if (file.type === 'directory') {
            loadFiles(file.path);
        } else {
            loadFileContent(file.path);
        }
    };

    /**
     * Back navigation handler
     * - Editing file: Return to browser view
     * - Navigating directory: Go to parent directory
     */
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

    // Change detection (compare with original)
    const hasChanges = fileContent !== originalContent;

    // Show message if userId/repoName is missing
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
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-black/5 rounded text-[#787774]"
                    title="Close"
                >
                    <X size={16} />
                </button>

                {/* Back button (when file selected or in subdirectory) */}
                {(selectedFile || currentPath) && (
                    <button
                        onClick={handleBack}
                        className="p-1.5 hover:bg-black/5 rounded text-[#787774]"
                        title="Back"
                    >
                        <ArrowLeft size={16} />
                    </button>
                )}

                {/* Repository/path info */}
                <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium text-[#37352f] truncate">
                        {repoName}
                    </div>
                    <div className="text-[12px] text-[#787774] truncate">
                        {selectedFile || currentPath || '/'}
                    </div>
                </div>

                {/* Changes indicator */}
                {hasChanges && (
                    <span className="text-[11px] px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                        Unsaved
                    </span>
                )}
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-hidden">
                {loading ? (
                    // Loading state
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="animate-spin text-[#787774]" size={24} />
                        <span className="ml-2 text-[#787774]">Loading...</span>
                    </div>
                ) : error ? (
                    // Error state
                    <div className="flex items-center justify-center h-full text-red-500">
                        {error}
                    </div>
                ) : selectedFile ? (
                    // File editor view
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
                    // File browser view
                    <div className="h-full overflow-y-auto p-2">
                        {files.length === 0 ? (
                            <div className="text-center text-[#787774] py-8">
                                No files found
                            </div>
                        ) : (
                            <div className="space-y-0.5">
                                {files.map((file) => (
                                    <button
                                        key={file.path}
                                        onClick={() => handleFileClick(file)}
                                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#f7f6f3] rounded-[6px] text-left transition-colors group"
                                    >
                                        {/* Icon */}
                                        {file.type === 'directory' ? (
                                            <Folder size={16} className="text-[#787774] shrink-0" />
                                        ) : (
                                            <File size={16} className="text-[#787774] shrink-0" />
                                        )}

                                        {/* Filename */}
                                        <span className="flex-1 text-[13px] text-[#37352f] truncate">
                                            {file.name}
                                        </span>

                                        {/* File size */}
                                        {file.size && (
                                            <span className="text-[11px] text-[#787774]">
                                                {file.size > 1024
                                                    ? `${(file.size / 1024).toFixed(1)}KB`
                                                    : `${file.size}B`}
                                            </span>
                                        )}

                                        {/* Arrow */}
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
