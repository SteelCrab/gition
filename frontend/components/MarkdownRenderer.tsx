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
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
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
    // Custom sanitize schema to preserve syntax highlighting classes
    const sanitizeSchema = {
        ...defaultSchema,
        attributes: {
            ...defaultSchema.attributes,
            code: [
                ...(defaultSchema.attributes?.code || []),
                ['className'], // preserve language-* and hljs classes
            ],
            span: [
                ...(defaultSchema.attributes?.span || []),
                ['className'], // preserve hljs token classes
            ],
            pre: [
                ...(defaultSchema.attributes?.pre || []),
                ['className'],
            ],
        },
    };

    return (
        <div className={`markdown-body ${className}`}>
            <ReactMarkdown
                children={content}
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[[rehypeSanitize, sanitizeSchema], rehypeHighlight]}
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
