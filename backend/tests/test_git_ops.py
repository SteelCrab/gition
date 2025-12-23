"""
Git Operations Tests
"""
import pytest
from unittest.mock import patch, MagicMock, mock_open
from pathlib import Path
import sys
import os
import shutil

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from git_ops import (
    get_repo_path,
    clone_repo,
    pull_repo,
    list_files,
    read_file,
    is_cloned,
    delete_repo,
    search_files,
    get_commits,
    get_branches,
    checkout_branch
)


class TestGetRepoPath:
    """Test get_repo_path function"""
    
    @patch("git_ops.REPOS_BASE_PATH", "/tmp/repos")
    def test_returns_path(self):
        """Test that get_repo_path returns a Path object"""
        result = get_repo_path("user123", "my-repo")
        assert isinstance(result, Path)
    
    @patch("git_ops.REPOS_BASE_PATH", "/tmp/repos")
    def test_path_contains_user_and_repo(self):
        """Test path includes user_id and repo_name"""
        result = get_repo_path("user123", "my-repo")
        assert "user123" in str(result)
        assert "my-repo" in str(result)


class TestCloneRepo:
    """Test clone_repo function"""

    @patch("git_ops.Path.exists")
    def test_already_cloned(self, mock_exists):
        """Test returns exists status if already cloned"""
        mock_exists.side_effect = lambda: True
        # Mock (repo_path / ".git").exists()
        with patch("git_ops.Path.__truediv__") as mock_div:
            mock_dot_git = MagicMock()
            mock_dot_git.exists.return_value = True
            mock_div.return_value = mock_dot_git
            
            result = clone_repo("https://github.com/u/r", "token", "user", "repo")
            assert result["status"] == "exists"

    @patch("git_ops.Repo.clone_from")
    @patch("git_ops.Path.mkdir")
    @patch("git_ops.Path.exists")
    def test_successful_clone(self, mock_exists, mock_mkdir, mock_clone):
        """Test successful repository clone"""
        mock_exists.return_value = False
        
        result = clone_repo("https://github.com/u/r", "token", "user", "repo")
        assert result["status"] == "success"
        mock_clone.assert_called_once()
        # Verify token injection
        assert "https://token@github.com/u/r" in mock_clone.call_args[0][0]

    @patch("git_ops.Repo.clone_from")
    @patch("git_ops.shutil.rmtree")
    @patch("git_ops.Path.mkdir")
    @patch("git_ops.Path.exists")
    def test_clone_failure_cleanup(self, mock_exists, mock_mkdir, mock_rmtree, mock_clone):
        """Test cleanup after failed clone"""
        mock_exists.side_effect = [False, True] # Not exists initially, exists for cleanup
        from git import GitCommandError
        mock_clone.side_effect = GitCommandError("clone", "failed")
        
        with patch("git_ops.REPOS_BASE_PATH", "/tmp/repos"):
            result = clone_repo("https://github.com/u/r", "token", "user", "repo")
            assert result["status"] == "error"
            mock_rmtree.assert_called_once()


class TestPullRepo:
    """Test pull_repo function"""

    @patch("git_ops.Path.exists")
    def test_error_not_cloned(self, mock_exists):
        mock_exists.return_value = False
        result = pull_repo("user", "repo")
        assert result["status"] == "error"

    @patch("git_ops.Repo")
    @patch("git_ops.Path.exists")
    def test_successful_pull(self, mock_exists, mock_repo_class):
        mock_exists.return_value = True
        mock_repo = MagicMock()
        mock_repo_class.return_value = mock_repo
        
        result = pull_repo("user", "repo")
        assert result["status"] == "success"
        mock_repo.remotes.origin.pull.assert_called_once()


class TestListFiles:
    """Test list_files function"""
    
    @patch("git_ops.Path.exists")
    def test_error_for_missing_repo(self, mock_exists):
        mock_exists.return_value = False
        result = list_files("nonexistent_user", "nonexistent_repo")
        assert result["status"] == "error"
    
    @patch("git_ops.Path.exists")
    @patch("git_ops.Path.iterdir")
    def test_list_success(self, mock_iterdir, mock_exists):
        mock_exists.return_value = True
        
        # Mock directory entries
        file1 = MagicMock(spec=Path)
        file1.name = "file1.txt"
        file1.is_dir.return_value = False
        file1.is_file.return_value = True
        file1.stat().st_size = 100
        file1.relative_to.return_value = "file1.txt"
        
        dir1 = MagicMock(spec=Path)
        dir1.name = "dir1"
        dir1.is_dir.return_value = True
        dir1.is_file.return_value = False
        dir1.relative_to.return_value = "dir1"
        
        mock_iterdir.return_value = [file1, dir1]
        
        result = list_files("user", "repo")
        assert result["status"] == "success"
        assert len(result["files"]) == 2
        assert result["files"][0]["type"] == "directory" # Sorted


