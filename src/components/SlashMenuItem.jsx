const SlashMenuItem = ({ icon: Icon, label, desc, active }) => (
    <div className={`
    flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors
    ${active ? 'bg-[#efefef]' : 'hover:bg-black/5'}
  `}>
        <div className="w-8 h-8 rounded border border-[#efefef] flex items-center justify-center bg-white">
            <Icon size={18} className="text-[#37352f]" />
        </div>
        <div className="flex-1 min-w-0">
            <div className="text-[14px] font-medium text-[#37352f]">{label}</div>
            <div className="text-[12px] text-[#787774] truncate">{desc}</div>
        </div>
    </div>
);

export default SlashMenuItem;
