/**
 * =============================================================================
 * AuthCallback Component
 * =============================================================================
 * 
 * Description: Handles GitHub OAuth authentication callback
 * 
 * Flow:
 *   1. Extract user info from URL parameters
 *   2. Parse JSON and store in localStorage
 *   3. Redirect to dashboard (/)
 * 
 * Stored Data (localStorage):
 *   - isAuthenticated: Authentication status
 *   - userEmail: User email
 *   - userLogin: GitHub login ID
 *   - userName: Display name
 *   - userId: GitHub user ID
 *   - userAvatar: Profile image URL
 *   - githubToken: Access token for API calls
 * 
 * Error Handling:
 *   - Redirect to login page on JSON parse failure
 *   - Redirect to login page if user parameter is missing
 * =============================================================================
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallback = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const verifyAuth = async () => {
            try {
                // Determine API base URL
                const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';

                // Call verification endpoint (cookie is sent automatically)
                const response = await fetch(`${apiBase}/api/auth/verify`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                    },
                    credentials: 'include' // Important: send cookies
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.status === 'success' && data.user) {
                        // Store user info in localStorage
                        localStorage.setItem('isAuthenticated', 'true');
                        localStorage.setItem('userLogin', data.user.login);
                        localStorage.setItem('userName', data.user.name || data.user.login);
                        localStorage.setItem('userId', String(data.user.id));

                        // Redirect to dashboard
                        navigate('/', { replace: true });
                        return;
                    }
                }

                // If verification failed
                console.error('Auth verification failed');
                navigate('/login?error=auth_failed', { replace: true });

            } catch (error) {
                console.error('Auth verification error:', error);
                navigate('/login?error=network_error', { replace: true });
            }
        };

        // Check for error param from backend redirect
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');

        if (error) {
            console.error('Auth error from backend:', error);
            navigate('/login', { replace: true });
        } else {
            // Attempt verification
            verifyAuth();
        }
    }, [navigate]);

    // Show loading spinner
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f7f6f3]">
            <div className="text-center space-y-4">
                {/* Loading spinner */}
                <div className="w-12 h-12 border-4 border-[#37352f] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-[#37352f] font-medium text-[16px]">Finalizing setup...</p>
            </div>
        </div>
    );
};

export default AuthCallback;
