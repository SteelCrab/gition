/**
 * =============================================================================
 * FileBrowser Component
 * =============================================================================
 * 
 * Description: Repository file/folder explorer
 * 
 * Features:
 *   - Display file/folder list in directory
 *   - Navigate to subdirectory on folder click
 *   - Call onFileSelect callback on file click
 *   - Back navigation
 * 
 * Props:
 *   - userId: GitHub user ID
 *   - repoName: Repository name
 *   - onFileSelect: File selection callback (path, name)
 *   - onBack: Back navigation callback (at root)
 * 
 * API:
 *   - GET /api/git/files?user_id={}&repo_name={}&path={}
 * 
 * State:
 *   - files: File/folder list
 *   - path: Current path
 *   - loading: Loading state
 *   - error: Error message
 * =============================================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { ChevronRight, File, Folder, ArrowLeft } from 'lucide-react';

import { FileInfo } from '../types';

// FileBrowser Props interface
interface FileBrowserProps {
    userId: string | null;                              // User ID
    repoName: string;                                   // Repository name
    onFileSelect?: (path: string, name: string) => void; // File selection callback
    onBack?: () => void;                                // Back navigation callback
}

const FileBrowser = ({ userId, repoName, onFileSelect, onBack }: FileBrowserProps) => {
    // State management
    const [files, setFiles] = useState<FileInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [path, setPath] = useState('');

    /**
     * Fetch file list API call
     */
    const loadFiles = useCallback(async () => {
        if (!userId || !repoName) return;
        setLoading(true);
        try {
            const response = await fetch(
                `/api/git/files?user_id=${encodeURIComponent(userId)}&repo_name=${encodeURIComponent(repoName)}&path=${encodeURIComponent(path)}`,
                { credentials: 'include' }
            );
            const data = await response.json();
            if (data.status === 'success') {
                setFiles(data.files || []);
                setError(null); // Clear error on success
            } else {
                setError(data.message || 'Failed to load files');
            }
        } catch (_err) {
            setError('Error connecting to server');
        } finally {
            setLoading(false);
        }
    }, [userId, repoName, path]);

    // Re-fetch file list when path changes
    useEffect(() => {
        loadFiles();
    }, [loadFiles]);

    /**
     * Back navigation handler
     * - Call onBack callback if at root path
     * - Otherwise navigate to parent directory
     */
    const handleBack = () => {
        if (path === '') {
            onBack?.();
        } else {
            const parts = path.split('/');
            parts.pop();
            setPath(parts.join('/'));
        }
    };

    /**
     * File/folder click handler
     * - Folder: Navigate to that directory
     * - File: Call onFileSelect callback
     */
    const handleFileClick = (file: FileInfo) => {
        if (file.type === 'directory') {
            setPath(file.path);
        } else {
            onFileSelect?.(file.path, file.name);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header: Back button + Current path */}
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

            {/* File list */}
            <div className="flex-1 overflow-y-auto p-2">
                {loading ? (
                    // Loading spinner
                    <div className="flex items-center justify-center py-8">
                        <div className="w-5 h-5 border-2 border-[#37352f] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : error ? (
                    // Error message
                    <div className="p-4 text-center text-red-500 text-[13px]">
                        {error}
                    </div>
                ) : files.length === 0 ? (
                    // Empty state
                    <div className="p-8 text-center text-[#787774] text-[13px]">
                        No files found
                    </div>
                ) : (
                    // File/folder list
                    <div className="space-y-0.5">
                        {files.map((file) => (
                            <button
                                key={file.path}
                                onClick={() => handleFileClick(file)}
                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#f7f6f3] rounded-[6px] text-left transition-colors group"
                            >
                                {/* Icon */}
                                {file.type === 'directory' ? (
                                    <Folder size={16} className="text-[#787774] shrink-0" />
                                ) : (
                                    <File size={16} className="text-[#787774] shrink-0" />
                                )}

                                {/* Name */}
                                <span className="flex-1 text-[13px] text-[#37352f] truncate">
                                    {file.name}
                                </span>

                                {/* Arrow (visible on hover) */}
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
