import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import AuthCallback from './components/AuthCallback';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import RepoPage from './pages/RepoPage';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
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
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const App = () => {
    return (
        <BrowserRouter>
            <ErrorBoundary>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />

                    {/* Protected App Routes */}
                    <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/repo/:owner/:repoName" element={<RepoPage />} />
                        <Route path="/repo/:owner/:repoName/:branchName" element={<RepoPage />} />
                        <Route path="/repo/:owner/:repoName/:branchName/*" element={<RepoPage />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </ErrorBoundary>
        </BrowserRouter>
    );
};

export default App;
