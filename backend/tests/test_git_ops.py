"""
Git Operations Tests
"""
import pytest
from unittest.mock import patch, MagicMock
from pathlib import Path
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from git_ops import (
    get_repo_path,
    is_cloned,
    list_files,
    read_file,
)


class TestGetRepoPath:
    """Test get_repo_path function"""
    
    def test_returns_path(self):
        """Test that get_repo_path returns a Path object"""
        result = get_repo_path("user123", "my-repo")
        assert isinstance(result, Path)
    
    def test_path_contains_user_and_repo(self):
        """Test path includes user_id and repo_name"""
        result = get_repo_path("user123", "my-repo")
        assert "user123" in str(result)
        assert "my-repo" in str(result)


class TestIsCloned:
    """Test is_cloned function"""
    
    def test_not_cloned_nonexistent_path(self):
        """Test returns error for non-existent repository"""
        result = is_cloned("nonexistent_user", "nonexistent_repo")
        assert result.get("cloned") == False or result.get("status") == "error"


class TestListFiles:
    """Test list_files function"""
    
    def test_error_for_missing_repo(self):
        """Test returns error for non-existent repository"""
        result = list_files("nonexistent_user", "nonexistent_repo")
        assert result.get("status") == "error"
        assert "files" in result


class TestReadFile:
    """Test read_file function"""
    
    def test_error_for_missing_repo(self):
        """Test returns error for non-existent repository"""
        result = read_file("nonexistent_user", "nonexistent_repo", "README.md")
        assert result.get("status") == "error"
