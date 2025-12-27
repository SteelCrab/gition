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

# Test environment - uses env vars if set, otherwise uses mock placeholders
# These are NOT real credentials - just satisfies the env var check in tests
TEST_ENV = {
    "MYSQL_PASSWORD": os.getenv("MYSQL_PASSWORD", "mock"),
    "ENCRYPTION_KEY": os.getenv("ENCRYPTION_KEY", "mock"),
}


@pytest.fixture
def mock_db():
    """Mock database module."""
    with patch.dict(os.environ, TEST_ENV):
        yield


@pytest.fixture
def mock_user_ops():
    """Mock user_ops with encryption disabled."""
    with patch.dict(os.environ, TEST_ENV):
        with patch("user_ops._encrypt_token", return_value=b"encrypted_token"):
            with patch("user_ops._decrypt_token", return_value="decrypted_token"):
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
             patch("database.execute", AsyncMock(return_value=1)):
            
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
        
        with patch("database.fetchone", AsyncMock(return_value=mock_user)):
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
        
        with patch("database.fetchone", AsyncMock(return_value=mock_user)):
            import user_ops
            
            result = await user_ops.get_user_by_login("testuser")
            assert result == mock_user

    @pytest.mark.asyncio
    async def test_user_not_found(self, mock_db):
        """Test user not found."""
        with patch("database.fetchone", AsyncMock(return_value=None)):
            import user_ops
            
            result = await user_ops.get_user_by_login("nonexistent")
            assert result is None


class TestGetUserByGithubId:
    """Test get_user_by_github_id function."""

    @pytest.mark.asyncio
    async def test_user_found(self, mock_db):
        """Test finding user by GitHub ID."""
        mock_user = {"id": 1, "github_id": 12345}
        
        with patch("database.fetchone", AsyncMock(return_value=mock_user)):
            import user_ops
            
            result = await user_ops.get_user_by_github_id(12345)
            assert result == mock_user


class TestGetUserIdByLogin:
    """Test get_user_id_by_login function."""

    @pytest.mark.asyncio
    async def test_returns_id(self, mock_db):
        """Test returning user ID."""
        with patch("database.fetchone", AsyncMock(return_value={"id": 42})):
            import user_ops
            
            result = await user_ops.get_user_id_by_login("testuser")
            assert result == 42

    @pytest.mark.asyncio
    async def test_returns_none(self, mock_db):
        """Test returning None when not found."""
        with patch("database.fetchone", AsyncMock(return_value=None)):
            import user_ops
            
            result = await user_ops.get_user_id_by_login("nonexistent")
            assert result is None

