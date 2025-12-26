"""
==============================================================================
Git Operations Module (git_ops.py)
==============================================================================
Description: Git operation handlers for GitHub repositories

Main Features:
    - clone_repo: Clone repository (with token authentication)
    - pull_repo: Pull latest changes
    - list_files: List files/directories
    - read_file: Read file content
    - search_files: Search filenames/content
    - get_commits: Get commit history
    - get_branches: Get branch list
    - checkout_branch: Switch branches

Dependencies:
    - GitPython: Python library for Git operations
    
Repository Path Structure:
    /repos/{user_id}/{repo_name}/
    
Environment Variables:
    - REPOS_PATH: Repository base path (default: /repos)
==============================================================================
"""

import os
import shutil
import logging
from pathlib import Path
from git import Repo, GitCommandError
from typing import Dict, Any, Union

# Configure logging
logger = logging.getLogger(__name__)

# Base path for cloned repositories
REPOS_BASE_PATH = os.getenv("REPOS_PATH", "/repos")

# Standard binary extensions to skip/detect
BINARY_EXTENSIONS = {
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.tar', '.gz',
    '.exe', '.dll', '.so', '.dylib', '.woff', '.woff2', '.ttf', '.eot',
    '.mp3', '.mp4', '.avi', '.mov', '.webm', '.wav', '.pyc', '.o', '.a'
}


def get_repo_path(user_id: str, repo_name: str) -> Path:
    """
    Get local path for a repository with path traversal protection
    """
    if not user_id or not repo_name:
        raise ValueError("Invalid user_id or repo_name")

    # Sanitize: Reject path separators in components
    if any(sep in str(user_id) for sep in ('/', '\\', '..')):
        raise ValueError(f"Invalid user_id: {user_id}")
    if any(sep in repo_name for sep in ('/', '\\', '..')):
        raise ValueError(f"Invalid repo_name: {repo_name}")

    base_path = Path(REPOS_BASE_PATH).resolve()
    repo_path = (base_path / str(user_id) / repo_name).resolve()

    # Verify path is still within REPOS_BASE_PATH
    try:
        if not repo_path.is_relative_to(base_path):
            raise ValueError("Path traversal detected")
    except ValueError:
        raise ValueError("Path traversal detected")

    return repo_path


# ==============================================================================
# Repository Clone/Pull
# ==============================================================================

def clone_repo(
    clone_url: str,
    access_token: str,
    user_id: str,
    repo_name: str
) -> Dict[str, Any]:
    """
    Clone a GitHub repository to local storage
    
    Authentication Method:
        - Inject token into HTTPS URL for authentication
        - Format: https://TOKEN@github.com/user/repo.git
    
    Args:
        clone_url: GitHub HTTPS clone URL
        access_token: GitHub OAuth access token
        user_id: User's GitHub ID (for path separation)
        repo_name: Repository name
        
    Returns:
        Dict:
            - status: "success" | "exists" | "error"
            - path: Cloned path (on success)
            - message: Status message
            - branches_created: Number of local branches created (on success)
    """
    repo_path = get_repo_path(user_id, repo_name)
    
    # Return existing path if already cloned
    if repo_path.exists() and (repo_path / ".git").exists():
        return {
            "status": "exists",
            "path": str(repo_path),
            "message": f"Repository already cloned at {repo_path}"
        }
    
    # Create parent directory if needed
    repo_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Inject token into clone URL (for private repo access)
    # https://github.com/... → https://TOKEN@github.com/...
    auth_url = clone_url.replace("https://", f"https://{access_token}@")
    
    try:
        Repo.clone_from(auth_url, repo_path)
        
        # Create local branches for all remote branches
        # Skip fetch since we just cloned - all refs are up-to-date
        branches_created = create_local_branches_from_remotes(repo_path, skip_fetch=True)
        logger.info(f"Created {branches_created} local branches from remotes")
        
        return {
            "status": "success",
            "path": str(repo_path),
            "message": f"Repository cloned successfully ({branches_created} branches created)",
            "branches_created": branches_created
        }
    except GitCommandError as e:
        # Clean up partial clone on failure
        if repo_path.exists():
            shutil.rmtree(repo_path)
            
        # Sanitize error message to prevent token leakage
        error_msg = str(e).replace(access_token, "***") if access_token else str(e)
        return {
            "status": "error",
            "path": None,
            "message": f"Clone failed: {error_msg}"
        }


