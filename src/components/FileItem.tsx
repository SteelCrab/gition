/**
 * =============================================================================
 * FileItem Component
 * =============================================================================
 * 
 * Description: Individual file display in file tree
 * 
 * Features:
 *   - File icon + filename display
 *   - Active/inactive state styling
 *   - Hover effects
 * 
 * Props:
 *   - name: Filename
 *   - active: Currently selected state
 *   - icon: Lucide icon component
 * 
 * Styles:
 *   - Active: Gray background, bold text
 *   - Inactive: Transparent background, slightly darker on hover
 * =============================================================================
 */

import { LucideIcon } from 'lucide-react';

// FileItem Props interface
interface FileItemProps {
    name: string;          // Filename
    active?: boolean;      // Active state
    icon: LucideIcon;      // File icon
}

const FileItem = ({ name, active, icon: Icon }: FileItemProps) => (
    <div
        className={`
            flex items-center gap-2 px-3 py-[3px] text-[14px] cursor-pointer transition-colors
            ${active
                ? 'bg-[#efefef] text-[#37352f] font-medium'  // Active state
                : 'text-[#37352f] hover:bg-black/5'         // Inactive state
            }
        `}
    >
        {/* File icon */}
        <Icon size={16} className="text-[#37352f]/60" />

        {/* Filename (truncate if overflow) */}
        <span className="truncate">{name}</span>
    </div>
);

export default FileItem;
