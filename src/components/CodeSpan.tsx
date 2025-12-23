import { ReactNode } from 'react';

const CodeSpan = ({ children }: { children: ReactNode }) => (
    <code className="px-1 py-0.5 mx-0.5 bg-[#f7f6f3] border border-[#efefef] rounded-[3px] text-[#eb5757] font-mono text-[0.9em]">
        {children}
    </code>
);

export default CodeSpan;