def reclone_repo(
    clone_url: str,
    access_token: str,
    user_id: str,
    repo_name: str
) -> Dict[str, Any]:
    """
    Delete existing repository and clone fresh.
    
    Useful when clone is corrupted or needs to be reset.
    
    Args:
        clone_url: GitHub HTTPS clone URL
        access_token: GitHub OAuth access token
        user_id: User's GitHub ID
        repo_name: Repository name
        
    Returns:
        Dict:
            - status: "success" | "error"
            - path: Cloned path (on success)
            - message: Status message
            - branches_created: Number of local branches created (on success)
    """
    repo_path = get_repo_path(user_id, repo_name)
    
    # Delete existing repository if it exists
    if repo_path.exists():
        try:
            shutil.rmtree(repo_path)
            logger.info(f"Deleted existing repository at {repo_path}")
        except OSError as e:
            logger.error(f"Failed to delete repository at {repo_path}: {e}")
            return {
                "status": "error",
                "path": None,
                "message": f"Failed to delete existing repository: {str(e)}"
            }
    
    # Clone fresh
    result = clone_repo(clone_url, access_token, user_id, repo_name)
    
    # Update message to indicate reclone
    if result["status"] == "success":
        result["message"] = f"Repository re-cloned successfully ({result.get('branches_created', 0)} branches created)"
    
    return result


def create_local_branches_from_remotes(
    repo_path: Union[str, Path],
    skip_fetch: bool = False
) -> int:
    """
    Create local tracking branches for all remote branches.
    
    Args:
        repo_path: Path to the repository
        skip_fetch: If True, skip fetching remote refs (useful after fresh clone)
        
    Returns:
        int: Number of local branches created
    """
    try:
        repo = Repo(repo_path)
        created_count = 0
        
        # Get existing local branch names
        local_branch_names = {branch.name for branch in repo.branches}
        
        # Iterate over remote refs (fetch only if not skipped)
        for remote in repo.remotes:
            if not skip_fetch:
                try:
                    remote.fetch()
                except GitCommandError as fetch_err:
                    logger.warning(f"Fetch failed for remote {remote.name}: {fetch_err}")
                    # Continue with cached refs
                
            for ref in remote.refs:
                # Skip HEAD reference
                if ref.name.endswith('/HEAD'):
                    continue
                    
                # Extract branch name (remove remote prefix like 'origin/')
                branch_name = ref.name.split('/', 1)[1] if '/' in ref.name else ref.name
                
                # Skip if local branch already exists
                if branch_name in local_branch_names:
                    continue
                
                try:
                    # Create local branch tracking the remote
                    local_branch = repo.create_head(branch_name, ref.commit)
                    # Set up tracking to the remote branch
                    local_branch.set_tracking_branch(ref)
                    local_branch_names.add(branch_name)
                    created_count += 1
                    logger.info(f"Created local branch: {branch_name} (tracking {ref.name})")
                except GitCommandError as e:
                    logger.warning(f"Failed to create branch {branch_name}: {e}")
                    
        return created_count
    except Exception as e:
        logger.exception(f"Error creating local branches: {e}")
        return 0


