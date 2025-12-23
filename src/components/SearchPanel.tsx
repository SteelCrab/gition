import { useState, useEffect } from 'react';
import { Search, X, FileText, Loader2, ChevronRight } from 'lucide-react';

const SearchPanel = ({ userId, repoName, onFileSelect }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const searchContent = query.trim();
        if (searchContent.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams({
                    user_id: userId,
                    repo_name: repoName,
                    query: query
                });

                const response = await fetch(`/api/git/search?${params.toString()}`);
                const data = await response.json();

                if (data.status === 'success') {
                    setResults(data.results);
                } else {
                    setError(data.message);
                    setResults([]);
                }
            } catch (_err) {
                console.error('Search failed:', _err);
                setError('Search failed');
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query, userId, repoName]);

    return (
        <div className="flex flex-col h-full bg-white">
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

            <div className="flex-1 overflow-y-auto">
                {loading && (
                    <div className="p-8 text-center">
                        <Loader2 className="animate-spin mx-auto text-[#787774]" size={20} />
                    </div>
                ) || error && (
                    <div className="p-4 text-center text-red-500 text-[12px]">
                        {error}
                    </div>
                ) || query.length >= 2 && results.length === 0 && !loading && (
                    <div className="p-8 text-center text-[#787774] text-[13px]">
                        No results for &quot;{query}&quot;
                    </div>
                ) || results.map((result, idx) => (
                    <button
                        key={idx}
                        onClick={() => onFileSelect(result.path, result.line)}
                        className="w-full text-left p-3 hover:bg-[#f7f6f3] border-b border-[#efefef] transition-colors group"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <FileText size={14} className="text-[#787774]" />
                            <span className="text-[13px] font-medium text-[#37352f] truncate">
                                {result.path}
                            </span>
                        </div>
                        <div className="pl-6">
                            <div className="text-[11px] text-[#787774] mb-1">
                                Line {result.line}
                            </div>
                            <div className="text-[12px] text-[#37352f] font-mono bg-[#fafafa] p-1.5 rounded border border-[#efefef] truncate">
                                {result.content.trim()}
                            </div>
                        </div>
                        <div className="flex justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight size={14} className="text-[#787774]" />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SearchPanel;
