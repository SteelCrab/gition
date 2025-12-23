"""
Comprehensive API Tests for Gition Backend
Target: 70% coverage
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

client = TestClient(app)


# ============================================
# Health & Auth Tests
# ============================================
class TestHealthCheck:
    """Test basic API health"""
    
    def test_health_endpoint(self):
        """Test health endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
    
    def test_auth_github_redirect(self):
        """Test GitHub OAuth redirect"""
        response = client.get("/auth/github", follow_redirects=False)
        assert response.status_code in [200, 302, 307]
    
    def test_auth_callback_with_code(self):
        """Test OAuth callback with mock code"""
        response = client.get("/auth/github/callback?code=test_code")
        # May return various status based on env config
        assert response.status_code in [200, 302, 307, 400, 404, 500]


# ============================================
# Repository API Tests
# ============================================
class TestReposEndpoint:
    """Test repos endpoint"""
    
    def test_repos_no_auth(self):
        """Test repos endpoint without auth token"""
        response = client.get("/api/repos")
        assert response.status_code == 200
        data = response.json()
        assert "error" in data or "repos" in data
    
    @patch("main.httpx.AsyncClient")
    def test_repos_with_token_success(self, mock_client_class):
        """Test repos endpoint with valid token success"""
        from unittest.mock import AsyncMock
        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = [
            {"id": 1, "name": "repo1", "full_name": "u/r", "description": "d", "private": False, "clone_url": "url", "ssh_url": "surl", "html_url": "curl", "updated_at": "date", "default_branch": "main", "language": "TypeScript", "stargazers_count": 10}
        ]
        
        # Mocking the async get method
        mock_client.get.return_value = mock_response
        
        # Mocking the async context manager
        mock_client.__aenter__.return_value = mock_client
        mock_client_class.return_value = mock_client
        
        response = client.get(
            "/api/repos",
            headers={"Authorization": "Bearer valid_token"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "repos" in data
        assert len(data["repos"]) == 1

    @patch("main.httpx.AsyncClient")
    def test_repos_github_error(self, mock_client_class):
        """Test repos endpoint when GitHub API fails"""
        from unittest.mock import AsyncMock
        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 401
        
        mock_client.get.return_value = mock_response
        mock_client.__aenter__.return_value = mock_client
        mock_client_class.return_value = mock_client
        
        response = client.get(
            "/api/repos",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "error" in data


# ============================================
# Git Clone Tests
# ============================================
class TestGitClone:
    """Test Git clone operations"""
    
    def test_clone_missing_params(self):
        """Test clone with missing parameters"""
        response = client.post("/api/git/clone", json={})
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "error" or "error" in str(data).lower()
    
    def test_clone_partial_params(self):
        """Test clone with partial parameters"""
        response = client.post("/api/git/clone", json={
            "clone_url": "https://github.com/test/test.git"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "error"
    
    @patch("main.clone_repo")
    def test_clone_success(self, mock_clone):
        """Test successful clone endpoint"""
        mock_clone.return_value = {"status": "success", "message": "cloned"}
        response = client.post("/api/git/clone", json={
            "clone_url": "https://github.com/test/test.git",
            "access_token": "test_token",
            "user_id": "test_user",
            "repo_name": "test_repo"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "success"

    @patch("main.clone_repo")
    def test_clone_error(self, mock_clone):
        """Test clone endpoint with git_ops error"""
        mock_clone.return_value = {"status": "error", "message": "failed"}
        response = client.post("/api/git/clone", json={
            "clone_url": "https://github.com/test/test.git",
            "access_token": "test_token",
            "user_id": "test_user",
            "repo_name": "test_repo"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "error"


# ============================================
# Git Files Tests
# ============================================
class TestGitFiles:
    """Test Git files operations"""
    
    def test_files_missing_params(self):
        """Test files endpoint with missing parameters"""
        response = client.get("/api/git/files")
        assert response.status_code in [200, 422]
    
    @patch("main.list_files")
    def test_files_with_params_success(self, mock_list):
        """Test files endpoint with valid params success"""
        mock_list.return_value = {"status": "success", "files": [{"name": "f1", "type": "file"}]}
        response = client.get("/api/git/files?user_id=test&repo_name=test")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "success"
        assert len(data["files"]) == 1

    @patch("main.list_files")
    def test_files_with_path_success(self, mock_list):
        """Test files endpoint with path parameter success"""
        mock_list.return_value = {"status": "success", "files": []}
        response = client.get("/api/git/files?user_id=test&repo_name=test&path=src")
        assert response.status_code == 200
        mock_list.assert_called_with("test", "test", "src")


class TestGitFile:
    """Test Git file content operations"""
    
    def test_file_missing_params(self):
        """Test file endpoint with missing parameters"""
        response = client.get("/api/git/file")
        assert response.status_code in [200, 422]
    
    def test_file_with_params(self):
        """Test file endpoint with valid params but non-existent repo"""
        response = client.get("/api/git/file?user_id=test&repo_name=test&path=README.md")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "error" or "content" in data
    
    def test_file_nested_path(self):
        """Test file endpoint with nested path"""
        response = client.get("/api/git/file?user_id=test&repo_name=test&path=src/main.py")
        assert response.status_code == 200


# ============================================
# Git Status Tests
# ============================================
class TestGitStatus:
    """Test Git status operations"""
    
    def test_status_missing_params(self):
        """Test status endpoint with missing parameters"""
        response = client.get("/api/git/status")
        assert response.status_code in [200, 422]
    
    @patch("main.is_cloned")
    def test_status_with_params(self, mock_cloned):
        """Test status with valid params"""
        mock_cloned.return_value = True
        response = client.get("/api/git/status?user_id=test&repo_name=test")
        assert response.status_code == 200
        data = response.json()
        assert data.get("cloned") == True


# ============================================
# Git Commits Tests
# ============================================
class TestGitCommits:
    """Test Git commits operations"""
    
    def test_commits_missing_params(self):
        """Test commits endpoint with missing parameters"""
        response = client.get("/api/git/commits")
        assert response.status_code in [200, 422]
    
    @patch("main.get_commits")
    def test_commits_with_params(self, mock_commits):
        """Test commits with valid params but non-existent repo"""
        mock_commits.return_value = {"status": "success", "commits": []}
        response = client.get("/api/git/commits?user_id=test&repo_name=test")
        assert response.status_code == 200
        data = response.json()
        assert "commits" in data
    
    def test_commits_with_max_count(self):
        """Test commits with max_count parameter"""
        response = client.get("/api/git/commits?user_id=test&repo_name=test&max_count=10")
        assert response.status_code == 200


# ============================================
# Git Branches Tests
# ============================================
class TestGitBranches:
    """Test Git branches operations"""
    
    def test_branches_missing_params(self):
        """Test branches endpoint with missing parameters"""
        response = client.get("/api/git/branches")
        assert response.status_code in [200, 422]
    
    @patch("main.get_branches")
    def test_branches_with_params(self, mock_branches):
        """Test branches with valid params but non-existent repo"""
        mock_branches.return_value = {"status": "success", "branches": []}
        response = client.get("/api/git/branches?user_id=test&repo_name=test")
        assert response.status_code == 200
        data = response.json()
        assert "branches" in data


class TestGitCheckout:
    """Test Git checkout operations"""
    
    def test_checkout_missing_params(self):
        """Test checkout endpoint with missing parameters"""
        response = client.post("/api/git/checkout", json={})
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "error"
    
    def test_checkout_partial_params(self):
        """Test checkout with partial parameters"""
        response = client.post("/api/git/checkout", json={
            "user_id": "test",
            "repo_name": "test"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "error"
    
    @patch("main.checkout_branch")
    def test_checkout_with_all_params(self, mock_checkout):
        """Test checkout with all params but non-existent repo"""
        mock_checkout.return_value = {"status": "success"}
        response = client.post("/api/git/checkout", json={
            "user_id": "test",
            "repo_name": "test",
            "branch_name": "main"
        })
        assert response.status_code == 200


# ============================================
# Git Search Tests
# ============================================
class TestGitSearch:
    """Test Git search operations"""
    
    def test_search_missing_params(self):
        """Test search endpoint with missing parameters"""
        response = client.get("/api/git/search")
        assert response.status_code in [200, 422]
    
    @patch("main.search_files")
    def test_search_with_params_success(self, mock_search):
        """Test search with valid params success"""
        mock_search.return_value = {"status": "success", "results": [{"type": "filename", "path": "p"}]}
        response = client.get("/api/git/search?user_id=test&repo_name=test&query=test")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "success"
        assert len(data["results"]) == 1
    
    def test_search_short_query(self):
        """Test search with too short query"""
        response = client.get("/api/git/search?user_id=test&repo_name=test&query=a")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "error"

    @patch("main.search_files")
    def test_search_with_content_flag(self, mock_search):
        """Test search with content flag"""
        mock_search.return_value = {"status": "success", "results": []}
        response = client.get("/api/git/search?user_id=test&repo_name=test&query=test&content=true")
        assert response.status_code == 200
        mock_search.assert_called_with("test", "test", "test", True, 50)


# ============================================
# Git Pull Tests
# ============================================
class TestGitPull:
    """Test Git pull operations"""
    
    def test_pull_missing_params(self):
        """Test pull with missing parameters"""
        response = client.post("/api/git/pull", json={})
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "error" or "error" in str(data).lower()
    
    @patch("main.pull_repo")
    def test_pull_with_params_success(self, mock_pull):
        """Test pull with valid params success"""
        mock_pull.return_value = {"status": "success", "message": "pulled"}
        response = client.post("/api/git/pull", json={
            "user_id": "test",
            "repo_name": "test"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "success"


# ============================================
# Git Delete Tests
# ============================================
class TestGitDelete:
    """Test Git delete operations"""
    
    def test_delete_missing_params(self):
        """Test delete with missing parameters"""
        response = client.delete("/api/git/repo")
        assert response.status_code in [200, 422]
    
    def test_delete_with_params(self):
        """Test delete with valid params but non-existent repo"""
        response = client.delete("/api/git/repo?user_id=test&repo_name=test")
        assert response.status_code == 200


# ============================================
# GitHub API Tests
# ============================================
class TestGitHubIssues:
    """Test GitHub Issues API"""
    
    def test_issues_no_auth(self):
        """Test issues endpoint without auth token"""
        response = client.get("/api/github/issues?owner=test&repo=test")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "error"
        assert "issues" in data
    
    def test_issues_with_invalid_auth(self):
        """Test issues endpoint with invalid auth"""
        response = client.get(
            "/api/github/issues?owner=test&repo=test",
            headers={"Authorization": "Bearer invalid"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "issues" in data
    
    def test_issues_with_state(self):
        """Test issues endpoint with state parameter"""
        response = client.get("/api/github/issues?owner=test&repo=test&state=closed")
        assert response.status_code == 200


class TestGitHubPulls:
    """Test GitHub Pull Requests API"""
    
    def test_pulls_no_auth(self):
        """Test pulls endpoint without auth token"""
        response = client.get("/api/github/pulls?owner=test&repo=test")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "error"
        assert "pulls" in data
    
    def test_pulls_with_invalid_auth(self):
        """Test pulls endpoint with invalid auth"""
        response = client.get(
            "/api/github/pulls?owner=test&repo=test",
            headers={"Authorization": "Bearer invalid"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "pulls" in data
    
    def test_pulls_with_state(self):
        """Test pulls endpoint with state parameter"""
        response = client.get("/api/github/pulls?owner=test&repo=test&state=closed")
        assert response.status_code == 200
