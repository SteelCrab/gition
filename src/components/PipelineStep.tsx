import { ReactNode } from 'react';

interface PipelineStepProps {
    status?: string;
    icon: ReactNode;
    label: string;
    subLabel: string;
}

const PipelineStep = ({ status, icon, label, subLabel }: PipelineStepProps) => (
    <div className="flex flex-col items-center">
        <div className={`
      w-10 h-10 rounded-full flex items-center justify-center border transition-all
      ${status === 'success' ? 'border-[#0f7b6c] text-[#0f7b6c] bg-[#eef3f2]' : 'border-[#efefef] text-[#787774] bg-[#f7f6f3]'}
    `}>
            {icon}
        </div>
        <span className="mt-1 text-[12px] font-medium text-[#37352f]">{label}</span>
        <span className="text-[10px] text-[#787774]">{subLabel}</span>
    </div>
);

export default PipelineStep;
