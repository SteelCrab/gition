/**
 * =============================================================================
 * LogStep Component
 * =============================================================================
 * 
 * Description: Individual step display for pipeline/CI logs
 * 
 * Features:
 *   - Status-based icon display (success/running/pending)
 *   - Step label + elapsed time display
 *   - Hover effects
 * 
 * Props:
 *   - status: Step status ('success' | 'running' | undefined)
 *   - label: Step name
 *   - time: Elapsed time (e.g., "2.5s")
 * 
 * Status Icons:
 *   - success: Green checkmark (CheckCircle)
 *   - running: Blue spinner (Loader2)
 *   - default: Gray circle (Circle)
 * =============================================================================
 */

import { CheckCircle, Loader2, Circle } from 'lucide-react';

// LogStep Props interface
interface LogStepProps {
    status?: string;    // Status: 'success' | 'running' | undefined
    label: string;      // Step label
    time: string;       // Elapsed time
}

const LogStep = ({ status, label, time }: LogStepProps) => {
    // Determine icon based on status
    let icon = <Circle size={14} className="text-[#37352f]/20" />;  // Default: pending
    if (status === 'success') {
        icon = <CheckCircle size={14} className="text-[#0f7b6c]" />;      // Success
    } else if (status === 'running') {
        icon = <Loader2 size={14} className="text-[#2383e2] animate-spin" />;  // Running
    }

    return (
        <div className="flex items-center justify-between py-1 px-1 hover:bg-black/5 rounded-[3px]">
            {/* Left: Icon + Label */}
            <div className="flex items-center gap-2 text-[13px] text-[#37352f]">
                {icon}
                <span>{label}</span>
            </div>

            {/* Right: Elapsed time */}
            <span className="text-[11px] text-[#787774] font-mono">{time}</span>
        </div>
    );
};

export default LogStep;
