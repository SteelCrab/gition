"""
==============================================================================
Repository Operations Tests (test_repo_ops.py)
==============================================================================
Tests for repository CRUD operations with mocked database.
==============================================================================
"""

import pytest
from unittest.mock import AsyncMock, patch
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestSyncUserRepos:
    """Test sync_user_repos function."""

    @pytest.mark.asyncio
    async def test_sync_repos_success(self):
        """Test syncing multiple repos."""
        repos = [
            {"id": 1, "name": "repo1", "full_name": "user/repo1"},
            {"id": 2, "name": "repo2", "full_name": "user/repo2"},
        ]
        
        with patch("database.execute", AsyncMock(return_value=1)):
            import repo_ops
            
            result = await repo_ops.sync_user_repos(user_id=1, repos=repos)
            
            assert result["status"] == "success"
            assert result["synced"] == 2

    @pytest.mark.asyncio
    async def test_sync_empty_list(self):
        """Test syncing empty repo list."""
        import repo_ops
        
        result = await repo_ops.sync_user_repos(user_id=1, repos=[])
        
        assert result["status"] == "success"
        assert result["synced"] == 0


class TestGetRepoByName:
    """Test get_repo_by_name function."""

    @pytest.mark.asyncio
    async def test_repo_found(self):
        """Test finding repo by name."""
        mock_repo = {"id": 1, "name": "myrepo", "full_name": "user/myrepo"}
        
        with patch("database.fetchone", AsyncMock(return_value=mock_repo)):
            import repo_ops
            
            result = await repo_ops.get_repo_by_name(user_id=1, repo_name="myrepo")
            assert result == mock_repo

    @pytest.mark.asyncio
    async def test_repo_not_found(self):
        """Test repo not found."""
        with patch("database.fetchone", AsyncMock(return_value=None)):
            import repo_ops
            
            result = await repo_ops.get_repo_by_name(user_id=1, repo_name="notexist")
            assert result is None


class TestGetRepoId:
    """Test get_repo_id function."""

    @pytest.mark.asyncio
    async def test_returns_id(self):
        """Test returning repo ID."""
        with patch("database.fetchone", AsyncMock(return_value={"id": 42})):
            import repo_ops
            
            result = await repo_ops.get_repo_id(user_id=1, repo_name="myrepo")
            assert result == 42

    @pytest.mark.asyncio
    async def test_returns_none(self):
        """Test returning None when not found."""
        with patch("database.fetchone", AsyncMock(return_value=None)):
            import repo_ops
            
            result = await repo_ops.get_repo_id(user_id=1, repo_name="notexist")
            assert result is None


class TestGetUserRepos:
    """Test get_user_repos function."""

    @pytest.mark.asyncio
    async def test_returns_repos(self):
        """Test returning user repos."""
        mock_repos = [
            {"id": 1, "name": "repo1"},
            {"id": 2, "name": "repo2"},
        ]
        
        with patch("database.fetchall", AsyncMock(return_value=mock_repos)):
            import repo_ops
            
            result = await repo_ops.get_user_repos(user_id=1)
            assert result == mock_repos


class TestEnsureRepo:
    """Test ensure_repo function."""

    @pytest.mark.asyncio
    async def test_creates_new_repo(self):
        """Test creating new repo via INSERT ON DUPLICATE KEY."""
        with patch("database.execute", AsyncMock(return_value=1)), \
             patch("database.fetchone", AsyncMock(return_value={"id": 42})):
            import repo_ops
            
            result = await repo_ops.ensure_repo(
                user_id=1,
                github_repo_id=12345,
                name="newrepo",
                full_name="user/newrepo"
            )
            
            assert result == 42

    @pytest.mark.asyncio
    async def test_updates_existing_repo(self):
        """Test updating existing repo via INSERT ON DUPLICATE KEY."""
        with patch("database.execute", AsyncMock(return_value=0)), \
             patch("database.fetchone", AsyncMock(return_value={"id": 99})):
            import repo_ops
            
            result = await repo_ops.ensure_repo(
                user_id=1,
                github_repo_id=12345,
                name="existingrepo",
                full_name="user/existingrepo"
            )
            
            assert result == 99
