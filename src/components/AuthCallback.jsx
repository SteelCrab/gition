import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallback = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
            // In a real app, you'd exchange this code for a token on the backend
            // For this demo, we'll simulate a successful login
            setTimeout(() => {
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('userEmail', 'collab@gition.com');
                localStorage.setItem('userLogin', 'github-collaborator');
                localStorage.setItem('githubToken', 'gh_mock_token_12345');
                navigate('/');
            }, 1000);
        } else {
            navigate('/login');
        }
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f7f6f3]">
            <div className="text-center space-y-4">
                <div className="w-12 h-12 border-4 border-[#37352f] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-[#37352f] font-medium">Authenticating with GitHub...</p>
            </div>
        </div>
    );
};

export default AuthCallback;
