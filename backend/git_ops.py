"""
Git Operations Module

Provides clone, pull, and file access operations for GitHub repositories.
Uses GitPython for Git operations with GitHub token authentication.
"""

import os
import shutil
from pathlib import Path
from git import Repo, GitCommandError
from typing import Optional, List, Dict, Any

REPOS_BASE_PATH = os.getenv("REPOS_PATH", "/repos")


def get_repo_path(user_id: str, repo_name: str) -> Path:
    """Get the local path for a cloned repository."""
    return Path(REPOS_BASE_PATH) / str(user_id) / repo_name


def clone_repo(
    clone_url: str,
    access_token: str,
    user_id: str,
    repo_name: str
) -> Dict[str, Any]:
    """
    Clone a repository from GitHub.
    
    Args:
        clone_url: GitHub clone URL (https)
        access_token: GitHub OAuth access token
        user_id: User's GitHub ID
        repo_name: Repository name
        
    Returns:
        Dict with status, path, and message
    """
    repo_path = get_repo_path(user_id, repo_name)
    
    # If already cloned, return existing path
    if repo_path.exists() and (repo_path / ".git").exists():
        return {
            "status": "exists",
            "path": str(repo_path),
            "message": f"Repository already cloned at {repo_path}"
        }
    
    # Create parent directory if needed
    repo_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Inject token into clone URL for authentication
    # https://github.com/user/repo.git -> https://TOKEN@github.com/user/repo.git
    auth_url = clone_url.replace("https://", f"https://{access_token}@")
    
    try:
        Repo.clone_from(auth_url, repo_path)
        return {
            "status": "success",
            "path": str(repo_path),
            "message": f"Repository cloned successfully"
        }
    except GitCommandError as e:
        # Clean up partial clone
        if repo_path.exists():
            shutil.rmtree(repo_path)
        return {
            "status": "error",
            "path": None,
            "message": f"Clone failed: {str(e)}"
        }


def pull_repo(user_id: str, repo_name: str) -> Dict[str, Any]:
    """
    Pull latest changes for a cloned repository.
    
    Returns:
        Dict with status and message
    """
    repo_path = get_repo_path(user_id, repo_name)
    
    if not repo_path.exists():
        return {
            "status": "error",
            "message": "Repository not cloned"
        }
    
    try:
        repo = Repo(repo_path)
        origin = repo.remotes.origin
        origin.pull()
        return {
            "status": "success",
            "message": "Repository updated successfully"
        }
    except GitCommandError as e:
        return {
            "status": "error",
            "message": f"Pull failed: {str(e)}"
        }


def list_files(user_id: str, repo_name: str, subpath: str = "") -> Dict[str, Any]:
    """
    List files in a cloned repository.
    
    Returns:
        Dict with files list (name, type, size)
    """
    repo_path = get_repo_path(user_id, repo_name)
    target_path = repo_path / subpath if subpath else repo_path
    
    if not repo_path.exists():
        return {"status": "error", "message": "Repository not cloned", "files": []}
    
    if not target_path.exists():
        return {"status": "error", "message": "Path not found", "files": []}
    
    files = []
    try:
        for item in target_path.iterdir():
            if item.name.startswith(".git"):
                continue
            files.append({
                "name": item.name,
                "type": "directory" if item.is_dir() else "file",
                "size": item.stat().st_size if item.is_file() else None,
                "path": str(item.relative_to(repo_path))
            })
        
        # Sort: directories first, then files
        files.sort(key=lambda x: (x["type"] != "directory", x["name"].lower()))
        
        return {
            "status": "success",
            "path": subpath or "/",
            "files": files
        }
    except Exception as e:
        return {"status": "error", "message": str(e), "files": []}


