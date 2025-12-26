/**
 * MarkdownRenderer Component
 * 
 * Renders Markdown content using react-markdown with GitHub Flavored Markdown
 * support and syntax highlighting for code blocks.
 */
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import { ComponentPropsWithoutRef } from 'react';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

/**
 * Safe Markdown renderer with GFM and syntax highlighting
 */
const MarkdownRenderer = ({ content, className = '' }: MarkdownRendererProps) => {
    return (
        <div className={`markdown-body ${className}`}>
            <ReactMarkdown
                children={content}
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                    // Custom heading styles
                    h1: ({ children, ...props }: ComponentPropsWithoutRef<'h1'>) => (
                        <h1 className="text-[24px] font-semibold text-[#37352f] mt-6 mb-4 pb-2 border-b border-[#e8e8e8]" {...props}>
                            {children}
                        </h1>
                    ),
                    h2: ({ children, ...props }: ComponentPropsWithoutRef<'h2'>) => (
                        <h2 className="text-[20px] font-semibold text-[#37352f] mt-5 mb-3 pb-2 border-b border-[#e8e8e8]" {...props}>
                            {children}
                        </h2>
                    ),
                    h3: ({ children, ...props }: ComponentPropsWithoutRef<'h3'>) => (
                        <h3 className="text-[17px] font-semibold text-[#37352f] mt-4 mb-2" {...props}>
                            {children}
                        </h3>
                    ),
                    h4: ({ children, ...props }: ComponentPropsWithoutRef<'h4'>) => (
                        <h4 className="text-[15px] font-semibold text-[#37352f] mt-3 mb-2" {...props}>
                            {children}
                        </h4>
                    ),
                    // Paragraphs
                    p: ({ children, ...props }: ComponentPropsWithoutRef<'p'>) => (
                        <p className="text-[14px] text-[#37352f] leading-relaxed my-3" {...props}>
                            {children}
                        </p>
                    ),
                    // Links
                    a: ({ children, href, ...props }: ComponentPropsWithoutRef<'a'>) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#2383e2] hover:underline"
                            {...props}
                        >
                            {children}
                        </a>
                    ),
                    // Lists
                    ul: ({ children, ...props }: ComponentPropsWithoutRef<'ul'>) => (
                        <ul className="list-disc list-inside my-3 pl-4 text-[14px] text-[#37352f]" {...props}>
                            {children}
                        </ul>
                    ),
                    ol: ({ children, ...props }: ComponentPropsWithoutRef<'ol'>) => (
                        <ol className="list-decimal list-inside my-3 pl-4 text-[14px] text-[#37352f]" {...props}>
                            {children}
                        </ol>
                    ),
                    li: ({ children, ...props }: ComponentPropsWithoutRef<'li'>) => (
                        <li className="my-1" {...props}>
                            {children}
                        </li>
                    ),
                    // Code blocks
                    pre: ({ children, ...props }: ComponentPropsWithoutRef<'pre'>) => (
                        <pre className="bg-[#f7f6f3] rounded-md p-4 my-4 overflow-x-auto text-[13px]" {...props}>
                            {children}
                        </pre>
                    ),
                    code: ({ className, children, ...props }: ComponentPropsWithoutRef<'code'> & { className?: string }) => {
                        const isInline = !className?.includes('language-');
                        if (isInline) {
                            return (
                                <code className="bg-[#f7f6f3] text-[#eb5757] px-1.5 py-0.5 rounded text-[13px] font-mono" {...props}>
                                    {children}
                                </code>
                            );
                        }
                        return <code className={className} {...props}>{children}</code>;
                    },
                    // Blockquotes
                    blockquote: ({ children, ...props }: ComponentPropsWithoutRef<'blockquote'>) => (
                        <blockquote className="border-l-4 border-[#e8e8e8] pl-4 my-4 text-[#787774] italic" {...props}>
                            {children}
                        </blockquote>
                    ),
                    // Tables (GFM)
                    table: ({ children, ...props }: ComponentPropsWithoutRef<'table'>) => (
                        <div className="overflow-x-auto my-4">
                            <table className="min-w-full border border-[#e8e8e8]" {...props}>
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({ children, ...props }: ComponentPropsWithoutRef<'thead'>) => (
                        <thead className="bg-[#f7f6f3]" {...props}>{children}</thead>
                    ),
                    th: ({ children, ...props }: ComponentPropsWithoutRef<'th'>) => (
                        <th className="border border-[#e8e8e8] px-4 py-2 text-left text-[13px] font-semibold text-[#37352f]" {...props}>
                            {children}
                        </th>
                    ),
                    td: ({ children, ...props }: ComponentPropsWithoutRef<'td'>) => (
                        <td className="border border-[#e8e8e8] px-4 py-2 text-[13px] text-[#37352f]" {...props}>
                            {children}
                        </td>
                    ),
                    // Horizontal rule
                    hr: (props: ComponentPropsWithoutRef<'hr'>) => (
                        <hr className="my-6 border-t border-[#e8e8e8]" {...props} />
                    ),
                    // Images
                    img: ({ src, alt, ...props }: ComponentPropsWithoutRef<'img'>) => (
                        <img
                            src={src}
                            alt={alt}
                            className="max-w-full h-auto my-4 rounded"
                            loading="lazy"
                            {...props}
                        />
                    ),
                    // Checkboxes (GFM task lists)
                    input: ({ type, checked, ...props }: ComponentPropsWithoutRef<'input'>) => {
                        if (type === 'checkbox') {
                            return (
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled
                                    className="mr-2 accent-[#2383e2]"
                                    {...props}
                                />
                            );
                        }
                        return <input type={type} {...props} />;
                    },
                }}
            />
        </div>
    );
};

export default MarkdownRenderer;
