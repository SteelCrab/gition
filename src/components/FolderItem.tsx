/**
 * =============================================================================
 * FolderItem Component
 * =============================================================================
 * 
 * Description: Folder (directory) display in file tree
 * 
 * Features:
 *   - Open/close toggle
 *   - Show children when open
 *   - Arrow + folder icon state changes
 * 
 * Props:
 *   - name: Folder name
 *   - isOpen: Expanded state
 *   - children: Child file/folder elements
 *   - onClick: Click handler (for toggle)
 * 
 * Icon States:
 *   - Closed: ChevronRight + Folder
 *   - Open: ChevronDown + FolderOpen
 * =============================================================================
 */

import { ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { ReactNode } from 'react';

// FolderItem Props interface
interface FolderItemProps {
    name: string;             // Folder name
    isOpen: boolean;          // Expanded state
    children?: ReactNode;     // Child elements
    onClick: () => void;      // Click handler
}

const FolderItem = ({ name, isOpen, children, onClick }: FolderItemProps) => (
    <div>
        {/* Folder header (clickable) */}
        <div
            className="flex items-center gap-2 px-3 py-[3px] text-[14px] cursor-pointer hover:bg-black/5"
            onClick={onClick}
        >
            {/* Arrow icon (open/closed) */}
            {isOpen
                ? <ChevronDown size={14} className="text-[#37352f]/30" />
                : <ChevronRight size={14} className="text-[#37352f]/30" />
            }

            {/* Folder icon (open/closed) */}
            {isOpen
                ? <FolderOpen size={16} className="text-[#37352f]/60" />
                : <Folder size={16} className="text-[#37352f]/60" />
            }

            {/* Folder name */}
            <span className="font-medium">{name}</span>
        </div>

        {/* Child elements (shown only when open, with indentation) */}
        {isOpen && <div className="ml-[18px]">{children}</div>}
    </div>
);

export default FolderItem;