def read_file(user_id: str, repo_name: str, file_path: str) -> Dict[str, Any]:
    """
    Read file content from a cloned repository.
    
    Returns:
        Dict with content and metadata
    """
    repo_path = get_repo_path(user_id, repo_name)
    target_file = repo_path / file_path
    
    if not repo_path.exists():
        return {"status": "error", "message": "Repository not cloned"}
    
    if not target_file.exists():
        return {"status": "error", "message": "File not found"}
    
    if not target_file.is_file():
        return {"status": "error", "message": "Not a file"}
    
    try:
        # Check if binary file by extension
        binary_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.tar', '.gz'}
        if target_file.suffix.lower() in binary_extensions:
            return {
                "status": "success",
                "path": file_path,
                "binary": True,
                "size": target_file.stat().st_size,
                "content": None
            }
        
        content = target_file.read_text(encoding='utf-8')
        return {
            "status": "success",
            "path": file_path,
            "binary": False,
            "size": len(content),
            "content": content
        }
    except UnicodeDecodeError:
        return {
            "status": "success",
            "path": file_path,
            "binary": True,
            "size": target_file.stat().st_size,
            "content": None
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


def is_cloned(user_id: str, repo_name: str) -> bool:
    """Check if a repository is already cloned."""
    repo_path = get_repo_path(user_id, repo_name)
    return repo_path.exists() and (repo_path / ".git").exists()


def delete_repo(user_id: str, repo_name: str) -> Dict[str, Any]:
    """Delete a cloned repository."""
    repo_path = get_repo_path(user_id, repo_name)
    
    if not repo_path.exists():
        return {"status": "error", "message": "Repository not found"}
    
    try:
        shutil.rmtree(repo_path)
        return {"status": "success", "message": "Repository deleted"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def search_files(
    user_id: str,
    repo_name: str,
    query: str,
    search_content: bool = True,
    max_results: int = 50
) -> Dict[str, Any]:
    """
    Search for files and content within a cloned repository.
    
    Args:
        user_id: User's GitHub ID
        repo_name: Repository name
        query: Search query string
        search_content: If True, search file contents; if False, search filenames only
        max_results: Maximum number of results to return
        
    Returns:
        Dict with search results
    """
    repo_path = get_repo_path(user_id, repo_name)
    
    if not repo_path.exists():
        return {"status": "error", "message": "Repository not cloned", "results": []}
    
    query_lower = query.lower()
    results = []
    
    # Binary extensions to skip for content search
    binary_extensions = {
        '.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.tar', '.gz',
        '.exe', '.dll', '.so', '.dylib', '.woff', '.woff2', '.ttf', '.eot',
        '.mp3', '.mp4', '.avi', '.mov', '.webm', '.wav'
    }
    
    try:
        for file_path in repo_path.rglob("*"):
            if len(results) >= max_results:
                break
            
            # Skip .git directory
            if ".git" in file_path.parts:
                continue
            
            # Skip directories
            if file_path.is_dir():
                continue
            
            relative_path = str(file_path.relative_to(repo_path))
            filename = file_path.name
            
            # Filename search
            if query_lower in filename.lower():
                results.append({
                    "type": "filename",
                    "path": relative_path,
                    "name": filename,
                    "match": filename,
                    "line": None,
                    "context": None
                })
                continue
            
            # Content search (skip binary files)
            if search_content and file_path.suffix.lower() not in binary_extensions:
                try:
                    content = file_path.read_text(encoding='utf-8', errors='ignore')
                    lines = content.split('\n')
                    
                    for line_num, line in enumerate(lines, 1):
                        if len(results) >= max_results:
                            break
                        
                        if query_lower in line.lower():
                            # Get context (line with match)
                            context = line.strip()
                            if len(context) > 200:
                                # Truncate long lines
                                idx = line.lower().find(query_lower)
                                start = max(0, idx - 50)
                                end = min(len(line), idx + len(query) + 50)
                                context = ("..." if start > 0 else "") + line[start:end].strip() + ("..." if end < len(line) else "")
                            
                            results.append({
                                "type": "content",
                                "path": relative_path,
                                "name": filename,
                                "match": query,
                                "line": line_num,
                                "context": context
                            })
                except (UnicodeDecodeError, PermissionError):
                    continue
        
        return {
            "status": "success",
            "query": query,
            "total": len(results),
            "results": results
        }
    except Exception as e:
        return {"status": "error", "message": str(e), "results": []}


def get_commits(
    user_id: str,
    repo_name: str,
    max_count: int = 50
) -> Dict[str, Any]:
    """
    Get commit history for a cloned repository.
    
    Args:
        user_id: User's GitHub ID
        repo_name: Repository name
        max_count: Maximum number of commits to return
        
    Returns:
        Dict with commits list
    """
    repo_path = get_repo_path(user_id, repo_name)
    
    if not repo_path.exists():
        return {"status": "error", "message": "Repository not cloned", "commits": []}
    
    try:
        repo = Repo(repo_path)
        commits = []
        
        for commit in repo.iter_commits(max_count=max_count):
            commits.append({
                "sha": commit.hexsha[:7],
                "full_sha": commit.hexsha,
                "message": commit.message.strip().split('\n')[0],  # First line only
                "author": commit.author.name,
                "author_email": commit.author.email,
                "date": commit.committed_datetime.isoformat(),
                "stats": {
                    "files": commit.stats.total.get('files', 0),
                    "insertions": commit.stats.total.get('insertions', 0),
                    "deletions": commit.stats.total.get('deletions', 0),
                }
            })
        
        return {
            "status": "success",
            "total": len(commits),
            "commits": commits
        }
    except Exception as e:
        return {"status": "error", "message": str(e), "commits": []}


def get_branches(user_id: str, repo_name: str) -> Dict[str, Any]:
    """
    Get all branches for a cloned repository.
    
    Returns:
        Dict with branches list and current branch
    """
    repo_path = get_repo_path(user_id, repo_name)
    
    if not repo_path.exists():
        return {"status": "error", "message": "Repository not cloned", "branches": []}
    
    try:
        repo = Repo(repo_path)
        branches = []
        current_branch = repo.active_branch.name if not repo.head.is_detached else None
        
        # Local branches
        for branch in repo.branches:
            branches.append({
                "name": branch.name,
                "type": "local",
                "is_current": branch.name == current_branch,
                "commit_sha": branch.commit.hexsha[:7],
                "commit_message": branch.commit.message.strip().split('\n')[0]
            })
        
        # Remote branches
        for ref in repo.remotes.origin.refs:
            # Skip HEAD reference
            if ref.name.endswith('/HEAD'):
                continue
            branch_name = ref.name.replace('origin/', '')
            # Skip if already exists as local branch
            if not any(b['name'] == branch_name for b in branches):
                branches.append({
                    "name": branch_name,
                    "type": "remote",
                    "is_current": False,
                    "commit_sha": ref.commit.hexsha[:7],
                    "commit_message": ref.commit.message.strip().split('\n')[0]
                })
        
        return {
            "status": "success",
            "current_branch": current_branch,
            "total": len(branches),
            "branches": branches
        }
    except Exception as e:
        return {"status": "error", "message": str(e), "branches": []}


def checkout_branch(user_id: str, repo_name: str, branch_name: str) -> Dict[str, Any]:
    """
    Checkout a specific branch.
    
    Args:
        user_id: User's GitHub ID
        repo_name: Repository name
        branch_name: Branch name to checkout
        
    Returns:
        Dict with status and current branch
    """
    repo_path = get_repo_path(user_id, repo_name)
    
    if not repo_path.exists():
        return {"status": "error", "message": "Repository not cloned"}
    
    try:
        repo = Repo(repo_path)
        
        # Check if branch exists locally
        if branch_name in [b.name for b in repo.branches]:
            repo.git.checkout(branch_name)
        else:
            # Try to checkout from remote
            try:
                repo.git.checkout('-b', branch_name, f'origin/{branch_name}')
            except GitCommandError:
                # Branch might already exist, try direct checkout
                repo.git.checkout(branch_name)
        
        return {
            "status": "success",
            "message": f"Switched to branch '{branch_name}'",
            "current_branch": repo.active_branch.name
        }
    except GitCommandError as e:
        return {"status": "error", "message": f"Checkout failed: {str(e)}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
