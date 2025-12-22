import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Github, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

const LoginPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleGitHubLogin = () => {
        setIsLoading(true);
        // Use relative URL - nginx will proxy to backend
        window.location.href = '/auth/github';
    };

    return (
        <div className="min-h-screen bg-[#f7f6f3] flex flex-col items-center justify-center p-4 sm:p-6 animate-fadeIn">
            <div className="w-full max-w-[480px] bg-white p-8 sm:p-12 rounded-[16px] shadow-[0_10px_40px_rgba(0,0,0,0.06)] space-y-8 border border-[#e8e8e8]">
                {/* Logo & Header */}
                <div className="text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 bg-black rounded-[16px] flex items-center justify-center text-white font-bold text-4xl shadow-xl">
                            G
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-[32px] font-bold text-[#37352f] tracking-tight">Sign in to Gition</h1>
                        <p className="text-[#787774] text-[15px] leading-relaxed">
                            Connect your GitHub account to access<br />your workspaces and repositories.
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <button
                        onClick={handleGitHubLogin}
                        disabled={isLoading}
                        className={`
                            w-full h-14 bg-black text-white rounded-[10px] flex items-center justify-center gap-3 text-[16px] font-semibold 
                            hover:bg-[#2c2c2c] transition-all duration-200 transform active:scale-[0.98] shadow-lg
                            ${isLoading ? 'opacity-80 cursor-not-allowed' : ''}
                        `}
                    >
                        {isLoading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <>
                                <Github size={20} fill="white" />
                                Continue with GitHub
                            </>
                        )}
                    </button>

                    <div className="pt-6 text-center">
                        <p className="text-[11px] text-[#787774] font-medium uppercase tracking-[0.1em] bg-[#f7f6f3] inline-block px-4 py-1.5 rounded-full">
                            Authorized Provider Only
                        </p>
                    </div>
                </div>

                <div className="text-center text-[#9b9a97] text-[12px] leading-[1.6] max-w-[300px] mx-auto">
                    By continuing, you agree to Gition's <a href="#" className="underline hover:text-[#37352f]">Terms of Service</a> and <a href="#" className="underline hover:text-[#37352f]">Privacy Policy</a>.
                </div>
            </div>

            {/* Minimalist Footer */}
            <div className="mt-12 text-[13px] text-[#787774] flex gap-6 font-medium">
                <a href="#" className="hover:text-[#37352f] transition-colors">Documentation</a>
                <a href="#" className="hover:text-[#37352f] transition-colors">Pricing</a>
                <a href="#" className="hover:text-[#37352f] transition-colors">About</a>
            </div>
        </div>
    );
};

export default LoginPage;
