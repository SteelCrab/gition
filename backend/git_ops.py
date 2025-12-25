"""
==============================================================================
Git Operations Module
==============================================================================

Git operation handlers for GitHub repositories using GitPython.

.. module:: git_ops
   :synopsis: Git operation handlers for cloned repositories

Main Features:
    - ``clone_repo``: Clone repository (with token authentication)
    - ``pull_repo``: Pull latest changes
    - ``list_files``: List files/directories
    - ``read_file``: Read file content
    - ``search_files``: Search filenames/content
    - ``get_commits``: Get commit history
    - ``get_branches``: Get branch list
    - ``checkout_branch``: Switch branches

Dependencies:
    - GitPython: Python library for Git operations

Repository Path Structure:
    ``/repos/{user_id}/{repo_name}/``

Environment Variables:
    - ``REPOS_PATH``: Repository base path (default: /repos)

Example:
    >>> from git_ops import clone_repo, get_commits
    >>> result = clone_repo(
    ...     "https://github.com/user/repo.git",
    ...     "ghp_xxx",
    ...     "12345",
    ...     "my-repo"
    ... )
    >>> commits = get_commits("12345", "my-repo", max_count=10)

==============================================================================
"""

import os
import shutil
import logging
from pathlib import Path
from git import Repo, GitCommandError
from typing import Dict, Any

# Configure logging
logger = logging.getLogger(__name__)

#: Base path for cloned repositories.
#: Loaded from REPOS_PATH environment variable.
#:
#: :type: str
REPOS_BASE_PATH: str = os.getenv("REPOS_PATH", "/repos")

#: Set of file extensions considered binary.
#: These files are skipped during content search and
#: not returned with content in read operations.
#:
#: :type: set[str]
BINARY_EXTENSIONS: set = {
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.tar', '.gz',
    '.exe', '.dll', '.so', '.dylib', '.woff', '.woff2', '.ttf', '.eot',
    '.mp3', '.mp4', '.avi', '.mov', '.webm', '.wav', '.pyc', '.o', '.a'
}


