import { ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { ReactNode } from 'react';

/**
 * Renders a folder in the file tree with toggleable open/closed states.
 */
interface FolderItemProps {
    name: string;
    isOpen: boolean;
    children?: ReactNode;
    onClick: () => void;
}

const FolderItem = ({ name, isOpen, children, onClick }: FolderItemProps) => (
    <div>
        <div
            className="flex items-center gap-2 px-3 py-[3px] text-[14px] cursor-pointer hover:bg-black/5"
            onClick={onClick}
        >
            {/* Visual indicator for collapse/expand state */}
            {isOpen
                ? <ChevronDown size={14} className="text-[#37352f]/30" />
                : <ChevronRight size={14} className="text-[#37352f]/30" />
            }

            {isOpen
                ? <FolderOpen size={16} className="text-[#37352f]/60" />
                : <Folder size={16} className="text-[#37352f]/60" />
            }

            <span className="font-medium">{name}</span>
        </div>

        {/* Indent children to create a visual hierarchy when expanded */}
        {isOpen && <div className="ml-[18px]">{children}</div>}
    </div>
);

export default FolderItem;
