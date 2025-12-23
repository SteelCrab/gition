import { ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { ReactNode } from 'react';

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
            {isOpen ? <ChevronDown size={14} className="text-[#37352f]/30" /> : <ChevronRight size={14} className="text-[#37352f]/30" />}
            {isOpen ? <FolderOpen size={16} className="text-[#37352f]/60" /> : <Folder size={16} className="text-[#37352f]/60" />}
            <span className="font-medium">{name}</span>
        </div>
        {isOpen && <div className="ml-[18px]">{children}</div>}
    </div>
);

export default FolderItem;
