import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface CodeBlockProps {
    id: string;
    language?: string;
    filename?: string;
    content: string;
    onUpdate: (id: string, updates: { filename?: string; language?: string; content?: string }) => void;
}

const CodeBlock = ({ id, language, filename, content, onUpdate }: CodeBlockProps) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group my-4 notion-code">
            {(filename || language) && (
                <div className="flex items-center justify-between mb-2 text-[12px] text-[#787774] font-medium border-b border-[#efefef] pb-1">
                    <div className="flex items-center gap-2">
                        <span
                            contentEditable
                            onBlur={(e) => onUpdate(id, { filename: e.target.innerText })}
                            suppressContentEditableWarning
                            className="outline-none"
                        >
                            {filename || 'Untitled'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-[#37352f]/40">
                        <span
                            contentEditable
                            onBlur={(e) => onUpdate(id, { language: e.target.innerText })}
                            suppressContentEditableWarning
                            className="outline-none hover:text-[#37352f]"
                        >
                            {language}
                        </span>
                        <button onClick={handleCopy} className="hover:bg-[#efefef] p-1 rounded transition-colors">
                            {copied ? <Check size={12} className="text-[#2383e2]" /> : <Copy size={12} />}
                        </button>
                    </div>
                </div>
            )}
            <pre className="overflow-x-auto outline-none">
                <code
                    className="text-[#37352f]"
                    contentEditable
                    onInput={(e) => onUpdate(id, { content: e.currentTarget.innerText })}
                    suppressContentEditableWarning
                >
                    {content}
                </code>
            </pre>
        </div>
    );
};

export default CodeBlock;
