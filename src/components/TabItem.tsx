/**
 * =============================================================================
 * TabItem Component
 * =============================================================================
 * 
 * Description: File tab item in editor header
 * 
 * Features:
 *   - Filename display
 *   - Active/inactive tab styling
 *   - Unsaved changes indicator (orange dot)
 *   - Close button (X)
 * 
 * Props:
 *   - name: Filename
 *   - active: Whether tab is currently active
 *   - unsaved: Whether there are unsaved changes
 *   - onClose: Tab close callback
 * 
 * Styles:
 *   - Active tab: White background, dark text
 *   - Inactive tab: Gray background, light text
 *   - Close button visible on hover
 * =============================================================================
 */

import { FileText, X } from 'lucide-react';

// TabItem Props interface
interface TabItemProps {
    name: string;          // Filename
    active?: boolean;      // Active state
    unsaved?: boolean;     // Unsaved indicator
    onClose: () => void;   // Close callback
}

const TabItem = ({ name, active, unsaved, onClose }: TabItemProps) => (
    <div
        className={`
            flex items-center gap-2 px-3 h-10 text-[14px] cursor-pointer group border-r border-[#efefef]
            ${active
                ? 'bg-white text-[#37352f] font-medium'      // Active tab style
                : 'bg-[#f7f6f3] text-[#787774] hover:bg-[#efefef]'  // Inactive tab style
            }
        `}
    >
        {/* File icon */}
        <FileText size={16} className={active ? 'text-[#37352f]' : 'text-[#787774]'} />

        {/* Filename (max 120px, truncate if overflow) */}
        <span className="truncate max-w-[120px]">{name}</span>

        {/* Unsaved indicator (orange dot) */}
        {unsaved && <div className="w-1.5 h-1.5 rounded-full bg-[#d9730d]" />}

        {/* Close button (visible on hover for inactive tabs) */}
        <button
            onClick={(e) => {
                e.stopPropagation();  // Prevent tab click event propagation
                onClose();
            }}
            className={`ml-1 p-0.5 rounded hover:bg-black/5 
                ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        >
            <X size={12} />
        </button>
    </div>
);

export default TabItem;
