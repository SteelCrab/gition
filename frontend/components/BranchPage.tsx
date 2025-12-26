/**
 * =============================================================================
 * BranchPage Component
 * =============================================================================
 * 
 * Description: Notion-style page editor for each branch
 * 
 * Features:
 *   - Display page title and content
 *   - Auto-save on content change (debounced)
 *   - Loading and error states
 *   - Create page if not exists
 * 
 * Props:
 *   - userId: GitHub user ID
 *   - repoName: Repository name
 *   - branchName: Branch name
 * 
 * API:
 *   - GET /api/pages/{user_id}/{repo_name}/{branch_name}
 *   - PUT /api/pages/{user_id}/{repo_name}/{branch_name}
 *   - POST /api/pages/{user_id}/{repo_name}/{branch_name}
 * 
 * Storage:
 *   - Pages are stored in .gition/pages/{branch_name}.json
 *   - Local only, not pushed to GitHub
 * =============================================================================
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { FileText, Save, Loader2, Check, AlertCircle } from 'lucide-react';

// Page data interface
interface PageData {
    id: string;
    branch_name: string;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
    metadata: {
        created_from_branch: boolean;
        branch_exists: boolean;
    };
}

// BranchPage Props interface
interface BranchPageProps {
    userId: string | null;
    repoName: string;
    branchName: string;
}

// Save status type
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const BranchPage = ({ userId, repoName, branchName }: BranchPageProps) => {
    // State management
    const [page, setPage] = useState<PageData | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

    // Refs for debouncing
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastSavedContentRef = useRef<string>('');
    const lastSavedTitleRef = useRef<string>('');

    /**
     * Fetch page data from API
     */
    const fetchPage = useCallback(async () => {
        if (!userId || !repoName || !branchName) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/pages/${encodeURIComponent(userId)}/${encodeURIComponent(repoName)}/${encodeURIComponent(branchName)}`,
                { credentials: 'include' }
            );

            const data = await response.json();

            if (data.status === 'success') {
                setPage(data.page);
                setTitle(data.page.title);
                setContent(data.page.content);
                lastSavedContentRef.current = data.page.content;
                lastSavedTitleRef.current = data.page.title;
            } else if (data.status === 'not_found') {
                // Create new page
                await createPage();
            } else {
                setError(data.message || 'Failed to load page');
            }
        } catch (err) {
            console.error('Failed to fetch page:', err);
            setError('Failed to load page. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [userId, repoName, branchName]);

    /**
     * Create a new page for this branch
     */
    const createPage = async () => {
        if (!userId || !repoName || !branchName) return;

        try {
            const response = await fetch(
                `/api/pages/${encodeURIComponent(userId)}/${encodeURIComponent(repoName)}/${encodeURIComponent(branchName)}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        title: branchName,
                        content: ''
                    })
                }
            );

            const data = await response.json();

            if (data.status === 'success' || data.status === 'exists') {
                setPage(data.page);
                setTitle(data.page.title);
                setContent(data.page.content);
                lastSavedContentRef.current = data.page.content;
                lastSavedTitleRef.current = data.page.title;
            } else {
                setError(data.message || 'Failed to create page');
            }
        } catch (err) {
            console.error('Failed to create page:', err);
            setError('Failed to create page. Please try again.');
        }
    };

    /**
     * Save page content to API
     */
    const savePage = async (newTitle: string, newContent: string) => {
        if (!userId || !repoName || !branchName) return;

        // Skip if nothing changed
        if (newTitle === lastSavedTitleRef.current && newContent === lastSavedContentRef.current) {
            return;
        }

        setSaveStatus('saving');

        try {
            const response = await fetch(
                `/api/pages/${encodeURIComponent(userId)}/${encodeURIComponent(repoName)}/${encodeURIComponent(branchName)}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        title: newTitle,
                        content: newContent
                    })
                }
            );

            const data = await response.json();

            if (data.status === 'success') {
                setPage(data.page);
                lastSavedContentRef.current = newContent;
                lastSavedTitleRef.current = newTitle;
                setSaveStatus('saved');

                // Reset to idle after 2 seconds
                setTimeout(() => setSaveStatus('idle'), 2000);
            } else {
                setSaveStatus('error');
                console.error('Save failed:', data.message);
            }
        } catch (err) {
            console.error('Failed to save page:', err);
            setSaveStatus('error');
        }
    };

    /**
     * Debounced save handler
     */
    const handleContentChange = (newContent: string) => {
        setContent(newContent);

        // Clear previous timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Set new timeout for auto-save (1.5 seconds)
        saveTimeoutRef.current = setTimeout(() => {
            savePage(title, newContent);
        }, 1500);
    };

    /**
     * Handle title change with debounced save
     */
    const handleTitleChange = (newTitle: string) => {
        setTitle(newTitle);

        // Clear previous timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Set new timeout for auto-save
        saveTimeoutRef.current = setTimeout(() => {
            savePage(newTitle, content);
        }, 1500);
    };

    // Fetch page on mount or when branch changes
    useEffect(() => {
        fetchPage();

        // Cleanup timeout on unmount
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [fetchPage]);

    // Render loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-white">
                <Loader2 className="animate-spin text-[#787774]" size={24} />
                <span className="ml-2 text-[#787774]">Loading page...</span>
            </div>
        );
    }

    // Render error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-white text-center px-4">
                <AlertCircle size={32} className="text-red-500 mb-4" />
                <p className="text-[14px] text-red-600 mb-4">{error}</p>
                <button
                    onClick={fetchPage}
                    className="px-4 py-2 bg-[#37352f] text-white text-[13px] rounded-[4px] hover:bg-black transition-colors"
                >
                    Try again
                </button>
            </div>
        );
    }

    // Render save status indicator
    const renderSaveStatus = () => {
        switch (saveStatus) {
            case 'saving':
                return (
                    <div className="flex items-center gap-1 text-[#787774]">
                        <Loader2 size={12} className="animate-spin" />
                        <span className="text-[11px]">Saving...</span>
                    </div>
                );
            case 'saved':
                return (
                    <div className="flex items-center gap-1 text-green-600">
                        <Check size={12} />
                        <span className="text-[11px]">Saved</span>
                    </div>
                );
            case 'error':
                return (
                    <div className="flex items-center gap-1 text-red-500">
                        <AlertCircle size={12} />
                        <span className="text-[11px]">Save failed</span>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-[#efefef]">
                <div className="flex items-center gap-2">
                    <FileText size={16} className="text-[#787774]" />
                    <span className="text-[12px] text-[#787774]">
                        Branch: <span className="font-medium text-[#37352f]">{branchName}</span>
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {renderSaveStatus()}
                    <button
                        onClick={() => savePage(title, content)}
                        disabled={saveStatus === 'saving'}
                        className="flex items-center gap-1 px-2 py-1 text-[11px] text-[#787774] hover:bg-[#f7f6f3] rounded transition-colors disabled:opacity-50"
                        title="Save now"
                    >
                        <Save size={12} />
                        Save
                    </button>
                </div>
            </div>

            {/* Page content */}
            <div className="flex-1 overflow-y-auto px-6 py-8 max-w-[800px] mx-auto w-full">
                {/* Title input */}
                <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Untitled"
                    className="w-full text-[32px] font-bold text-[#37352f] border-none outline-none bg-transparent placeholder-[#c4c4c4] mb-4"
                />

                {/* Metadata */}
                {page && (
                    <div className="text-[11px] text-[#787774] mb-6">
                        Created: {new Date(page.created_at).toLocaleDateString()}
                        {page.updated_at !== page.created_at && (
                            <span> · Updated: {new Date(page.updated_at).toLocaleDateString()}</span>
                        )}
                    </div>
                )}

                {/* Content textarea */}
                <textarea
                    value={content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    placeholder="Start writing here... Your notes will be saved automatically."
                    className="w-full min-h-[300px] text-[15px] text-[#37352f] leading-relaxed border-none outline-none bg-transparent placeholder-[#c4c4c4] resize-none"
                    style={{ lineHeight: '1.75' }}
                />
            </div>
        </div>
    );
};

export default BranchPage;
