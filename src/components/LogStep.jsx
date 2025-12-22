import { CheckCircle, Loader2, Circle } from 'lucide-react';

const LogStep = ({ status, label, time }) => {
    let icon = <Circle size={14} className="text-[#37352f]/20" />;
    if (status === 'success') icon = <CheckCircle size={14} className="text-[#0f7b6c]" />;
    else if (status === 'running') icon = <Loader2 size={14} className="text-[#2383e2] animate-spin" />;

    return (
        <div className="flex items-center justify-between py-1 px-1 hover:bg-black/5 rounded-[3px]">
            <div className="flex items-center gap-2 text-[13px] text-[#37352f]">
                {icon}
                <span>{label}</span>
            </div>
            <span className="text-[11px] text-[#787774] font-mono">{time}</span>
        </div>
    );
};

export default LogStep;
