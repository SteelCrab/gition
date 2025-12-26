import { useState } from 'react';
import { FileText, Code, GitBranch, Terminal, Plus, Loader2, LucideIcon } from 'lucide-react';

interface Block {
    id: string;
    type: 'text' | 'code' | 'pipeline';
    content?: string;
    language?: string;
    filename?: string;
    label?: string;
}

const SlashMenuItem = ({ icon: Icon, label, desc }: { icon: LucideIcon; label: string; desc: string }) => (
    <div className="flex items-center gap-2 p-2 hover:bg-[#efefef] cursor-pointer rounded-[3px]">
        <div className="w-5 h-5 flex items-center justify-center text-[#787774]">
            <Icon size={16} />
        </div>
        <div>
            <div className="text-[13px] font-medium text-[#37352f]">{label}</div>
            <div className="text-[11px] text-[#787774]">{desc}</div>
        </div>
    </div>
);

const TextBlock = ({ id, content, onUpdate }: { id: string; content: string; onUpdate: (id: string, val: string) => void }) => (
    <div
        className="text-[16px] leading-relaxed text-[#37352f] outline-none min-h-[24px] empty:before:content-[attr(placeholder)] empty:before:text-[#37352f]/20 cursor-text"
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onUpdate(id, e.currentTarget.textContent || '')}
    >
        {content}
    </div>
);

const CodeBlock = ({ id, content, language, filename, onUpdate }: { id: string; content: string; language: string; filename: string; onUpdate: (id: string, updates: Partial<Block>) => void }) => (
    <div className="my-2 border border-[#efefef] rounded-[4px] bg-[#f7f6f3] text-[13px] font-mono group relative">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#efefef] bg-[#fafafa] rounded-t-[4px]">
            <input
                className="bg-transparent border-none outline-none text-[#787774] text-[12px] w-full"
                value={filename}
                onChange={(e) => onUpdate(id, { filename: e.target.value })}
            />
            <span className="text-[10px] text-[#787774] uppercase">{language}</span>
        </div>
        <textarea
            className="w-full bg-transparent border-none outline-none p-3 resize-y min-h-[80px] text-[#37352f]"
            value={content}
            onChange={(e) => onUpdate(id, { content: e.target.value })}
            spellCheck={false}
        />
    </div>
);

