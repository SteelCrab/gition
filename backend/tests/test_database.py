"""
==============================================================================
Database Module Tests (test_database.py)
==============================================================================
Tests for database connection pool management using mocked aiomysql.
==============================================================================
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestDatabasePool:
    """Test database connection pool management."""

    @pytest.fixture
    def mock_pool(self):
        """Create a mock pool."""
        pool = MagicMock()
        pool.close = MagicMock()
        pool.wait_closed = AsyncMock()
        return pool

    @pytest.mark.asyncio
    async def test_init_pool_success(self, mock_pool):
        """Test successful pool initialization."""
        with patch.dict(os.environ, {"MYSQL_PASSWORD": "test_password"}), \
             patch("aiomysql.create_pool", AsyncMock(return_value=mock_pool)):
            # Re-import to get fresh module state
            import importlib
            import database
            database._pool = None
            importlib.reload(database)
            
            result = await database.init_pool()
            assert result == mock_pool

    @pytest.mark.asyncio
    async def test_init_pool_already_initialized(self, mock_pool):
        """Test that re-initialization returns existing pool."""
        with patch.dict(os.environ, {"MYSQL_PASSWORD": "test_password"}):
            import database
            database._pool = mock_pool
            
            result = await database.init_pool()
            assert result == mock_pool

    @pytest.mark.asyncio
    async def test_close_pool(self, mock_pool):
        """Test pool closure."""
        with patch.dict(os.environ, {"MYSQL_PASSWORD": "test_password"}):
            import database
            database._pool = mock_pool
            
            await database.close_pool()
            
            mock_pool.close.assert_called_once()
            mock_pool.wait_closed.assert_called_once()
            assert database._pool is None

    @pytest.mark.asyncio
    async def test_close_pool_not_initialized(self):
        """Test closing uninitialized pool."""
        with patch.dict(os.environ, {"MYSQL_PASSWORD": "test_password"}):
            import database
            database._pool = None
            
            # Should not raise
            await database.close_pool()

    def test_get_pool_raises_when_not_initialized(self):
        """Test that get_pool raises RuntimeError when pool is None."""
        with patch.dict(os.environ, {"MYSQL_PASSWORD": "test_password"}):
            import database
            database._pool = None
            
            with pytest.raises(RuntimeError, match="not initialized"):
                database.get_pool()

    def test_get_pool_returns_pool(self, mock_pool):
        """Test that get_pool returns initialized pool."""
        with patch.dict(os.environ, {"MYSQL_PASSWORD": "test_password"}):
            import database
            database._pool = mock_pool
            
            result = database.get_pool()
            assert result == mock_pool


class TestDatabaseHelpers:
    """Test database helper functions."""

    @pytest.fixture
    def mock_cursor(self):
        """Create a mock cursor."""
        cursor = MagicMock()
        cursor.execute = AsyncMock()
        cursor.fetchone = AsyncMock(return_value={"id": 1, "name": "test"})
        cursor.fetchall = AsyncMock(return_value=[{"id": 1}, {"id": 2}])
        cursor.lastrowid = 42
        cursor.__aenter__ = AsyncMock(return_value=cursor)
        cursor.__aexit__ = AsyncMock()
        return cursor

    @pytest.fixture
    def mock_conn(self, mock_cursor):
        """Create a mock connection."""
        conn = MagicMock()
        conn.cursor = MagicMock(return_value=mock_cursor)
        conn.__aenter__ = AsyncMock(return_value=conn)
        conn.__aexit__ = AsyncMock()
        return conn

    @pytest.mark.asyncio
    async def test_fetchone(self, mock_cursor, mock_conn):
        """Test fetchone helper."""
        with patch.dict(os.environ, {"MYSQL_PASSWORD": "test_password"}):
            import database
            
            mock_pool = MagicMock()
            mock_pool.acquire = MagicMock(return_value=mock_conn)
            database._pool = mock_pool
            
            with patch.object(database, 'get_cursor') as mock_get_cursor:
                mock_get_cursor.return_value.__aenter__ = AsyncMock(return_value=mock_cursor)
                mock_get_cursor.return_value.__aexit__ = AsyncMock()
                
                result = await database.fetchone("SELECT * FROM users WHERE id = %s", (1,))
                assert result == {"id": 1, "name": "test"}

    @pytest.mark.asyncio
    async def test_fetchall(self, mock_cursor, mock_conn):
        """Test fetchall helper."""
        with patch.dict(os.environ, {"MYSQL_PASSWORD": "test_password"}):
            import database
            
            with patch.object(database, 'get_cursor') as mock_get_cursor:
                mock_get_cursor.return_value.__aenter__ = AsyncMock(return_value=mock_cursor)
                mock_get_cursor.return_value.__aexit__ = AsyncMock()
                
                result = await database.fetchall("SELECT * FROM users")
                assert result == [{"id": 1}, {"id": 2}]
