/**
 * =============================================================================
 * HeadingBlock Component
 * =============================================================================
 * 
 * Description: Notion-style heading block editor (H1, H2, H3)
 * 
 * Features:
 *   - Three heading levels (1, 2, 3)
 *   - Inline editing using contentEditable
 *   - Notion-inspired styling with appropriate font sizes and weights
 *   - Real-time content updates
 * 
 * Props:
 *   - id: Block unique identifier
 *   - level: Heading level (1, 2, or 3)
 *   - content: Heading text content
 *   - onUpdate: Callback when content changes
 * 
 * Styling:
 *   - H1: 32px, bold, 1.2 line-height
 *   - H2: 24px, bold, 1.3 line-height
 *   - H3: 18px, bold, 1.4 line-height
 * 
 * Usage:
 *   <HeadingBlock id="block-1" level={1} content="Title" onUpdate={handleUpdate} />
 * =============================================================================
 */

import React from 'react';

// HeadingBlock Props interface
interface HeadingBlockProps {
    id: string;                                    // Block unique ID
    level: 1 | 2 | 3;                             // Heading level (H1, H2, H3)
    content: string;                               // Heading text
    onUpdate: (id: string, newContent: string) => void;  // Update callback
}

const HeadingBlock = ({ id, level, content, onUpdate }: HeadingBlockProps) => {
    /**
     * Get Notion-style classes based on heading level
     * H1: Largest, boldest
     * H2: Medium size
     * H3: Smaller, still prominent
     */
    const getHeadingClasses = () => {
        switch (level) {
            case 1:
                return 'text-[32px] font-bold leading-[1.2] mt-8 mb-2';
            case 2:
                return 'text-[24px] font-bold leading-[1.3] mt-6 mb-1.5';
            case 3:
                return 'text-[18px] font-bold leading-[1.4] mt-4 mb-1';
            default:
                return 'text-[18px] font-bold leading-[1.4] mt-4 mb-1';
        }
    };

    /**
     * Get appropriate HTML tag based on level
     */
    const Tag = `h${level}` as 'h1' | 'h2' | 'h3';

    return (
        <div className="group relative">
            {/* Editable heading using contentEditable */}
            <Tag
                className={`${getHeadingClasses()} text-[#37352f] outline-none cursor-text`}
                contentEditable
                onInput={(e: React.FormEvent<HTMLHeadingElement>) => onUpdate(id, e.currentTarget.innerText)}
                suppressContentEditableWarning  // Suppress React warning
            >
                {content}
            </Tag>
        </div>
    );
};

export default HeadingBlock;
