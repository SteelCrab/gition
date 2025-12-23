/**
 * =============================================================================
 * PipelineStep Component
 * =============================================================================
 * 
 * Description: Individual step display within a pipeline
 * 
 * Features:
 *   - Circular icon button style
 *   - Color changes based on status (success: green, default: gray)
 *   - Label + sub-info display
 * 
 * Props:
 *   - status: Step status ('success' | other)
 *   - icon: Icon ReactNode
 *   - label: Step name (e.g., "Build", "Test")
 *   - subLabel: Additional info (e.g., "2.4m", "PASS")
 * 
 * Styles:
 *   - Success: Green border, green text, light green background
 *   - Default: Gray border, gray text, light gray background
 * =============================================================================
 */

import { ReactNode } from 'react';

// PipelineStep Props interface
interface PipelineStepProps {
    status?: string;       // Status: 'success' | other
    icon: ReactNode;       // Icon element
    label: string;         // Step name
    subLabel: string;      // Additional info
}

const PipelineStep = ({ status, icon, label, subLabel }: PipelineStepProps) => (
    <div className="flex flex-col items-center">
        {/* Circular icon button */}
        <div className={`
            w-10 h-10 rounded-full flex items-center justify-center border transition-all
            ${status === 'success'
                ? 'border-[#0f7b6c] text-[#0f7b6c] bg-[#eef3f2]'  // Success style
                : 'border-[#efefef] text-[#787774] bg-[#f7f6f3]'  // Default style
            }
        `}>
            {icon}
        </div>

        {/* Label */}
        <span className="mt-1 text-[12px] font-medium text-[#37352f]">{label}</span>

        {/* Sub-info */}
        <span className="text-[10px] text-[#787774]">{subLabel}</span>
    </div>
);

export default PipelineStep;
