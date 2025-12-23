import { useState } from 'react';
import { Github, Loader2 } from 'lucide-react';

const LoginPage = () => {
    const [loading, setLoading] = useState(false);

    const handleGitHubLogin = () => {
        console.log('GitHub login button clicked, redirecting to /auth/github...');
        setLoading(true);
        window.location.href = '/auth/github';
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="text-center space-y-8">
                {/* Logo */}
                <div className="flex justify-center">
                    <div className="w-24 h-24 bg-[#37352f] rounded-[6px] flex items-center justify-center text-white font-serif text-6xl">
                        G
                    </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                    <h1 className="text-5xl font-bold text-[#37352f]">Gition</h1>
                    <p className="text-[#9b9a97] text-lg">
                        Your workspace for code &amp; docs
                    </p>
                </div>

                {/* Login Button */}
                <button
                    onClick={handleGitHubLogin}
                    disabled={loading}
                    className={`
                        inline-flex items-center gap-3 px-8 py-4 bg-[#37352f] text-white rounded-md text-lg font-medium
                        hover:bg-[#2f2e2b] transition-colors
                        ${loading ? 'opacity-70 cursor-not-allowed' : ''}
                    `}
                >
                    {loading ? (
                        <Loader2 size={22} className="animate-spin" />
                    ) : (
                        <>
                            <Github size={22} />
                            Continue with GitHub
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default LoginPage;
