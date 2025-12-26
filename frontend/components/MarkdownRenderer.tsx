/**
 * MarkdownRenderer Component
 * 
 * Renders Markdown content using react-markdown with GitHub Flavored Markdown
 * support and syntax highlighting.
 * 
 * Styles are defined in MarkdownRenderer.css and use Tailwind @apply.
 */
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize from 'rehype-sanitize';
import 'highlight.js/styles/github.css';
import './MarkdownRenderer.css';

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
                rehypePlugins={[rehypeHighlight, rehypeSanitize]}
                components={{
                    // Behavioral overrides
                    a: ({ node, ...props }: any) => (
                        <a target="_blank" rel="noopener noreferrer" {...props} />
                    ),
                    img: ({ node, ...props }: any) => (
                        <img loading="lazy" {...props} />
                    ),
                    input: ({ node, type, checked, ...props }: any) => {
                        if (type === 'checkbox') {
                            return (
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled
                                    {...props}
                                />
                            );
                        }
                        return <input type={type} {...props} />;
                    },
                    // Structural overrides
                    table: ({ node, ...props }: any) => (
                        <div className="markdown-table-wrapper">
                            <table {...props} />
                        </div>
                    ),
                    // Style-only components are handled via CSS in MarkdownRenderer.css
                }}
            />
        </div>
    );
};

export default MarkdownRenderer;
