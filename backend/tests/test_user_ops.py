"""
==============================================================================
User Operations Tests (test_user_ops.py)
==============================================================================
Tests for user CRUD operations with mocked database.
==============================================================================
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@pytest.fixture
def mock_db():
    """Mock database module."""
    with patch.dict(os.environ, {
        "MYSQL_PASSWORD": "test_password",
        "ENCRYPTION_KEY": "test_key_32_chars_long_for_fernet"
    }):
        yield


class TestGetOrCreateUser:
    """Test get_or_create_user function."""

    @pytest.mark.asyncio
    async def test_create_new_user(self, mock_db):
        """Test creating a new user."""
        mock_user = {
            "id": 1,
            "github_id": 12345,
            "login": "testuser",
            "name": "Test User",
            "email": "test@example.com"
        }
        
        with patch("database.fetchone", AsyncMock(side_effect=[None, mock_user])), \
             patch("database.execute", AsyncMock(return_value=1)), \
             patch.dict(os.environ, {"ENCRYPTION_KEY": "mXkSNeYPLVVfXB9QZnQwZXpYbWF2Y1Znb0pPYXNkZjE="}):
            
            # Need to reimport to get fresh state with env vars
            import user_ops
            
            # Mock the fernet encryption
            with patch.object(user_ops, '_encrypt_token', return_value=b'encrypted'):
                result = await user_ops.get_or_create_user(
                    github_id=12345,
                    login="testuser",
                    name="Test User",
                    email="test@example.com",
                    access_token="gho_test"
                )
                
                assert result["created"] is True
                assert result["user"]["login"] == "testuser"

    @pytest.mark.asyncio
    async def test_get_existing_user(self, mock_db):
        """Test getting an existing user."""
        mock_user = {
            "id": 1,
            "github_id": 12345,
            "login": "testuser"
        }
        
        with patch("database.fetchone", AsyncMock(return_value=mock_user)), \
             patch.dict(os.environ, {"ENCRYPTION_KEY": "mXkSNeYPLVVfXB9QZnQwZXpYbWF2Y1Znb0pPYXNkZjE="}):
            
            import user_ops
            
            result = await user_ops.get_or_create_user(
                github_id=12345,
                login="testuser"
            )
            
            assert result["created"] is False
            assert result["user"]["login"] == "testuser"


class TestGetUserByLogin:
    """Test get_user_by_login function."""

    @pytest.mark.asyncio
    async def test_user_found(self, mock_db):
        """Test finding user by login."""
        mock_user = {"id": 1, "login": "testuser"}
        
        with patch("database.fetchone", AsyncMock(return_value=mock_user)), \
             patch.dict(os.environ, {"ENCRYPTION_KEY": "mXkSNeYPLVVfXB9QZnQwZXpYbWF2Y1Znb0pPYXNkZjE="}):
            import user_ops
            
            result = await user_ops.get_user_by_login("testuser")
            assert result == mock_user

    @pytest.mark.asyncio
    async def test_user_not_found(self, mock_db):
        """Test user not found."""
        with patch("database.fetchone", AsyncMock(return_value=None)), \
             patch.dict(os.environ, {"ENCRYPTION_KEY": "mXkSNeYPLVVfXB9QZnQwZXpYbWF2Y1Znb0pPYXNkZjE="}):
            import user_ops
            
            result = await user_ops.get_user_by_login("nonexistent")
            assert result is None


class TestGetUserByGithubId:
    """Test get_user_by_github_id function."""

    @pytest.mark.asyncio
    async def test_user_found(self, mock_db):
        """Test finding user by GitHub ID."""
        mock_user = {"id": 1, "github_id": 12345}
        
        with patch("database.fetchone", AsyncMock(return_value=mock_user)), \
             patch.dict(os.environ, {"ENCRYPTION_KEY": "mXkSNeYPLVVfXB9QZnQwZXpYbWF2Y1Znb0pPYXNkZjE="}):
            import user_ops
            
            result = await user_ops.get_user_by_github_id(12345)
            assert result == mock_user


class TestGetUserIdByLogin:
    """Test get_user_id_by_login function."""

    @pytest.mark.asyncio
    async def test_returns_id(self, mock_db):
        """Test returning user ID."""
        with patch("database.fetchone", AsyncMock(return_value={"id": 42})), \
             patch.dict(os.environ, {"ENCRYPTION_KEY": "mXkSNeYPLVVfXB9QZnQwZXpYbWF2Y1Znb0pPYXNkZjE="}):
            import user_ops
            
            result = await user_ops.get_user_id_by_login("testuser")
            assert result == 42

    @pytest.mark.asyncio
    async def test_returns_none(self, mock_db):
        """Test returning None when not found."""
        with patch("database.fetchone", AsyncMock(return_value=None)), \
             patch.dict(os.environ, {"ENCRYPTION_KEY": "mXkSNeYPLVVfXB9QZnQwZXpYbWF2Y1Znb0pPYXNkZjE="}):
            import user_ops
            
            result = await user_ops.get_user_id_by_login("nonexistent")
            assert result is None
