import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('processing');
    const [message, setMessage] = useState('Completing authentication...');

    useEffect(() => {
        const userData = searchParams.get('user');
        const error = searchParams.get('error');

        if (error) {
            setStatus('error');
            setMessage('Authentication failed. Please try again.');
            setTimeout(() => navigate('/login'), 2000);
            return;
        }

        if (userData) {
            try {
                const user = JSON.parse(decodeURIComponent(userData));

                // Store user data
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('userEmail', user.email);
                localStorage.setItem('userName', user.name);
                localStorage.setItem('userLogin', user.login);
                localStorage.setItem('userAvatar', user.avatar_url);
                localStorage.setItem('githubToken', user.access_token);

                setStatus('success');
                setMessage(`Welcome, ${user.name || user.login}!`);

                setTimeout(() => navigate('/'), 1000);
            } catch (e) {
                setStatus('error');
                setMessage('Failed to process authentication data.');
                setTimeout(() => navigate('/login'), 2000);
            }
        } else {
            setStatus('error');
            setMessage('No authentication data received.');
            setTimeout(() => navigate('/login'), 2000);
        }
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-[#f7f6f3] flex flex-col items-center justify-center p-6">
            <div className="bg-white p-12 rounded-[16px] shadow-lg border border-[#e8e8e8] text-center space-y-6">
                {status === 'processing' && (
                    <Loader2 size={48} className="animate-spin mx-auto text-[#37352f]" />
                )}
                {status === 'success' && (
                    <CheckCircle size={48} className="mx-auto text-green-500" />
                )}
                {status === 'error' && (
                    <XCircle size={48} className="mx-auto text-red-500" />
                )}
                <p className="text-[18px] font-medium text-[#37352f]">{message}</p>
            </div>
        </div>
    );
};

export default AuthCallback;
