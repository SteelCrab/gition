/**
 * =============================================================================
 * TextBlock Component
 * =============================================================================
 * 
 * Description: Notion-style text block editor
 * 
 * Features:
 *   - Inline text editing using contentEditable
 *   - Real-time content updates (onInput)
 *   - Preserves line breaks (whitespace-pre-wrap)
 * 
 * Props:
 *   - id: Block unique identifier
 *   - content: Text content
 *   - onUpdate: Callback when content changes
 * 
 * Usage:
 *   <TextBlock id="block-1" content="Hello" onUpdate={handleUpdate} />
 * =============================================================================
 */

// TextBlock Props interface
interface TextBlockProps {
    id: string;                                    // Block unique ID
    content: string;                               // Text content
    onUpdate: (id: string, newContent: string) => void;  // Update callback
}

const TextBlock = ({ id, content, onUpdate }: TextBlockProps) => (
    <div className="group relative py-1 my-1">
        {/* Editable text area using contentEditable */}
        <p
            className="text-[16px] text-[#37352f] leading-[1.6] whitespace-pre-wrap outline-none"
            contentEditable
            onInput={(e) => onUpdate(id, e.currentTarget.innerText)}
            suppressContentEditableWarning  // Suppress React warning
        >
            {content}
        </p>
    </div>
);

export default TextBlock;
