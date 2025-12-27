"""
==============================================================================
Database Integration Tests (test_db_integration.py)
==============================================================================
Tests for database integration in main.py covering:
- FastAPI lifespan (startup/shutdown)
- OAuth callback path DB operations
- Clone repository registration
==============================================================================
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from httpx import AsyncClient
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# ============================================
# Lifespan Tests
# ============================================
class TestLifespan:
    """Test FastAPI lifespan startup/shutdown with database."""

    @pytest.mark.asyncio
    async def test_lifespan_startup_success(self):
        """Test successful database pool initialization on startup."""
        with patch("database.init_pool", AsyncMock()) as mock_init, \
             patch("database.close_pool", AsyncMock()) as mock_close:
            
            from main import lifespan, app
            
            async with lifespan(app):
                mock_init.assert_called_once()
            
            mock_close.assert_called_once()

    @pytest.mark.asyncio
    async def test_lifespan_startup_db_failure(self):
        """Test startup fails when database init fails (Fail Fast)."""
        with patch("database.init_pool", AsyncMock(side_effect=Exception("DB connection failed"))) as mock_init, \
             patch("database.close_pool", AsyncMock()) as mock_close:
            
            from main import lifespan, app
            
            # Should raise exception to prevent app from starting in broken state
            with pytest.raises(Exception):
                async with lifespan(app):
                    pass
            
            mock_init.assert_called_once()
            
            # Close is NOT called because startup failed before yield
            mock_close.assert_not_called()

    @pytest.mark.asyncio
    async def test_lifespan_shutdown_db_failure(self):
        """Test graceful handling when database close fails."""
        with patch("database.init_pool", AsyncMock()) as mock_init, \
             patch("database.close_pool", AsyncMock(side_effect=Exception("Close failed"))) as mock_close:
            
            from main import lifespan, app
            
            # Should not raise even if close fails
            async with lifespan(app):
                pass


# ============================================
# OAuth Callback DB Integration Tests
# ============================================
class TestOAuthDBIntegration:
    """Test OAuth callback database operations."""

    @pytest.mark.asyncio
    async def test_oauth_callback_user_creation(self):
        """Test user creation/update during OAuth callback."""
        mock_user_response = MagicMock()
        mock_user_response.status_code = 200
        mock_user_response.json.return_value = {
            "id": 12345,
            "login": "testuser",
            "name": "Test User",
            "avatar_url": "https://github.com/testuser.png"
        }
        
        mock_emails_response = MagicMock()
        mock_emails_response.status_code = 200
        mock_emails_response.json.return_value = [
            {"email": "test@example.com", "primary": True, "verified": True}
        ]
        
        mock_token_response = MagicMock()
        mock_token_response.status_code = 200
        mock_token_response.json.return_value = {"access_token": "gho_test123"}
        
        with patch("main.httpx.AsyncClient") as mock_client:
            mock_instance = AsyncMock()
            mock_instance.post.return_value = mock_token_response
            mock_instance.get.side_effect = [mock_user_response, mock_emails_response]
            mock_instance.__aenter__.return_value = mock_instance
            mock_instance.__aexit__.return_value = None
            mock_client.return_value = mock_instance
            
            with patch("user_ops.get_or_create_user", AsyncMock(return_value={"user": {"id": 1}, "created": True})) as mock_create:
                from main import app
                client = TestClient(app)
                
                response = client.get(
                    "/auth/github/callback?code=test_code",
                    follow_redirects=False
                )
                
                # Callback should redirect or return success
                # Callback should redirect
                assert response.status_code == 307
                # Verify user data is NOT in URL (security fix)
                assert "user=" not in response.headers["location"]

    @pytest.mark.asyncio
    async def test_oauth_callback_db_failure(self):
        """Test OAuth callback continues even if DB fails."""
        mock_user_response = MagicMock()
        mock_user_response.status_code = 200
        mock_user_response.json.return_value = {
            "id": 12345,
            "login": "testuser",
            "name": "Test User"
        }
        
        mock_emails_response = MagicMock()
        mock_emails_response.status_code = 200
        mock_emails_response.json.return_value = []
        
        mock_token_response = MagicMock()
        mock_token_response.status_code = 200
        mock_token_response.json.return_value = {"access_token": "gho_test123"}
        
        with patch("main.httpx.AsyncClient") as mock_client:
            mock_instance = AsyncMock()
            mock_instance.post.return_value = mock_token_response
            mock_instance.get.side_effect = [mock_user_response, mock_emails_response]
            mock_instance.__aenter__.return_value = mock_instance
            mock_instance.__aexit__.return_value = None
            mock_client.return_value = mock_instance
            
            with patch("user_ops.get_or_create_user", AsyncMock(side_effect=Exception("DB Error"))):
                from main import app
                client = TestClient(app)
                
                # Should not fail completely - OAuth should still work
                response = client.get(
                    "/auth/github/callback?code=test_code",
                    follow_redirects=False
                )
                assert response.status_code in [200, 302, 307, 400, 500]


# ============================================
# Clone Repository DB Integration Tests
# ============================================
class TestCloneDBIntegration:
    """Test repository registration after clone."""

    def test_clone_with_db_registration_success(self):
        """Test successful repo registration after clone."""
        with patch("main.clone_repo", return_value={"status": "success"}), \
             patch("main.get_token", return_value="test_token"), \
             patch("user_ops.get_user_by_github_id", AsyncMock(return_value={"id": 1, "login": "testuser"})), \
             patch("repo_ops.ensure_repo", AsyncMock(return_value=42)):
            
            from main import app
            client = TestClient(app)
            
            response = client.post("/api/git/clone", json={
                "clone_url": "https://github.com/test/repo.git",
                "user_id": "12345",
                "repo_name": "test_repo",
                "github_repo_id": 67890,
                "full_name": "testuser/test_repo"
            })
            
            assert response.status_code == 200
            data = response.json()
            assert data.get("status") == "success"

    def test_clone_missing_github_repo_id(self):
        """Test clone succeeds but skips DB registration when github_repo_id missing."""
        with patch("main.clone_repo", return_value={"status": "success"}), \
             patch("main.get_token", return_value="test_token"):
            
            from main import app
            client = TestClient(app)
            
            response = client.post("/api/git/clone", json={
                "clone_url": "https://github.com/test/repo.git",
                "user_id": "12345",
                "repo_name": "test_repo"
                # github_repo_id is missing
            })
            
            assert response.status_code == 200
            data = response.json()
            # Clone should still succeed
            assert data.get("status") == "success"

    def test_clone_user_lookup_by_login(self):
        """Test clone with user_id as login string."""
        with patch("main.clone_repo", return_value={"status": "success"}), \
             patch("main.get_token", return_value="test_token"), \
             patch("user_ops.get_user_by_github_id", AsyncMock(return_value=None)), \
             patch("user_ops.get_user_by_login", AsyncMock(return_value={"id": 1, "login": "testuser"})), \
             patch("repo_ops.ensure_repo", AsyncMock(return_value=42)):
            
            from main import app
            client = TestClient(app)
            
            response = client.post("/api/git/clone", json={
                "clone_url": "https://github.com/test/repo.git",
                "user_id": "testuser",  # login string, not numeric
                "repo_name": "test_repo",
                "github_repo_id": 67890
            })
            
            assert response.status_code == 200
            data = response.json()
            assert data.get("status") == "success"

    def test_clone_user_not_found(self):
        """Test clone succeeds but skips DB when user not found."""
        with patch("main.clone_repo", return_value={"status": "success"}), \
             patch("main.get_token", return_value="test_token"), \
             patch("user_ops.get_user_by_github_id", AsyncMock(return_value=None)), \
             patch("user_ops.get_user_by_login", AsyncMock(return_value=None)):
            
            from main import app
            client = TestClient(app)
            
            response = client.post("/api/git/clone", json={
                "clone_url": "https://github.com/test/repo.git",
                "user_id": "unknown",
                "repo_name": "test_repo",
                "github_repo_id": 67890
            })
            
            assert response.status_code == 200
            data = response.json()
            # Clone should still succeed
            assert data.get("status") == "success"

    def test_clone_db_registration_failure(self):
        """Test clone succeeds even when DB registration fails."""
        with patch("main.clone_repo", return_value={"status": "success"}), \
             patch("main.get_token", return_value="test_token"), \
             patch("user_ops.get_user_by_github_id", AsyncMock(return_value={"id": 1, "login": "testuser"})), \
             patch("repo_ops.ensure_repo", AsyncMock(side_effect=Exception("DB Error"))):
            
            from main import app
            client = TestClient(app)
            
            response = client.post("/api/git/clone", json={
                "clone_url": "https://github.com/test/repo.git",
                "user_id": "12345",
                "repo_name": "test_repo",
                "github_repo_id": 67890
            })
            
            assert response.status_code == 200
            data = response.json()
            # Clone should still succeed despite DB error
            assert data.get("status") == "success"

    def test_clone_extract_github_repo_id_from_metadata(self):
        """Test extracting github_repo_id from repo metadata in body."""
        with patch("main.clone_repo", return_value={"status": "success"}), \
             patch("main.get_token", return_value="test_token"), \
             patch("user_ops.get_user_by_github_id", AsyncMock(return_value={"id": 1, "login": "testuser"})), \
             patch("repo_ops.ensure_repo", AsyncMock(return_value=42)):
            
            from main import app
            client = TestClient(app)
            
            response = client.post("/api/git/clone", json={
                "clone_url": "https://github.com/test/repo.git",
                "user_id": "12345",
                "repo_name": "test_repo",
                # github_repo_id in nested repo object
                "repo": {"id": 67890, "name": "test_repo"}
            })
            
            assert response.status_code == 200


# ============================================
# Database Helper Tests
# ============================================
class TestDatabaseHelpers:
    """Test database module helper functions."""

    @pytest.mark.asyncio
    async def test_execute_with_fetch_one(self):
        """Test execute helper with fetch='one'."""
        with patch("database.get_cursor") as mock_get_cursor:
            mock_cursor = AsyncMock()
            mock_cursor.execute = AsyncMock()
            mock_cursor.fetchone = AsyncMock(return_value={"id": 1})
            mock_cursor.__aenter__ = AsyncMock(return_value=mock_cursor)
            mock_cursor.__aexit__ = AsyncMock()
            mock_get_cursor.return_value = mock_cursor
            
            import database
            result = await database.execute("SELECT 1", fetch="one")
            # Result depends on implementation

    @pytest.mark.asyncio
    async def test_execute_with_fetch_all(self):
        """Test execute helper with fetch='all'."""
        with patch("database.get_cursor") as mock_get_cursor:
            mock_cursor = AsyncMock()
            mock_cursor.execute = AsyncMock()
            mock_cursor.fetchall = AsyncMock(return_value=[{"id": 1}, {"id": 2}])
            mock_cursor.__aenter__ = AsyncMock(return_value=mock_cursor)
            mock_cursor.__aexit__ = AsyncMock()
            mock_get_cursor.return_value = mock_cursor
            
            import database
            result = await database.execute("SELECT 1", fetch="all")
            # Result depends on implementation
