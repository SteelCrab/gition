/**
 * =============================================================================
 * Block Parser Utility
 * =============================================================================
 * 
 * Description: Parse text content into structured blocks (Markdown to Block)
 * 
 * Features:
 *   - Recognize Markdown header syntax (#, ##, ###)
 *   - Convert text to block metadata structure
 *   - Preserve block positions and types
 *   - Handle edge cases (empty lines, mixed content)
 * 
 * Block Types:
 *   - heading: { type: 'heading', level: 1|2|3, content: string }
 *   - text: { type: 'text', content: string }
 * 
 * Functions:
 *   - parseTextToBlocks: Convert raw text to block array
 *   - blocksToText: Convert block array back to text
 * =============================================================================
 */

/**
 * Block metadata interface
 */
export interface Block {
    id: string;                                    // Unique block identifier
    type: 'text' | 'heading';                      // Block type
    content: string;                               // Block content
    level?: 1 | 2 | 3;                            // Heading level (for heading blocks)
    position?: number;                             // Block position in document
}

/**
 * Parse text content into structured blocks
 * 
 * Rules:
 * - Lines starting with # are H1
 * - Lines starting with ## are H2
 * - Lines starting with ### are H3
 * - Other lines are text blocks
 * - Empty lines are preserved as empty text blocks
 * 
 * @param text - Raw text content
 * @returns Array of block objects
 */
export function parseTextToBlocks(text: string): Block[] {
    if (!text || text.trim() === '') {
        // Return single empty text block for empty content
        return [{
            id: generateBlockId(),
            type: 'text',
            content: '',
            position: 0
        }];
    }

    const lines = text.split('\n');
    const blocks: Block[] = [];
    let position = 0;

    for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Check for heading patterns
        const h3Match = trimmedLine.match(/^###\s+(.+)$/);
        const h2Match = !h3Match && trimmedLine.match(/^##\s+(.+)$/);
        const h1Match = !h3Match && !h2Match && trimmedLine.match(/^#\s+(.+)$/);

        if (h1Match) {
            // H1 heading
            blocks.push({
                id: generateBlockId(),
                type: 'heading',
                level: 1,
                content: h1Match[1],
                position: position++
            });
        } else if (h2Match) {
            // H2 heading
            blocks.push({
                id: generateBlockId(),
                type: 'heading',
                level: 2,
                content: h2Match[1],
                position: position++
            });
        } else if (h3Match) {
            // H3 heading
            blocks.push({
                id: generateBlockId(),
                type: 'heading',
                level: 3,
                content: h3Match[1],
                position: position++
            });
        } else {
            // Text block (including empty lines)
            blocks.push({
                id: generateBlockId(),
                type: 'text',
                content: line,  // Preserve original line with spacing
                position: position++
            });
        }
    }

    return blocks;
}

/**
 * Convert blocks back to text format
 * 
 * Rules:
 * - Heading blocks are converted to # syntax
 * - Text blocks are kept as-is
 * - Blocks are joined with newlines
 * 
 * @param blocks - Array of block objects
 * @returns Text representation
 */
export function blocksToText(blocks: Block[]): string {
    return blocks.map(block => {
        if (block.type === 'heading' && block.level) {
            const prefix = '#'.repeat(block.level);
            return `${prefix} ${block.content}`;
        }
        return block.content;
    }).join('\n');
}

/**
 * Generate unique block ID using timestamp and random suffix
 * @returns Unique block identifier
 */
function generateBlockId(): string {
    return `block-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Update a specific block in the blocks array
 * 
 * @param blocks - Current blocks array
 * @param blockId - ID of block to update
 * @param content - New content
 * @returns Updated blocks array
 */
export function updateBlock(blocks: Block[], blockId: string, content: string): Block[] {
    return blocks.map(block => 
        block.id === blockId 
            ? { ...block, content } 
            : block
    );
}
