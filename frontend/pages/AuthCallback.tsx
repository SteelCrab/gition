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
        // Extract user info from URL
        const urlParams = new URLSearchParams(window.location.search);
        const userDataStr = urlParams.get('user');

        if (userDataStr) {
            try {
                // Parse JSON
                const userData = JSON.parse(userDataStr);

                // Store user info in localStorage
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('userEmail', userData.email);
                localStorage.setItem('userLogin', userData.login);
                localStorage.setItem('userName', userData.name);
                localStorage.setItem('userId', userData.id);
                localStorage.setItem('userAvatar', userData.avatar_url);
                localStorage.setItem('githubToken', userData.access_token);

                // Redirect to dashboard
                navigate('/', { replace: true });
            } catch (error) {
                console.error('Failed to parse user data:', error);
                navigate('/login', { replace: true });
            }
        } else {
            // No user parameter (error case)
            const error = urlParams.get('error');
            if (error) {
                console.error('Auth error from backend:', error);
            }
            navigate('/login', { replace: true });
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
