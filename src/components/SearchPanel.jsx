import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, File, FileText, Loader2, ChevronRight } from 'lucide-react';

const SearchPanel = ({ userId, repoName, onFileSelect }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchContent, setSearchContent] = useState(true);

    // Debounced search
    useEffect(() => {
        if (!query || query.length < 2 || !userId || !repoName) {
            setResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams({
                    user_id: userId,
                    repo_name: repoName,
                    query: query,
                    content: searchContent.toString()
                });

                const response = await fetch(`/api/git/search?${params}`);
                const data = await response.json();

                if (data.status === 'success') {
                    setResults(data.results);
                } else {
                    setError(data.message);
                    setResults([]);
                }
            } catch (err) {
                setError('Search failed');
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query, userId, repoName, searchContent]);

    const highlightMatch = (text, query) => {
        if (!text || !query) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, i) =>
            regex.test(part) ? (
                <mark key={i} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">{part}</mark>
            ) : part
        );
    };

    if (!userId || !repoName) {
        return (
            <div className="p-3 text-center text-[12px] text-[#787774]">
                Select a repository to search
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Search Input */}
            <div className="p-2 border-b border-[#efefef]">
                <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#787774]" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search files..."
                        className="w-full pl-8 pr-8 py-1.5 text-[13px] bg-[#f7f6f3] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#37352f]/20"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#787774] hover:text-[#37352f]"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Search Options */}
                <div className="flex items-center gap-2 mt-2">
                    <label className="flex items-center gap-1.5 text-[11px] text-[#787774] cursor-pointer">
                        <input
                            type="checkbox"
                            checked={searchContent}
                            onChange={(e) => setSearchContent(e.target.checked)}
                            className="rounded border-gray-300 text-[#37352f] focus:ring-[#37352f]"
                        />
                        Search in file contents
                    </label>
                </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto">
                {loading && (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 size={16} className="animate-spin text-[#787774]" />
                        <span className="ml-2 text-[12px] text-[#787774]">Searching...</span>
                    </div>
                )}

                {error && (
                    <div className="p-3 text-center text-[12px] text-red-500">
                        {error}
                    </div>
                )}

                {!loading && !error && query.length >= 2 && results.length === 0 && (
                    <div className="p-3 text-center text-[12px] text-[#787774]">
                        No results found for "{query}"
                    </div>
                )}

                {!loading && results.length > 0 && (
                    <div className="divide-y divide-[#efefef]">
                        {results.map((result, index) => (
                            <button
                                key={`${result.path}-${result.line || 0}-${index}`}
                                onClick={() => onFileSelect && onFileSelect(result.path, result.line)}
                                className="w-full p-2 text-left hover:bg-[#f7f6f3] transition-colors group"
                            >
                                <div className="flex items-center gap-2">
                                    <FileText size={14} className="text-[#787774] shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[12px] font-medium text-[#37352f] truncate">
                                                {result.name}
                                            </span>
                                            {result.type === 'content' && result.line && (
                                                <span className="text-[10px] px-1.5 py-0.5 bg-[#e8e8e8] rounded text-[#787774]">
                                                    L{result.line}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[11px] text-[#787774] truncate">
                                            {result.path}
                                        </div>
                                        {result.context && (
                                            <div className="mt-1 text-[11px] text-[#37352f] bg-[#f7f6f3] p-1.5 rounded font-mono truncate">
                                                {highlightMatch(result.context, query)}
                                            </div>
                                        )}
                                    </div>
                                    <ChevronRight size={12} className="text-[#787774] opacity-0 group-hover:opacity-100 shrink-0" />
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {!loading && !error && query.length < 2 && (
                    <div className="p-3 text-center text-[12px] text-[#787774]">
                        Type at least 2 characters to search
                    </div>
                )}
            </div>

            {/* Results Count */}
            {results.length > 0 && (
                <div className="p-2 border-t border-[#efefef] text-[11px] text-[#787774]">
                    {results.length} result{results.length !== 1 ? 's' : ''} found
                </div>
            )}
        </div>
    );
};

export default SearchPanel;
