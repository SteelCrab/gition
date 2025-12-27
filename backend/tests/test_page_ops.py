"""
==============================================================================
Page Operations Tests (test_page_ops.py)
==============================================================================
Tests for branch page CRUD operations with mocked database.
==============================================================================
"""

import pytest
from unittest.mock import AsyncMock, patch
import sys
import os
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestRowToPage:
    """Test _row_to_page helper function."""

    def test_returns_none_for_none_input(self):
        """Test returning None for None input."""
        import page_ops
        
        result = page_ops._row_to_page(None)
        assert result is None

    def test_converts_datetime_to_iso(self):
        """Test datetime conversion to ISO format."""
        import page_ops
        
        now = datetime.now()
        row = {
            "id": "uuid",
            "title": "Test",
            "created_at": now,
            "updated_at": now
        }
        
        result = page_ops._row_to_page(row)
        
        assert result["created_at"] == now.isoformat()
        assert result["updated_at"] == now.isoformat()

    def test_parses_metadata_json(self):
        """Test metadata JSON parsing."""
        import page_ops
        
        row = {
            "id": "uuid",
            "metadata": '{"key": "value"}'
        }
        
        result = page_ops._row_to_page(row)
        
        assert result["metadata"] == {"key": "value"}

    def test_handles_invalid_metadata_json(self):
        """Test handling invalid metadata JSON."""
        import page_ops
        
        row = {
            "id": "uuid",
            "metadata": "invalid json"
        }
        
        result = page_ops._row_to_page(row)
        
        assert result["metadata"] == {}


class TestResolveIds:
    """Test _resolve_ids helper function."""

    @pytest.mark.asyncio
    async def test_resolves_both_ids(self):
        """Test resolving both user_id and repo_id."""
        with patch("user_ops.get_user_id_by_login", AsyncMock(return_value=1)), \
             patch("repo_ops.get_repo_id", AsyncMock(return_value=2)):
            import page_ops
            
            user_id, repo_id = await page_ops._resolve_ids("testuser", "myrepo")
            
            assert user_id == 1
            assert repo_id == 2

    @pytest.mark.asyncio
    async def test_returns_none_if_user_not_found(self):
        """Test returning None when user not found."""
        with patch("user_ops.get_user_id_by_login", AsyncMock(return_value=None)):
            import page_ops
            
            user_id, repo_id = await page_ops._resolve_ids("unknown", "myrepo")
            
            assert user_id is None
            assert repo_id is None


class TestCreateBranchPage:
    """Test create_branch_page function."""

    @pytest.mark.asyncio
    async def test_creates_new_page(self):
        """Test creating a new page."""
        mock_page = {
            "id": "uuid",
            "branch_name": "feature/test",
            "title": "Feature Test",
            "content": "# Content"
        }
        
        with patch("database.fetchone", AsyncMock(side_effect=[None, mock_page])), \
             patch("database.execute", AsyncMock(return_value=0)):
            import page_ops
            
            result = await page_ops.create_branch_page(
                user_id=1,
                repo_id=1,
                branch_name="feature/test",
                title="Feature Test",
                content="# Content"
            )
            
            assert result["status"] == "success"
            assert "page" in result

    @pytest.mark.asyncio
    async def test_returns_exists_for_existing_page(self):
        """Test returning exists status for existing page."""
        mock_page = {
            "id": "uuid",
            "branch_name": "feature/test"
        }
        
        with patch("database.fetchone", AsyncMock(return_value=mock_page)):
            import page_ops
            
            result = await page_ops.create_branch_page(
                user_id=1,
                repo_id=1,
                branch_name="feature/test"
            )
            
            assert result["status"] == "exists"


class TestGetBranchPage:
    """Test get_branch_page function."""

    @pytest.mark.asyncio
    async def test_returns_page(self):
        """Test getting existing page."""
        mock_page = {"id": "uuid", "branch_name": "main"}
        
        with patch("database.fetchone", AsyncMock(return_value=mock_page)):
            import page_ops
            
            result = await page_ops.get_branch_page(
                user_id=1,
                repo_id=1,
                branch_name="main"
            )
            
            assert result["status"] == "success"

    @pytest.mark.asyncio
    async def test_returns_not_found(self):
        """Test not found case."""
        with patch("database.fetchone", AsyncMock(return_value=None)):
            import page_ops
            
            result = await page_ops.get_branch_page(
                user_id=1,
                repo_id=1,
                branch_name="nonexistent"
            )
            
            assert result["status"] == "not_found"


class TestListBranchPages:
    """Test list_branch_pages function."""

    @pytest.mark.asyncio
    async def test_returns_pages(self):
        """Test listing pages."""
        mock_pages = [
            {"id": "1", "branch_name": "main"},
            {"id": "2", "branch_name": "dev"}
        ]
        
        with patch("database.fetchall", AsyncMock(return_value=mock_pages)):
            import page_ops
            
            result = await page_ops.list_branch_pages(user_id=1, repo_id=1)
            
            assert result["status"] == "success"
            assert result["total"] == 2


class TestDeleteBranchPage:
    """Test delete_branch_page function."""

    @pytest.mark.asyncio
    async def test_deletes_page(self):
        """Test deleting page."""
        mock_page = {"id": "uuid", "branch_name": "old-branch"}
        
        with patch("database.fetchone", AsyncMock(return_value=mock_page)), \
             patch("database.execute", AsyncMock(return_value=0)):
            import page_ops
            
            result = await page_ops.delete_branch_page(
                user_id=1,
                repo_id=1,
                branch_name="old-branch"
            )
            
            assert result["status"] == "success"

    @pytest.mark.asyncio
    async def test_returns_not_found(self):
        """Test delete not found."""
        with patch("database.fetchone", AsyncMock(return_value=None)):
            import page_ops
            
            result = await page_ops.delete_branch_page(
                user_id=1,
                repo_id=1,
                branch_name="nonexistent"
            )
            
            assert result["status"] == "not_found"
