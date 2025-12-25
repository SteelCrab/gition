/**
 * Shared Type Definitions
 * =============================================================================
 */

/**
 * File/Folder information
 */
export interface FileInfo {
    name: string;                       // File/folder name
    path: string;                       // Full path
    type: 'file' | 'directory';         // Type
    size?: number;                      // File size (bytes)
}

/**
 * Search result item
 */
export interface SearchResult {
    path: string;       // File path
    line: number;       // Line number
    content: string;    // Matching line content
}
