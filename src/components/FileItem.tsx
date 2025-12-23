import { LucideIcon } from 'lucide-react';

interface FileItemProps {
    name: string;
    active?: boolean;
    icon: LucideIcon;
}

const FileItem = ({ name, active, icon: Icon }: FileItemProps) => (
    <div
        className={`
      flex items-center gap-2 px-3 py-[3px] text-[14px] cursor-pointer transition-colors
      ${active ? 'bg-[#efefef] text-[#37352f] font-medium' : 'text-[#37352f] hover:bg-black/5'}
    `}
    >
        <Icon size={16} className="text-[#37352f]/60" />
        <span className="truncate">{name}</span>
    </div>
);

export default FileItem;
