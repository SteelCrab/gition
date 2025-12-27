import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import RepoPage from './pages/RepoPage';
import MainLayout from './layouts/MainLayout';

// Error Boundary for safety
import React from 'react';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="h-screen flex items-center justify-center bg-[#f7f6f3]">
                    <div className="text-center">
                        <h1 className="text-[24px] font-bold mb-2">Something went wrong</h1>
                        <button
                            onClick={() => window.location.reload()}
                            className="text-blue-500 hover:underline"
                        >
                            Reload page
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

// Protected Route Wrapper with Server-Side Verification
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const [isVerifying, setIsVerifying] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        let cancelled = false;
        let retryTimer: number | undefined;
        let attempts = 0;

        const verifySession = async () => {
            try {
                const response = await fetch('/api/auth/verify', {
                    credentials: 'include',
                });

                if (response.status === 503) {
                    attempts += 1;

                    // Bound retries + avoid updating state after unmount
                    if (attempts <= 5 && !cancelled) {
                        const delay = Math.min(1500 * attempts, 8000);
                        retryTimer = window.setTimeout(() => {
                            if (!cancelled) verifySession();
                        }, delay);
                        return; // do not flip isVerifying yet
                    }

                    if (!cancelled) {
                        setIsAuthenticated(false);
                        setIsVerifying(false);
                    }
                    return;
                }

                if (response.ok) {
                    const data = await response.json();
                    const isValid = data?.status === 'success' && data?.authenticated === true;

                    if (!cancelled) {
                        setIsAuthenticated(isValid);
                        setIsVerifying(false);
                    }

                    if (isValid && data.user) {
                        localStorage.setItem('userLogin', data.user.login);
                        localStorage.setItem('userEmail', data.user.email || `${data.user.login}@github.com`);
                    }
                    return;
                }

                if (!cancelled) {
                    setIsAuthenticated(false);
                    setIsVerifying(false);
                }
            } catch (_err) {
                if (!cancelled) {
                    console.error('Session verification failed');
                    setIsAuthenticated(false);
                    setIsVerifying(false);
                }
            }
        };

        verifySession();

        return () => {
            cancelled = true;
            if (retryTimer) window.clearTimeout(retryTimer);
        };
    }, []);

    if (isVerifying) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#f7f6f3]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-6 h-6 border-2 border-black/10 border-t-black rounded-full animate-spin" />
                    <span className="text-[13px] text-[#787774]">Verifying session...</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

function App() {
    return (
        <BrowserRouter>
            <ErrorBoundary>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />

                    {/* Protected Application Routes */}
                    <Route
                        element={
                            <ProtectedRoute>
                                <MainLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Dashboard />} />
                        <Route path="repo/:owner/:repoName" element={<RepoPage />} />
                        <Route path="repo/:owner/:repoName/:branchName" element={<RepoPage />} />
                        <Route path="repo/:owner/:repoName/:branchName/*" element={<RepoPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            </ErrorBoundary>
        </BrowserRouter>
    );
}

export default App;