class TestReadFile:
    """Test read_file function"""
    
    @patch("git_ops.Path.exists")
    def test_error_for_missing_repo(self, mock_exists):
        mock_exists.return_value = False
        result = read_file("user", "repo", "file.txt")
        assert result["status"] == "error"

    @patch("git_ops.Path.read_text")
    @patch("git_ops.Path.is_file")
    @patch("git_ops.Path.exists")
    def test_read_text_success(self, mock_exists, mock_is_file, mock_read_text):
        mock_exists.return_value = True
        mock_is_file.return_value = True
        mock_read_text.return_value = "hello world"
        
        # Mock suffix for binary check
        with patch("git_ops.Path.suffix", ".txt"):
            result = read_file("user", "repo", "file.txt")
            assert result["status"] == "success"
            assert result["content"] == "hello world"
            assert result["binary"] == False

    @patch("git_ops.Path.is_file")
    @patch("git_ops.Path.exists")
    def test_read_binary_by_extension(self, mock_exists, mock_is_file):
        mock_exists.return_value = True
        mock_is_file.return_value = True
        
        with patch("git_ops.Path.suffix", ".png"):
            with patch("git_ops.Path.stat") as mock_stat:
                mock_stat().st_size = 1024
                result = read_file("user", "repo", "image.png")
                assert result["status"] == "success"
                assert result["binary"] == True
                assert result["content"] is None


class TestDeleteRepo:
    """Test delete_repo function"""
    
    @patch("git_ops.shutil.rmtree")
    @patch("git_ops.Path.exists")
    def test_delete_success(self, mock_exists, mock_rmtree):
        mock_exists.return_value = True
        result = delete_repo("user", "repo")
        assert result["status"] == "success"
        mock_rmtree.assert_called_once()

    @patch("git_ops.Path.exists")
    def test_delete_missing(self, mock_exists):
        mock_exists.return_value = False
        result = delete_repo("user", "repo")
        assert result["status"] == "error"


class TestSearchFiles:
    """Test search_files function"""

    @patch("git_ops.Path.rglob")
    @patch("git_ops.Path.exists")
    def test_search_filename_match(self, mock_exists, mock_rglob):
        mock_exists.return_value = True
        
        file1 = MagicMock(spec=Path)
        file1.name = "match_file.txt"
        file1.is_dir.return_value = False
        file1.parts = ["match_file.txt"]
        file1.relative_to.return_value = Path("match_file.txt")
        mock_rglob.return_value = [file1]
        
        result = search_files("user", "repo", "match")
        assert result["status"] == "success"
        assert len(result["results"]) == 1
        assert result["results"][0]["type"] == "filename"


class TestGetCommits:
    """Test get_commits function"""

    @patch("git_ops.Repo")
    @patch("git_ops.Path.exists")
    def test_get_commits_success(self, mock_exists, mock_repo_class):
        mock_exists.return_value = True
        mock_repo = MagicMock()
        mock_commit = MagicMock()
        mock_commit.hexsha = "1234567890"
        mock_commit.message = "Initial commit"
        mock_commit.author.name = "Author"
        mock_commit.author.email = "author@example.com"
        mock_commit.committed_datetime.isoformat.return_value = "2023-01-01T00:00:00"
        mock_commit.stats.total = {'files': 1, 'insertions': 1, 'deletions': 0}
        
        mock_repo.iter_commits.return_value = [mock_commit]
        mock_repo_class.return_value = mock_repo
        
        result = get_commits("user", "repo")
        assert result["status"] == "success"
        assert len(result["commits"]) == 1
        assert result["commits"][0]["sha"] == "1234567"


class TestGetBranches:
    """Test get_branches function"""

    @patch("git_ops.Repo")
    @patch("git_ops.Path.exists")
    def test_get_branches_success(self, mock_exists, mock_repo_class):
        mock_exists.return_value = True
        mock_repo = MagicMock()
        
        # Mock local branch
        local_branch = MagicMock()
        local_branch.name = "main"
        local_branch.commit.hexsha = "123"
        local_branch.commit.message = "msg"
        mock_repo.branches = [local_branch]
        mock_repo.active_branch.name = "main"
        mock_repo.head.is_detached = False
        
        # Mock remote branch
        remote = MagicMock()
        remote.name = "origin"
        ref = MagicMock()
        ref.name = "origin/feature"
        ref.commit.hexsha = "456"
        ref.commit.message = "msg2"
        remote.refs = [ref]
        mock_repo.remotes = [remote]
        
        mock_repo_class.return_value = mock_repo
        
        result = get_branches("user", "repo")
        assert result["status"] == "success"
        # 1 local + 1 remote
        assert len(result["branches"]) == 2


class TestCheckoutBranch:
    """Test checkout_branch function"""

    @patch("git_ops.Repo")
    @patch("git_ops.Path.exists")
    def test_checkout_existing_local(self, mock_exists, mock_repo_class):
        mock_exists.return_value = True
        mock_repo = MagicMock()
        mock_branch = MagicMock()
        mock_branch.name = "feature"
        mock_repo.branches = [mock_branch]
        mock_repo.active_branch.name = "feature"
        mock_repo_class.return_value = mock_repo
        
        result = checkout_branch("user", "repo", "feature")
        assert result["status"] == "success"
        mock_repo.git.checkout.assert_called_with("feature")
