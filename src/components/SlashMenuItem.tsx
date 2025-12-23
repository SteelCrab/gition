/**
 * =============================================================================
 * SlashMenuItem Component
 * =============================================================================
 * 
 * Description: Notion-style slash (/) command menu item
 * 
 * Features:
 *   - Icon + label + description display
 *   - Active/inactive state styling
 *   - Hover effects
 * 
 * Props:
 *   - icon: Lucide icon component
 *   - label: Menu item title
 *   - desc: Menu item description
 *   - active: Whether currently selected
 * 
 * Usage:
 *   <SlashMenuItem icon={Type} label="Text" desc="Plain text block" active />
 * =============================================================================
 */

import { LucideIcon } from 'lucide-react';

// SlashMenuItem Props interface
interface SlashMenuItemProps {
    icon: LucideIcon;      // Lucide icon component
    label: string;         // Menu title
    desc: string;          // Menu description
    active?: boolean;      // Active state (selected)
}

const SlashMenuItem = ({ icon: Icon, label, desc, active }: SlashMenuItemProps) => (
    <div className={`
        flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors
        ${active ? 'bg-[#efefef]' : 'hover:bg-black/5'}
    `}>
        {/* Icon area (bordered box) */}
        <div className="w-8 h-8 rounded border border-[#efefef] flex items-center justify-center bg-white">
            <Icon size={18} className="text-[#37352f]" />
        </div>

        {/* Text area */}
        <div className="flex-1 min-w-0">
            <div className="text-[14px] font-medium text-[#37352f]">{label}</div>
            <div className="text-[12px] text-[#787774] truncate">{desc}</div>
        </div>
    </div>
);

export default SlashMenuItem;
