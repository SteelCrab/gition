/**
 * =============================================================================
 * LoginPage Component
 * =============================================================================
 * 
 * Description: GitHub OAuth login page
 * 
 * Features:
 *   - Gition logo and branding
 *   - "Continue with GitHub" button
 *   - Loading state during redirect
 * 
 * Flow:
 *   1. User clicks login button
 *   2. Redirect to /auth/github (backend)
 *   3. Backend redirects to GitHub OAuth
 *   4. After auth, redirects to AuthCallback
 * 
 * State:
 *   - loading: Redirect in progress
 * =============================================================================
 */

import { useState } from 'react';
import { Github, Loader2 } from 'lucide-react';

const LoginPage = () => {
    // Loading state (shown during redirect)
    const [loading, setLoading] = useState(false);

    /**
     * GitHub login handler
     * - Sets loading state
     * - Redirects to backend OAuth endpoint
     */
    const handleGitHubLogin = () => {
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

                {/* Title and tagline */}
                <div className="space-y-2">
                    <h1 className="text-5xl font-bold text-[#37352f]">Gition</h1>
                    <p className="text-[#9b9a97] text-lg">
                        Your workspace for code &amp; docs
                    </p>
                </div>

                {/* GitHub Login Button */}
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
