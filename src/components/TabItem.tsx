/**
 * TabItem Component
 * 
 * Description: File tab item in editor header
 * Props:
 *   - name: Filename
 *   - active: Whether tab is currently active
 *   - unsaved: Whether there are unsaved changes
 *   - onClose: Tab close callback
 */

import { FileText, X } from 'lucide-react';

interface TabItemProps {
    name: string;
    active?: boolean;
    unsaved?: boolean;
    onClose: () => void;
}

const TabItem = ({ name, active, unsaved, onClose }: TabItemProps) => (
    <div
        className={`
            flex items-center gap-2 px-3 h-10 text-[14px] cursor-pointer group border-r border-[#efefef]
            ${active
                ? 'bg-white text-[#37352f] font-medium'
                : 'bg-[#f7f6f3] text-[#787774] hover:bg-[#efefef]'
            }
        `}
    >
        <FileText size={16} className={active ? 'text-[#37352f]' : 'text-[#787774]'} />

        <span className="truncate max-w-[120px]">{name}</span>

        {unsaved && <div className="w-1.5 h-1.5 rounded-full bg-[#d9730d]" />}

        <button
            onClick={(e) => {
                e.stopPropagation();
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