def get_repo_path(user_id: str, repo_name: str) -> Path:
    """
    Get local filesystem path for a repository.

    Constructs the path with security validation to prevent
    path traversal attacks.

    :param user_id: User's GitHub ID
    :type user_id: str
    :param repo_name: Repository name
    :type repo_name: str

    :returns: Resolved path to the repository directory
    :rtype: Path

    :raises ValueError: If user_id or repo_name is invalid
    :raises ValueError: If path traversal is detected

    **Security:**

    - Rejects path separators (/, \\\\) in components
    - Rejects parent directory references (..)
    - Validates resolved path is within REPOS_BASE_PATH

    :Example:

        >>> path = get_repo_path("12345", "my-repo")
        >>> str(path)
        '/repos/12345/my-repo'
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
    Clone a GitHub repository to local storage.

    Clones using HTTPS with token injection for authentication.
    If repository already exists, returns existing path.

    :param clone_url: GitHub HTTPS clone URL
    :type clone_url: str
    :param access_token: GitHub OAuth access token
    :type access_token: str
    :param user_id: User's GitHub ID (for path separation)
    :type user_id: str
    :param repo_name: Repository name
    :type repo_name: str

    :returns: Clone operation result dictionary
    :rtype: Dict[str, Any]

    **Return Dictionary Fields:**

    - ``status`` (str): "success" | "exists" | "error"
    - ``path`` (str | None): Local path where repo is cloned
    - ``message`` (str): Status message

    **Authentication Method:**

    Token is injected into HTTPS URL::

        https://github.com/user/repo.git
        → https://TOKEN@github.com/user/repo.git

    **Storage Path:**

    ``{REPOS_BASE_PATH}/{user_id}/{repo_name}/``

    :Example:

        >>> result = clone_repo(
        ...     "https://github.com/user/repo.git",
        ...     "ghp_xxxxxxxxxxxx",
        ...     "12345",
        ...     "my-repo"
        ... )
        >>> result["status"]
        'success'
        >>> result["path"]
        '/repos/12345/my-repo'

    .. warning::
        Access token is sanitized in error messages to prevent leakage.
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
        return {
            "status": "success",
            "path": str(repo_path),
            "message": f"Repository cloned successfully"
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


def pull_repo(user_id: str, repo_name: str) -> Dict[str, Any]:
    """
    Pull latest changes for a cloned repository.

    Fetches and merges changes from the origin remote
    using the current branch.

    :param user_id: User's GitHub ID
    :type user_id: str
    :param repo_name: Repository name
    :type repo_name: str

    :returns: Pull operation result dictionary
    :rtype: Dict[str, Any]

    **Return Dictionary Fields:**

    - ``status`` (str): "success" | "error"
    - ``message`` (str): Result message

    :Example:

        >>> result = pull_repo("12345", "my-repo")
        >>> result["status"]
        'success'
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
    List files and directories in a repository.

    Returns directory contents with metadata.
    Directories are sorted before files, alphabetically.

    :param user_id: User's GitHub ID
    :type user_id: str
    :param repo_name: Repository name
    :type repo_name: str
    :param subpath: Subdirectory path (empty string = root)
    :type subpath: str

    :returns: Directory listing result
    :rtype: Dict[str, Any]

    **Return Dictionary Fields:**

    - ``status`` (str): "success" | "error"
    - ``path`` (str): Requested path
    - ``files`` (list): List of file/directory objects

    **File Object Fields:**

    - ``name`` (str): File or directory name
    - ``type`` (str): "file" | "directory"
    - ``size`` (int | None): File size in bytes (None for directories)
    - ``path`` (str): Relative path from repository root

    .. note::
        The ``.git`` directory and hidden git files are excluded.

    :Example:

        >>> result = list_files("12345", "my-repo", "src")
        >>> for f in result["files"]:
        ...     print(f["name"], f["type"])
        components directory
        App.tsx file
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
    Read file content from a repository.

    Returns file content for text files.
    Binary files return metadata only with content set to None.

    :param user_id: User's GitHub ID
    :type user_id: str
    :param repo_name: Repository name
    :type repo_name: str
    :param file_path: File path relative to repository root
    :type file_path: str

    :returns: File content result
    :rtype: Dict[str, Any]

    **Return Dictionary Fields:**

    - ``status`` (str): "success" | "error"
    - ``path`` (str): File path
    - ``binary`` (bool): Whether file is binary
    - ``size`` (int): File size in bytes
    - ``content`` (str | None): File content (None for binary files)

    **Binary Detection:**

    Files are considered binary if:

    1. Extension is in BINARY_EXTENSIONS set
    2. UTF-8 decoding fails

    **Security:**

    Path traversal protection ensures file is within repository.

    :Example:

        >>> result = read_file("12345", "my-repo", "README.md")
        >>> result["binary"]
        False
        >>> result["content"][:50]
        '# My Repository\\n\\nThis is a sample project...'
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
    Check if a repository is already cloned.

    Verifies the repository directory exists and contains a .git folder.

    :param user_id: User's GitHub ID
    :type user_id: str
    :param repo_name: Repository name
    :type repo_name: str

    :returns: True if repository is cloned, False otherwise
    :rtype: bool

    :Example:

        >>> is_cloned("12345", "my-repo")
        True
        >>> is_cloned("12345", "not-cloned")
        False
    """
    repo_path = get_repo_path(user_id, repo_name)
    return repo_path.exists() and (repo_path / ".git").exists()


def delete_repo(user_id: str, repo_name: str) -> Dict[str, Any]:
    """
    Delete a cloned repository.

    Removes the entire repository directory including all files and history.

    :param user_id: User's GitHub ID
    :type user_id: str
    :param repo_name: Repository name
    :type repo_name: str

    :returns: Delete operation result
    :rtype: Dict[str, Any]

    **Return Dictionary Fields:**

    - ``status`` (str): "success" | "error"
    - ``message`` (str): Result message

    .. warning::
        This operation is **irreversible**. All local changes,
        uncommitted work, and history will be permanently deleted.

    :Example:

        >>> result = delete_repo("12345", "my-repo")
        >>> result["status"]
        'success'
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
    Search filenames and content in a repository.

    Performs case-insensitive search on filenames and optionally file content.
    Binary files are automatically skipped for content search.

    :param user_id: User's GitHub ID
    :type user_id: str
    :param repo_name: Repository name
    :type repo_name: str
    :param query: Search query string
    :type query: str
    :param search_content: Whether to search file content (default: True)
    :type search_content: bool
    :param max_results: Maximum number of results to return (default: 50)
    :type max_results: int

    :returns: Search results
    :rtype: Dict[str, Any]

    **Return Dictionary Fields:**

    - ``status`` (str): "success" | "error"
    - ``query`` (str): Original search query
    - ``total`` (int): Number of results found
    - ``results`` (list): List of search result objects

    **Result Object Fields:**

    - ``type`` (str): "filename" | "content"
    - ``path`` (str): File path relative to repo root
    - ``name`` (str): File name
    - ``match`` (str): Matched text
    - ``line`` (int | None): Line number (for content matches)
    - ``context`` (str | None): Context around match (for content matches)

    **Search Behavior:**

    1. First searches filenames (case-insensitive)
    2. If content search enabled, searches inside text files
    3. Long context lines are truncated with ellipsis
    4. Stops when max_results is reached

    :Example:

        >>> result = search_files("12345", "my-repo", "import", max_results=10)
        >>> for r in result["results"]:
        ...     print(f"{r['type']}: {r['path']}:{r.get('line', '')}")
        content: src/App.tsx:1
        content: src/utils.ts:2
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
    max_count: int = 50
) -> Dict[str, Any]:
    """
    Get commit history for a repository.

    Returns a list of commits with author information, message, and statistics.

    :param user_id: User's GitHub ID
    :type user_id: str
    :param repo_name: Repository name
    :type repo_name: str
    :param max_count: Maximum number of commits to return (default: 50)
    :type max_count: int

    :returns: Commit history result
    :rtype: Dict[str, Any]

    **Return Dictionary Fields:**

    - ``status`` (str): "success" | "error"
    - ``total`` (int): Number of commits returned
    - ``commits`` (list): List of commit objects

    **Commit Object Fields:**

    - ``sha`` (str): Abbreviated commit SHA (7 characters)
    - ``full_sha`` (str): Full commit SHA (40 characters)
    - ``message`` (str): First line of commit message
    - ``author`` (str): Author name
    - ``author_email`` (str): Author email
    - ``date`` (str): Commit date (ISO 8601 format)
    - ``stats`` (dict): Commit statistics

    **Stats Object Fields:**

    - ``files`` (int): Number of files changed
    - ``insertions`` (int): Lines added
    - ``deletions`` (int): Lines removed

    :Example:

        >>> result = get_commits("12345", "my-repo", max_count=5)
        >>> for c in result["commits"]:
        ...     print(f"{c['sha']} - {c['message']}")
        a1b2c3d - Initial commit
        e4f5g6h - Add README
    """
    repo_path = get_repo_path(user_id, repo_name)
    
    if not repo_path.exists():
        return {"status": "error", "message": "Repository not cloned", "commits": []}
    
    try:
        repo = Repo(repo_path)
        commits = []
        
        for commit in repo.iter_commits(max_count=max_count):
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
    Get branch list for a repository.

    Returns both local and remote branches.
    Performs a git fetch first to ensure remote branches are up to date.

    :param user_id: User's GitHub ID
    :type user_id: str
    :param repo_name: Repository name
    :type repo_name: str

    :returns: Branch list result
    :rtype: Dict[str, Any]

    **Return Dictionary Fields:**

    - ``status`` (str): "success" | "error"
    - ``current_branch`` (str | None): Currently checked out branch
    - ``total`` (int): Total number of branches
    - ``branches`` (list): List of branch objects

    **Branch Object Fields:**

    - ``name`` (str): Branch name
    - ``type`` (str): "local" | "remote"
    - ``is_current`` (bool): Whether this is the current branch
    - ``commit_sha`` (str): Latest commit SHA (7 characters)
    - ``commit_message`` (str): Latest commit message (first line)

    **Behavior:**

    1. Fetches from origin remote first (may fail silently)
    2. Lists all local branches
    3. Lists remote branches not already tracked locally
    4. HEAD references are excluded

    :Example:

        >>> result = get_branches("12345", "my-repo")
        >>> result["current_branch"]
        'main'
        >>> for b in result["branches"]:
        ...     print(f"{b['name']} ({b['type']})")
        main (local)
        develop (local)
        feature/new (remote)
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
        
        # Local branches
        for branch in repo.branches:
            branches.append({
                "name": branch.name,
                "type": "local",
                "is_current": branch.name == current_branch,
                "commit_sha": branch.commit.hexsha[:7],
                "commit_message": branch.commit.message.strip().split('\n')[0]
            })
        
        # Remote branches (from all remotes, not just origin)
        for remote in repo.remotes:
            try:
                for ref in remote.refs:
                    # Skip HEAD reference
                    if ref.name.endswith('/HEAD'):
                        continue
                    # Extract branch name (remove remote prefix like 'origin/')
                    branch_name = ref.name.split('/', 1)[1] if '/' in ref.name else ref.name
                    # Skip if already exists as local branch
                    if not any(b['name'] == branch_name and b['type'] == 'local' for b in branches):
                        # Also skip if already added as remote
                        if not any(b['name'] == branch_name and b['type'] == 'remote' for b in branches):
                            branches.append({
                                "name": branch_name,
                                "type": "remote",
                                "is_current": False,
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
    Checkout (switch to) a branch.

    Switches the working directory to the specified branch.
    If the branch only exists on remote, creates a local tracking branch.

    :param user_id: User's GitHub ID
    :type user_id: str
    :param repo_name: Repository name
    :type repo_name: str
    :param branch_name: Branch name to checkout
    :type branch_name: str

    :returns: Checkout operation result
    :rtype: Dict[str, Any]

    **Return Dictionary Fields:**

    - ``status`` (str): "success" | "error"
    - ``message`` (str): Result message
    - ``current_branch`` (str): Current branch after checkout

    **Checkout Behavior:**

    1. If local branch exists → checkout directly
    2. If only remote exists → create local branch from origin/{branch}
    3. If neither exists → error

    :Example:

        >>> result = checkout_branch("12345", "my-repo", "develop")
        >>> result["status"]
        'success'
        >>> result["current_branch"]
        'develop'

    .. note::
        Uncommitted changes may prevent checkout. Handle errors appropriately.
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
        
        return {
            "status": "success",
            "message": f"Switched to branch '{branch_name}'",
            "current_branch": repo.active_branch.name
        }
    except GitCommandError as e:
        return {"status": "error", "message": f"Checkout failed: {str(e)}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
