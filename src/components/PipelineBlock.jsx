import { Terminal, Box, Play, Loader2, CheckCircle, Search } from 'lucide-react';
import { useState } from 'react';
import PipelineStep from './PipelineStep';

const PipelineBlock = ({ label, status: initialStatus = 'idle' }) => {
    const [status, setStatus] = useState(initialStatus);

    const handleDeploy = () => {
        setStatus('running');
        setTimeout(() => setStatus('success'), 2500);
    };

    return (
        <div className="border border-[#efefef] rounded-[3px] my-10 bg-white overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
            <div className="px-4 py-2 bg-[#f7f6f3] border-b border-[#efefef] flex items-center justify-between text-[13px] text-[#787774]">
                <div className="flex items-center gap-2 font-medium">
                    <Terminal size={14} /> <span>Pipeline: {label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${status === 'success' ? 'bg-[#0f7b6c]' : 'bg-[#d9730d] animate-pulse'}`} />
                    <span className={`${status === 'success' ? 'text-[#0f7b6c]' : 'text-[#d9730d]'} font-medium`}>
                        {status === 'success' ? 'Synced' : status === 'running' ? 'Deploying...' : 'Ready'}
                    </span>
                </div>
            </div>

            <div className="p-8">
                <div className="flex items-center justify-between relative mb-12">
                    <div className="absolute top-5 left-10 right-10 h-[1px] bg-[#efefef] -z-0" />
                    <PipelineStep status="success" icon={<Box size={16} />} label="Build" subLabel="2.4m" />
                    <PipelineStep status="success" icon={<CheckCircle size={16} />} label="Test" subLabel="PASS" />
                    <PipelineStep status="success" icon={<Search size={16} />} label="Scan" subLabel="OK" />

                    <div className="relative z-10 flex flex-col items-center">
                        <button
                            onClick={handleDeploy}
                            disabled={status !== 'idle'}
                            className={`
                  w-10 h-10 rounded-full flex items-center justify-center border transition-all
                  ${status === 'idle' ? 'bg-[#2383e2] border-[#2383e2] text-white hover:bg-[#0070e0]' :
                                    status === 'running' ? 'bg-white border-[#2383e2] text-[#2383e2]' :
                                        'bg-[#0f7b6c] border-[#0f7b6c] text-white'}
                `}
                        >
                            {status === 'idle' && <Play size={16} fill="currentColor" />}
                            {status === 'running' && <Loader2 size={16} className="animate-spin" />}
                            {status === 'success' && <CheckCircle size={16} />}
                        </button>
                        <span className="mt-1 text-[12px] font-medium text-[#37352f]">Deploy</span>
                    </div>
                </div>

                {status !== 'idle' && (
                    <div className="bg-[#191711] text-[#f7f6f3] p-4 rounded-[3px] font-mono text-[13px] border border-black animate-fadeIn">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[#0f7b6c]">$</span>
                            <span className="text-[#2383e2]">gition-cli</span>
                            <span>deploy --target production</span>
                        </div>
                        <div className="opacity-70 whitespace-pre-wrap">
                            {status === 'running' ? '➜ Connecting to cluster...\n➜ Verifying build #412\n➜ Initiating rolling update...' :
                                '➜ Rolling update complete.\n➜ Verifying health checks...\n➜ DONE: Service live at https://gition-app.prod'}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PipelineBlock;
