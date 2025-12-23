import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallback = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const userDataStr = urlParams.get('user');

        if (userDataStr) {
            try {
                const userData = JSON.parse(userDataStr);

                // Store user data in localStorage
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
            // Check if there's an error from the backend
            const error = urlParams.get('error');
            if (error) {
                console.error('Auth error from backend:', error);
            }
            navigate('/login', { replace: true });
        }
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f7f6f3]">
            <div className="text-center space-y-4">
                <div className="w-12 h-12 border-4 border-[#37352f] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-[#37352f] font-medium text-[16px]">Finalizing setup...</p>
            </div>
        </div>
    );
};

export default AuthCallback;