const PipelineBlock = ({ label }: { label: string }) => (
    <div className="my-4 border border-[#efefef] rounded-[6px] overflow-hidden bg-white shadow-sm">
        <div className="bg-[#fafafa] px-4 py-2 border-b border-[#efefef] flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Terminal size={14} className="text-[#787774]" />
                <span className="text-[13px] font-medium text-[#37352f]">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[11px] text-[#787774] font-medium">Running</span>
                </div>
            </div>
        </div>
        <div className="p-4 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-[12px] overflow-x-auto">
            <div className="flex items-center gap-4 mb-4">
                <div className="flex flex-col gap-1 opacity-50">
                    <div className="w-3 h-3 rounded-full bg-white/20" />
                    <div className="h-8 w-0.5 bg-white/10 mx-auto" />
                </div>
                <div>
                    <div className="text-white font-medium">Build</div>
                    <div className="text-white/40">npm install && npm run build</div>
                </div>
                <div className="ml-auto text-green-400">2s</div>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1">
                    <div className="w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
                </div>
                <div>
                    <div className="text-white font-medium">Deploy</div>
                    <div className="text-white/40">aws s3 sync ./dist s3://...</div>
                </div>
                <div className="ml-auto text-blue-400">Running...</div>
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    const [blocks, setBlocks] = useState<Block[]>([
        { id: '1', type: 'text', content: 'Welcome to gition. This repository demonstrates the power of combining Git version control with a rich block editor and integrated CI/CD pipelines.' },
        { id: '2', type: 'code', language: 'bash', filename: 'CLI installation', content: 'git clone https://github.com/gition/gition.git\ncd gition && pnpm install\npnpm dev' },
        { id: '3', type: 'text', content: 'Below is an interactive pipeline block. Trigger builds and deployments directly from this document.' },
        { id: '4', type: 'pipeline', label: 'production-rollout (isomorphic-git)' }
    ]);
    const [showSlashMenu, setShowSlashMenu] = useState(false);
    const [isCloning, setIsCloning] = useState(false);

    const handleUpdateBlock = (id: string, updates: Partial<Block> | string) => {
        setBlocks(prev => prev.map(block =>
            block.id === id ? { ...block, ...(typeof updates === 'string' ? { content: updates } : updates) } : block
        ));
    };

    const handleAddBlock = (type: 'text' | 'code' | 'pipeline') => {
        const newBlock: Block = {
            id: Date.now().toString(),
            type,
            content: type === 'text' ? '' : type === 'code' ? '// Start coding...' : undefined,
            ...(type === 'code' ? { language: 'javascript', filename: 'new-file.js' } : {}),
            ...(type === 'pipeline' ? { label: 'new-pipeline' } : {})
        };
        setBlocks(prev => [...prev, newBlock]);
        setShowSlashMenu(false);
    };

    const handleClone = async (_url: string) => {
        // Placeholder for cloning functionality in dashboard
        setIsCloning(true);
        setTimeout(() => setIsCloning(false), 2000); // Simulate
    };

    const renderBlock = (block: Block) => {
        switch (block.type) {
            case 'text':
                return block.content !== undefined ? <TextBlock key={block.id} id={block.id} content={block.content} onUpdate={handleUpdateBlock} /> : null;
            case 'code':
                return block.content !== undefined ? <CodeBlock key={block.id} id={block.id} content={block.content} language={block.language || 'text'} filename={block.filename || ''} onUpdate={handleUpdateBlock} /> : null;
            case 'pipeline':
                return block.label !== undefined ? <PipelineBlock key={block.id} label={block.label} /> : null;
            default:
                return null;
        }
    };

    return (
        <div className="max-w-[800px] mx-auto px-6 sm:px-12 md:px-24 py-16" onClick={() => setShowSlashMenu(false)}>
            <h1 className="text-[32px] sm:text-[40px] font-bold text-[#37352f] mb-2" contentEditable suppressContentEditableWarning>Gition</h1>
            <p className="text-[16px] sm:text-[18px] text-[#787774] mb-8 font-medium">Developer&apos;s All-in-One Collaboration Platform</p>

            <div className="space-y-1">
                {blocks.map(renderBlock)}
            </div>

            <div className="mt-12 relative group">
                <div className="flex items-center gap-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); setShowSlashMenu(!showSlashMenu); }}>
                    <Plus size={18} className="text-[#37352f]/30" />
                    <span className="text-[14px] text-[#37352f]/30">Click to add blocks, or type &quot;/&quot; for commands</span>
                </div>
                {isCloning && (
                    <div className="absolute inset-0 bg-white/80 z-[70] flex items-center justify-center">
                        <Loader2 size={24} className="animate-spin text-[#2383e2] mr-2" />
                        <span className="text-[14px] font-medium">Cloning...</span>
                    </div>
                )}
                {showSlashMenu && (
                    <div className="absolute z-[60] bottom-full mb-2 w-[240px] bg-white border border-[#efefef] rounded-[3px] shadow-lg animate-fadeIn overflow-hidden">
                        <div onClick={() => handleAddBlock('text')}><SlashMenuItem icon={FileText} label="Text" desc="Plain writing" /></div>
                        <div onClick={() => handleAddBlock('code')}><SlashMenuItem icon={Code} label="Code Block" desc="Monospaced snippet" /></div>
                        <div onClick={() => handleClone('https://github.com/isomorphic-git/isomorphic-git.git')}><SlashMenuItem icon={GitBranch} label="Clone Repo" desc="Import public Git repo" /></div>
                        <div onClick={() => handleAddBlock('pipeline')}><SlashMenuItem icon={Terminal} label="Pipeline" desc="Interactive build step" /></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
