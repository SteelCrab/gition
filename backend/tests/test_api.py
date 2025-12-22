"""
API Tests for Gition Backend
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


class TestHealthCheck:
    """Test basic API health"""
    
    def test_root_redirect(self):
        """Test root redirects to GitHub OAuth"""
        response = client.get("/api/auth/github", follow_redirects=False)
        assert response.status_code in [200, 302, 307]


class TestGitOperations:
    """Test Git operation endpoints"""
    
    def test_clone_missing_params(self):
        """Test clone endpoint with missing parameters"""
        response = client.post("/api/git/clone", json={})
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "error" or "error" in str(data).lower()
    
    def test_files_missing_params(self):
        """Test files endpoint with missing parameters"""
        response = client.get("/api/git/files")
        # Should return 422 (validation error) or error response
        assert response.status_code in [200, 422]
    
    def test_file_missing_params(self):
        """Test file endpoint with missing parameters"""
        response = client.get("/api/git/file")
        assert response.status_code in [200, 422]
    
    def test_status_missing_params(self):
        """Test status endpoint with missing parameters"""
        response = client.get("/api/git/status")
        assert response.status_code in [200, 422]
    
    def test_commits_missing_params(self):
        """Test commits endpoint with missing parameters"""
        response = client.get("/api/git/commits")
        assert response.status_code in [200, 422]
    
    def test_branches_missing_params(self):
        """Test branches endpoint with missing parameters"""
        response = client.get("/api/git/branches")
        assert response.status_code in [200, 422]
    
    def test_search_missing_params(self):
        """Test search endpoint with missing parameters"""
        response = client.get("/api/git/search")
        assert response.status_code in [200, 422]
    
    def test_checkout_missing_params(self):
        """Test checkout endpoint with missing parameters"""
        response = client.post("/api/git/checkout", json={})
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "error"


class TestGitHubAPI:
    """Test GitHub API endpoints"""
    
    def test_issues_no_auth(self):
        """Test issues endpoint without auth token"""
        response = client.get("/api/github/issues?owner=test&repo=test")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "error"
        assert "issues" in data
    
    def test_pulls_no_auth(self):
        """Test pulls endpoint without auth token"""
        response = client.get("/api/github/pulls?owner=test&repo=test")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "error"
        assert "pulls" in data


class TestReposEndpoint:
    """Test repos endpoint"""
    
    def test_repos_no_auth(self):
        """Test repos endpoint without auth token"""
        response = client.get("/api/repos")
        assert response.status_code == 200
        data = response.json()
        # Should return error or empty repos without token
        assert "error" in data or "repos" in data
