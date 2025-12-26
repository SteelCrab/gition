import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import RepoPage from './pages/RepoPage';
import MainLayout from './layouts/MainLayout';

// Error Boundary for safety
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 font-sans text-red-600">
                    <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
                    <details className="whitespace-pre-wrap font-mono text-sm p-4 bg-red-50 rounded">
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
    const [isVerifying, setIsVerifying] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const verifySession = async () => {
            try {
                // Perform server-side session validation
                const response = await fetch('/api/auth/verify', {
                    credentials: 'include',
                });

                if (response.ok) {
                    const data = await response.json();
                    setIsAuthenticated(data?.status === 'success' && data?.authenticated === true);
                } else {
                    setIsAuthenticated(false);
                    // Clear insecure local flag if server says unauthorized
                    localStorage.removeItem('isAuthenticated');
                }
            } catch (err) {
                console.error('Session verification failed');
                setIsAuthenticated(false);
            } finally {
                setIsVerifying(false);
            }
        };

        verifySession();
    }, []);

    if (isVerifying) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-6 h-6 border-2 border-[#eee] border-t-black rounded-full animate-spin" />
                    <span className="text-[13px] text-[#787774]">Verifying session...</span>
                </div>
            </div>
        );
    }

    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const App = () => {
    return (
        <BrowserRouter>
            <ErrorBoundary>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
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
};

export default App;
