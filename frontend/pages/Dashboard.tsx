import { useState } from 'react';
import { FileText, Code, GitBranch, Terminal, Plus, Loader2 } from 'lucide-react';
import CodeBlock from '../components/CodeBlock';
import SlashMenuItem from '../components/SlashMenuItem';
import TextBlock from '../components/TextBlock';
import PipelineBlock from '../components/PipelineBlock';
import { cloneRepo, listFiles, readFile } from '../lib/git';
// Ensure imports for Block interface if exported, or redefine.
// Defining Block interface here for now.

interface Block {
    id: string;
    type: 'text' | 'code' | 'pipeline';
    content?: string;
    language?: string;
    filename?: string;
    label?: string;
}

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

    const handleClone = async (url: string) => {
        setIsCloning(true);
        try {
            await cloneRepo(url);
            const files = await listFiles();
            // In Dashboard, cloning might just be a demo action, or should it redirect?
            // The original logic just updated blocks with README content.
            if (files.includes('README.md')) {
                const content = await readFile('README.md');
                setBlocks([
                    { id: 'readme-header', type: 'text', content: '# Imported from Repository' },
                    { id: 'readme-content', type: 'text', content: content }
                ]);
            }
        } catch (_err) {
            console.error('Clone failed:', _err);
        } finally {
            setIsCloning(false);
        }
    };

    return (
        <div className="max-w-[800px] mx-auto px-12 sm:px-24 py-16" onClick={() => setShowSlashMenu(false)}>
            <h1 className="text-[40px] font-bold text-[#37352f] mb-2" contentEditable suppressContentEditableWarning>Gition</h1>
            <p className="text-[18px] text-[#787774] mb-8 font-medium">Developer's All-in-One Collaboration Platform</p>

            <div className="space-y-1">
{blocks.map(block => {
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
})}
            </div>

            <div className="mt-12 relative group">
                <div className="flex items-center gap-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); setShowSlashMenu(!showSlashMenu); }}>
                    <Plus size={18} className="text-[#37352f]/30" />
                    <span className="text-[14px] text-[#37352f]/30">Click to add blocks, or type "/" for commands</span>
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
