/**
 * =============================================================================
 * CodeBlock Component
 * =============================================================================
 * 
 * Description: Notion-style code block editor
 * 
 * Features:
 *   - Code editing (contentEditable)
 *   - Filename/language display and editing
 *   - Clipboard copy button
 *   - Copy confirmation feedback (check icon)
 * 
 * Props:
 *   - id: Block unique identifier
 *   - language: Programming language (optional)
 *   - filename: Filename (optional)
 *   - content: Code content
 *   - onUpdate: Callback for updates (filename, language, content)
 * 
 * State:
 *   - copied: Copy completion status (resets after 2 seconds)
 * =============================================================================
 */

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

// CodeBlock Props interface
interface CodeBlockProps {
    id: string;                                                       // Block unique ID
    language?: string;                                                // Programming language
    filename?: string;                                                // Filename
    content: string;                                                  // Code content
    onUpdate: (id: string, updates: {                                 // Update callback
        filename?: string;
        language?: string;
        content?: string
    }) => void;
}

const CodeBlock = ({ id, language, filename, content, onUpdate }: CodeBlockProps) => {
    // Copy completion state (auto-resets after 2 seconds)
    const [copied, setCopied] = useState(false);

    /**
     * Copy code to clipboard
     * - Uses navigator.clipboard API
     * - Shows check icon for 2 seconds after copy
     */
    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group my-4 notion-code">
            {/* Header: Filename + Language + Copy button */}
            {(filename || language) && (
                <div className="flex items-center justify-between mb-2 text-[12px] text-[#787774] font-medium border-b border-[#efefef] pb-1">
                    {/* Filename (editable) */}
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

                    {/* Language + Copy button */}
                    <div className="flex items-center gap-2 text-[#37352f]/40">
                        <span
                            contentEditable
                            onBlur={(e) => onUpdate(id, { language: e.target.innerText })}
                            suppressContentEditableWarning
                            className="outline-none hover:text-[#37352f]"
                        >
                            {language}
                        </span>
                        <button
                            onClick={handleCopy}
                            className="hover:bg-[#efefef] p-1 rounded transition-colors"
                        >
                            {/* Show check icon when copied, otherwise copy icon */}
                            {copied ? <Check size={12} className="text-[#2383e2]" /> : <Copy size={12} />}
                        </button>
                    </div>
                </div>
            )}

            {/* Code area (editable) */}
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