def pull_repo(user_id: str, repo_name: str) -> Dict[str, Any]:
    """
    Pull latest changes for a cloned repository
    
    Args:
        user_id: User's GitHub ID
        repo_name: Repository name
        
    Returns:
        Dict:
            - status: "success" | "error"
            - message: Result message
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


# ==============================================================================
# File Operations
# ==============================================================================

def list_files(user_id: str, repo_name: str, subpath: str = "") -> Dict[str, Any]:
    """
    List files/directories in a repository
    
    Args:
        user_id: User's GitHub ID
        repo_name: Repository name
        subpath: Subdirectory path (empty string = root)
        
    Returns:
        Dict:
            - status: "success" | "error"
            - path: Requested path
            - files: [{name, type, size, path}, ...]
            
    Note:
        - .git directory is excluded
        - Directories are sorted before files
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
            # Exclude .git folder
            if item.name.startswith(".git"):
                continue
            files.append({
                "name": item.name,
                "type": "directory" if item.is_dir() else "file",
                "size": item.stat().st_size if item.is_file() else None,
                "path": str(item.relative_to(repo_path))
            })
        
        # Sort: directories first, then alphabetically
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
    Read file content from a repository
    
    Args:
        user_id: User's GitHub ID
        repo_name: Repository name
        file_path: File path (relative to repo root)
        
    Returns:
        Dict:
            - status: "success" | "error"
            - content: File content (for text files)
            - binary: Whether file is binary
            - size: File size
            
    Note:
        Binary files (images, PDF, etc.) have content set to None
    """
    repo_path = get_repo_path(user_id, repo_name)
    try:
        # Verify target file is within repo path (traversal protection)
        target_file = (repo_path / file_path).resolve()
        if not target_file.is_relative_to(repo_path):
            return {"status": "error", "message": "Access denied: outside repository"}

        if target_file.suffix.lower() in BINARY_EXTENSIONS:
            return {
                "status": "success",
                "path": file_path,
                "binary": True,
                "size": target_file.stat().st_size,
                "content": None
            }
        
        # Read text file
        content = target_file.read_text(encoding='utf-8')
        return {
            "status": "success",
            "path": file_path,
            "binary": False,
            "size": target_file.stat().st_size,
            "content": content
        }
    except UnicodeDecodeError:
        # Treat as binary if decode fails
        return {
            "status": "success",
            "path": file_path,
            "binary": True,
            "size": target_file.stat().st_size,
            "content": None
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ==============================================================================
# Repository Status
# ==============================================================================

def is_cloned(user_id: str, repo_name: str) -> bool:
    """
    Check if a repository is already cloned
    
    Returns:
        bool: True if .git folder exists
    """
    repo_path = get_repo_path(user_id, repo_name)
    return repo_path.exists() and (repo_path / ".git").exists()


def delete_repo(user_id: str, repo_name: str) -> Dict[str, Any]:
    """
    Delete a cloned repository
    
    Args:
        user_id: User's GitHub ID
        repo_name: Repository name
        
    Returns:
        Dict: {status, message}
        
    Warning:
        This operation is irreversible
    """
    repo_path = get_repo_path(user_id, repo_name)
    
    if not repo_path.exists():
        return {"status": "error", "message": "Repository not found"}
    
    try:
        shutil.rmtree(repo_path)
        return {"status": "success", "message": "Repository deleted"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ==============================================================================
# Search
# ==============================================================================

def search_files(
    user_id: str,
    repo_name: str,
    query: str,
    search_content: bool = True,
    max_results: int = 50
) -> Dict[str, Any]:
    """
    Search filenames/content in a repository
    
    Args:
        user_id: User's GitHub ID
        repo_name: Repository name
        query: Search query
        search_content: If True, search file content too
        max_results: Maximum result count
        
    Returns:
        Dict:
            - status: "success" | "error"
            - results: [{type, path, name, match, line, context}, ...]
            
    Result Types:
        - filename: Filename match
        - content: File content match (includes line, context)
    """
    repo_path = get_repo_path(user_id, repo_name)
    
    if not repo_path.exists():
        return {"status": "error", "message": "Repository not cloned", "results": []}
    
    query_lower = query.lower()
    results = []
    
    try:
        # Recursively iterate all files
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
            
            # 1. Filename search
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
            
            # 2. Content search (skip binary files)
            if search_content and file_path.suffix.lower() not in BINARY_EXTENSIONS:
                try:
                    content = file_path.read_text(encoding='utf-8', errors='ignore')
                    lines = content.split('\n')
                    
                    for line_num, line in enumerate(lines, 1):
                        if len(results) >= max_results:
                            break
                        
                        if query_lower in line.lower():
                            # Extract context (truncate long lines)
                            context = line.strip()
                            if len(context) > 200:
                                idx = line.lower().find(query_lower)
                                start = max(0, idx - 50)
                                end = min(len(line), idx + len(query) + 50)
                                context = (
                                    ("..." if start > 0 else "") +
                                    line[start:end].strip() +
                                    ("..." if end < len(line) else "")
                                )
                            
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


# ==============================================================================
# Commit History
# ==============================================================================

def get_commits(
    user_id: str,
    repo_name: str,
    branch: str = None,
    max_count: int = 50
) -> Dict[str, Any]:
    """
    Get commit history for a repository
    
    Args:
        user_id: User's GitHub ID
        repo_name: Repository name
        branch: Branch name (optional, defaults to current branch)
        max_count: Maximum commit count
        
    Returns:
        Dict:
            - status: "success" | "error"
            - commits: [{sha, message, author, date, stats}, ...]
    """
    repo_path = get_repo_path(user_id, repo_name)
    
    if not repo_path.exists():
        return {"status": "error", "message": "Repository not cloned", "commits": []}
    
    try:
        repo = Repo(repo_path)
        commits = []
        
        # Use specified branch or current HEAD
        rev = branch if branch else None
        
        for commit in repo.iter_commits(rev=rev, max_count=max_count):
            commits.append({
                "sha": commit.hexsha[:7],           # Abbreviated SHA
                "full_sha": commit.hexsha,          # Full SHA
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
            "branch": branch or repo.active_branch.name,
            "commits": commits
        }
    except Exception as e:
        print(f"Error getting commits for {user_id}/{repo_name}: {e}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e), "commits": []}


# ==============================================================================
# Branch Management
# ==============================================================================

def get_branches(user_id: str, repo_name: str) -> Dict[str, Any]:
    """
    Get branch list for a repository
    
    Note:
        Performs a git fetch first to ensure remote branches are up to date.
    
    Returns:
        Dict:
            - status: "success" | "error"
            - current_branch: Currently checked out branch
            - branches: [{name, type, is_current, commit_sha}, ...]
            
    Branch Types:
        - local: Local branch
        - remote: Remote branch (origin/*)
    """
    repo_path = get_repo_path(user_id, repo_name)
    
    if not repo_path.exists():
        return {"status": "error", "message": "Repository not cloned", "branches": []}
    
    try:
        repo = Repo(repo_path)
        branches = []
        
        # Fetch latest remote refs first (to see all remote branches)
        try:
            repo.remotes.origin.fetch()
        except Exception as fetch_err:
            logger.warning(f"Fetch failed: {fetch_err}")
            # Continue anyway with cached refs
        
        current_branch = repo.active_branch.name if not repo.head.is_detached else None
        
        # Collect local branch names for later reference
        local_branch_names = set()
        
        # Local branches
        for branch in repo.branches:
            local_branch_names.add(branch.name)
            branches.append({
                "name": branch.name,
                "type": "local",
                "is_current": branch.name == current_branch,
                "commit_sha": branch.commit.hexsha[:7],
                "commit_message": branch.commit.message.strip().split('\n')[0]
            })
        
        # Remote branches (show all, indicate if also exists locally)
        remote_branch_names = set()
        for remote in repo.remotes:
            try:
                for ref in remote.refs:
                    # Skip HEAD reference
                    if ref.name.endswith('/HEAD'):
                        continue
                    # Extract branch name (remove remote prefix like 'origin/')
                    branch_name = ref.name.split('/', 1)[1] if '/' in ref.name else ref.name
                    # Skip if already added as remote from another remote
                    if branch_name in remote_branch_names:
                        continue
                    remote_branch_names.add(branch_name)
                    branches.append({
                        "name": branch_name,
                        "type": "remote",
                        "is_current": False,
                        "has_local": branch_name in local_branch_names,
                        "commit_sha": ref.commit.hexsha[:7],
                        "commit_message": ref.commit.message.strip().split('\n')[0]
                    })
            except Exception as ref_err:
                logger.warning(f"Failed to get refs from {remote.name}: {ref_err}")
        
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
    Checkout (switch to) a branch
    
    Args:
        user_id: User's GitHub ID
        repo_name: Repository name
        branch_name: Branch name to checkout
        
    Returns:
        Dict:
            - status: "success" | "error"
            - current_branch: Current branch after checkout
            
    Behavior:
        1. If local branch exists, checkout directly
        2. If not, create local branch from remote and checkout
    """
    repo_path = get_repo_path(user_id, repo_name)
    
    if not repo_path.exists():
        return {"status": "error", "message": "Repository not cloned"}
    
    try:
        repo = Repo(repo_path)
        
        # Check if local branch exists
        if branch_name in [b.name for b in repo.branches]:
            repo.git.checkout(branch_name)
        else:
            # Create local branch from remote
            try:
                repo.git.checkout('-b', branch_name, f'origin/{branch_name}')
            except GitCommandError:
                # May already exist, try direct checkout
                repo.git.checkout(branch_name)
        
        # Pull latest changes from remote after checkout
        pull_result = None
        try:
            repo.git.pull('origin', branch_name)
            pull_result = "synced"
        except GitCommandError as pull_err:
            # Pull may fail if no upstream or conflicts
            logger.warning(f"Pull after checkout failed: {pull_err}")
            pull_result = "pull_failed"
        
        return {
            "status": "success",
            "message": f"Switched to branch '{branch_name}'",
            "current_branch": repo.active_branch.name,
            "pull_result": pull_result
        }
    except GitCommandError as e:
        return {"status": "error", "message": f"Checkout failed: {str(e)}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
