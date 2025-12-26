/**
 * =============================================================================
 * SearchPanel Component
 * =============================================================================
 * 
 * Description: File content search panel for cloned repositories
 * 
 * Features:
 *   - Debounced search (500ms)
 *   - Display file path, line number, and context
 *   - Click to navigate to file/line
 *   - Loading and error states
 * 
 * Props:
 *   - userId: GitHub user ID
 *   - repoName: Repository name
 *   - onFileSelect: Callback when file is selected (path, line)
 * 
 * API:
 *   - GET /api/git/search?user_id={}&repo_name={}&query={}
 * 
 * State:
 *   - query: Search query
 *   - results: Search results
 *   - loading: Search in progress
 *   - error: Error message
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import { Search, X, FileText, Loader2, ChevronRight } from 'lucide-react';

import { SearchResult } from '../types';

// SearchPanel Props interface
interface SearchPanelProps {
    userId: string | null;                              // User ID
    repoName?: string;                                  // Repository name
    onFileSelect: (path: string, line: number) => void; // File selection callback
}

const SearchPanel = ({ userId, repoName, onFileSelect }: SearchPanelProps) => {
    // State management
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Debounced search effect
     * - Triggers search 500ms after query changes
     * - Minimum 2 characters required
     */
    useEffect(() => {
        const searchContent = query.trim();
        if (searchContent.length < 2) {
            setResults([]);
            return;
        }

        const controller = new AbortController();

        const timer = setTimeout(async () => {
            // Skip search if userId or repoName is missing
            if (!userId || !repoName) {
                setResults([]);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams({
                    user_id: userId,
                    repo_name: repoName,
                    query: searchContent // Use trimmed content
                });

                const response = await fetch(`/api/git/search?${params.toString()}`, {
                    signal: controller.signal,
                    credentials: 'include'
                });
                const data = await response.json();

                if (data.status === 'success') {
                    setResults(data.results);
                } else {
                    setError(data.message);
                    setResults([]);
                }
            } catch (_err: any) {
                if (_err.name === 'AbortError') return;
                console.error('Search failed:', _err);
                setError('Search failed');
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 500);

        // Cleanup timer and controller on query change
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query, userId, repoName]);

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Search input */}
            <div className="p-3 border-b border-[#efefef]">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#787774]" size={14} />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search files..."
                        className="w-full bg-[#f7f6f3] border-none rounded-[6px] pl-9 pr-8 py-1.5 text-[13px] focus:ring-1 focus:ring-[#efefef] outline-none"
                    />
                    {/* Clear button */}
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#787774] hover:text-[#37352f]"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Results area */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    // Loading state
                    <div className="p-8 text-center">
                        <Loader2 className="animate-spin mx-auto text-[#787774]" size={20} />
                    </div>
                ) : error ? (
                    // Error state
                    <div className="p-4 text-center text-red-500 text-[12px]">
                        {error}
                    </div>
                ) : query.length >= 2 && results.length === 0 ? (
                    // No results
                    <div className="p-8 text-center text-[#787774] text-[13px]">
                        No results for &quot;{query}&quot;
                    </div>
                ) : (
                    // Search result list
                    results.map((result) => (
                        // Search result item
                        <button
                            key={`${result.path}:${result.line}`}
                            onClick={() => onFileSelect(result.path, result.line)}
                            className="w-full text-left p-3 hover:bg-[#f7f6f3] border-b border-[#efefef] transition-colors group"
                        >
                            {/* File path */}
                            <div className="flex items-center gap-2 mb-1">
                                <FileText size={14} className="text-[#787774]" />
                                <span className="text-[13px] font-medium text-[#37352f] truncate">
                                    {result.path}
                                </span>
                            </div>
                            {/* Line number and context */}
                            <div className="pl-6">
                                <div className="text-[11px] text-[#787774] mb-1">
                                    Line {result.line}
                                </div>
                                <div className="text-[12px] text-[#37352f] font-mono bg-[#fafafa] p-1.5 rounded border border-[#efefef] truncate">
                                    {result.content.trim()}
                                </div>
                            </div>
                            {/* Arrow (visible on hover) */}
                            <div className="flex justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronRight size={14} className="text-[#787774]" />
                            </div>
                        </button>
                    )))}
            </div>
        </div>
    );
};

export default SearchPanel;
