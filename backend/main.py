"""
==============================================================================
Gition Auth Server (FastAPI)
==============================================================================

FastAPI-based authentication and API proxy server for GitHub integration.

.. module:: main
   :synopsis: GitHub OAuth authentication and API proxy server

Main Features:
    - GitHub OAuth 2.0 authentication (login/logout)
    - Repository listing (public/private)
    - Git operations API (clone, pull, files, commits, branches)
    - GitHub Issues/PRs API proxy

Environment Variables:
    - ``GITHUB_CLIENT_ID``: GitHub OAuth app client ID
    - ``GITHUB_CLIENT_SECRET``: GitHub OAuth app client secret
    - ``REPOS_PATH``: Cloned repository storage path (default: /repos)
    - ``FRONTEND_URL``: Frontend URL for OAuth redirect (default: http://localhost)
    - ``ALLOWED_ORIGINS``: CORS allowed origins (comma-separated)

Example:
    Run the server with uvicorn::

        $ uvicorn main:app --host 0.0.0.0 --port 3001 --reload

==============================================================================
"""

from fastapi import FastAPI, Request, Response
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx
import asyncio
import os
import json
from urllib.parse import urlencode
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

#: FastAPI application instance
#:
#: :type: FastAPI
app = FastAPI(title="Gition Auth Server")

#: List of allowed CORS origins, loaded from environment variable
#:
#: :type: list[str]
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost,http://localhost:80,http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#: GitHub OAuth application client ID
#:
#: :type: str | None
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")

#: GitHub OAuth application client secret
#:
#: :type: str | None
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")

#: Frontend URL for OAuth redirect after authentication
#:
#: :type: str
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost")


# ==============================================================================
# Health Check Endpoint
# ==============================================================================

@app.get("/health")
async def health():
    """
    Check server status and configuration.

    Returns server health status and whether GitHub OAuth is properly configured.

    :returns: Health status response
    :rtype: dict

    :Example:

        >>> response = await client.get("/health")
        >>> response.json()
        {"status": "ok", "github_configured": True}

    **Response Fields:**

    - ``status`` (str): Server status, always "ok" if server is running
    - ``github_configured`` (bool): Whether GitHub OAuth credentials are set
    """
    return {
        "status": "ok",
        "github_configured": bool(GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET)
    }


# ==============================================================================
# GitHub OAuth Authentication Flow
# ==============================================================================

@app.get("/auth/github")
async def github_auth():
    """
    Initiate GitHub OAuth authentication flow.

    Redirects the user to GitHub's authorization page to grant access.
    After authorization, GitHub will redirect back to the callback endpoint.

    :returns: Redirect response to GitHub OAuth authorization page
    :rtype: RedirectResponse

    **OAuth Scopes Requested:**

    - ``read:user``: Read user profile information
    - ``user:email``: Read user email addresses
    - ``repo``: Full access to public and private repositories

    :Example:

        Navigate to ``/auth/github`` to start the OAuth flow.
    """
    # Nginx proxies to port 80, so callback URL uses port 80
    redirect_uri = "http://localhost/auth/github/callback"
    
    # 'repo' scope grants access to private repositories
    scope = "read:user user:email repo"
    
    params = urlencode({
        "client_id": GITHUB_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "scope": scope
    })
    
    return RedirectResponse(f"https://github.com/login/oauth/authorize?{params}")


@app.get("/auth/github/callback")
async def github_callback(code: str = None, error: str = None):
    """
    Handle GitHub OAuth callback after user authorization.

    This endpoint is called by GitHub after the user grants/denies access.
    It exchanges the authorization code for an access token, fetches user info,
    and redirects to the frontend with user data.

    :param code: Authorization code from GitHub (on success)
    :type code: str | None
    :param error: Error message from GitHub (on failure)
    :type error: str | None

    :returns: Redirect to frontend with user info or error
    :rtype: RedirectResponse

    **Authentication Flow:**

    1. Receive authorization code from GitHub
    2. Exchange code for access token via POST request
    3. Fetch user profile and email with access token
    4. Set secure HttpOnly cookie with access token
    5. Redirect to frontend with user info in URL params

    **Cookie Settings:**

    - ``github_token``: Access token stored as HttpOnly cookie
    - Max age: 7 days
    - SameSite: Lax
    - Secure: Based on FRONTEND_URL protocol

    :raises: Redirects to ``/login?error=auth_failed`` on failure
    """
    # Error handling
    if error or not code:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=auth_failed")
    
    async with httpx.AsyncClient() as client:
        # Step 1: Exchange authorization code for access token
        token_response = await client.post(
            "https://github.com/login/oauth/access_token",
            json={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code
            },
            headers={"Accept": "application/json"}
        )
        
        token_data = token_response.json()
        
        if "error" in token_data:
            return RedirectResponse(f"{FRONTEND_URL}/login?error=token_error")
        
        access_token = token_data.get("access_token")
        
        # Step 2: Fetch user info
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        user_response = await client.get("https://api.github.com/user", headers=headers)
        user_data = user_response.json()
        
        # Step 3: Fetch user email (prefer primary email)
        email_response = await client.get("https://api.github.com/user/emails", headers=headers)
        emails = email_response.json()
        primary_email = next(
            (e["email"] for e in emails if e.get("primary")),
            emails[0]["email"] if emails else None
        )
        
        # Step 4: Prepare user info for frontend
        user_info = {
            "id": user_data.get("id"),
            "login": user_data.get("login"),
            "name": user_data.get("name") or user_data.get("login"),
            "email": primary_email or f"{user_data.get('id')}+{user_data.get('login')}@users.noreply.github.com",
            "avatar_url": user_data.get("avatar_url")
        }
        
        # Security: Use Secure, HttpOnly cookie instead of URL parameters
        response = RedirectResponse(f"{FRONTEND_URL}/auth/callback?user={json.dumps(user_info)}")
        
        # Determine if we are on HTTPS (for Secure attribute)
        is_https = FRONTEND_URL.startswith("https")
        
        response.set_cookie(
            key="github_token",
            value=access_token,
            httponly=True,
            secure=is_https,
            samesite="lax",
            max_age=60 * 60 * 24 * 7,  # 7 days
            path="/"
        )
        
        return response


# ==============================================================================
# Repository List API
# ==============================================================================

def get_token(request: Request) -> str | None:
    """
    Extract GitHub access token from request.

    Checks for token in Authorization header first, then falls back to cookie.

    :param request: FastAPI request object
    :type request: Request

    :returns: Access token if found, None otherwise
    :rtype: str | None

    **Token Sources (in order of precedence):**

    1. ``Authorization`` header: ``Bearer <token>``
    2. ``github_token`` cookie (set during OAuth callback)

    :Example:

        >>> token = get_token(request)
        >>> if token:
        ...     # Use token for GitHub API calls
        ...     pass
    """
    auth = request.headers.get("Authorization")
    if auth:
        return auth.replace("Bearer ", "") if auth.startswith("Bearer ") else auth
    return request.cookies.get("github_token")


@app.get("/api/repos")
async def get_repos(request: Request):
    """
    List all repositories accessible by the authenticated user.

    Fetches repositories from GitHub API including public, private,
    owned, and collaborated repositories.

    :param request: FastAPI request object (contains auth token)
    :type request: Request

    :returns: Repository list response
    :rtype: dict

    **Response Fields:**

    - ``total`` (int): Total repository count
    - ``public`` (int): Public repository count
    - ``private`` (int): Private repository count
    - ``repos`` (list): List of repository objects

    **Repository Object Fields:**

    - ``id`` (int): Repository ID
    - ``name`` (str): Repository name
    - ``full_name`` (str): Full repository name (owner/repo)
    - ``description`` (str | None): Repository description
    - ``private`` (bool): Whether repository is private
    - ``html_url`` (str): GitHub web URL
    - ``clone_url`` (str): HTTPS clone URL
    - ``ssh_url`` (str): SSH clone URL
    - ``language`` (str | None): Primary programming language
    - ``stargazers_count`` (int): Star count
    - ``updated_at`` (str): Last update timestamp (ISO 8601)
    - ``default_branch`` (str): Default branch name

    :raises: Returns ``{"error": "Not authenticated", "repos": []}`` if no token
    """
    token = get_token(request)
    if not token:
        return {"error": "Not authenticated", "repos": []}
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        repos_response = await client.get(
            "https://api.github.com/user/repos",
            headers=headers,
            params={
                "visibility": "all",                                  # Public + private
                "affiliation": "owner,collaborator,organization_member",
                "sort": "updated",                                    # Most recently updated first
                "per_page": 100
            }
        )
        
        if repos_response.status_code != 200:
            return {"error": "Failed to fetch repos", "repos": []}
        
        repos_data = repos_response.json()
        
        # Extract necessary fields for response
        repos = [
            {
                "id": repo["id"],
                "name": repo["name"],
                "full_name": repo["full_name"],
                "description": repo["description"],
                "private": repo["private"],
                "html_url": repo["html_url"],
                "clone_url": repo["clone_url"],
                "ssh_url": repo["ssh_url"],
                "language": repo["language"],
                "stargazers_count": repo["stargazers_count"],
                "updated_at": repo["updated_at"],
                "default_branch": repo["default_branch"]
            }
            for repo in repos_data
        ]
        
        return {
            "total": len(repos),
            "public": len([r for r in repos if not r["private"]]),
            "private": len([r for r in repos if r["private"]]),
            "repos": repos
        }


# ==============================================================================
# Git Operations API
# ==============================================================================
# Import actual Git operation functions from git_ops.py
from git_ops import (
    clone_repo, pull_repo, list_files, read_file,
    is_cloned, delete_repo, search_files, get_commits,
    get_branches, checkout_branch
)


@app.post("/api/git/clone")
async def api_clone_repo(request: Request):
    """
    Clone a GitHub repository to local server storage.

    Clones a repository using HTTPS with token authentication.
    Repositories are stored at ``/repos/{user_id}/{repo_name}/``.

    :param request: FastAPI request object containing JSON body
    :type request: Request

    :returns: Clone operation result
    :rtype: dict

    **Request Body (JSON):**

    - ``clone_url`` (str): Repository HTTPS clone URL
    - ``access_token`` (str): GitHub access token for authentication
    - ``user_id`` (str): User's GitHub ID (for path separation)
    - ``repo_name`` (str): Repository name

    **Response Fields:**

    - ``status`` (str): "success" | "exists" | "error"
    - ``path`` (str | None): Local path where repo is cloned
    - ``message`` (str): Status message

    :Example:

        >>> response = await client.post("/api/git/clone", json={
        ...     "clone_url": "https://github.com/user/repo.git",
        ...     "access_token": "ghp_xxx",
        ...     "user_id": "12345",
        ...     "repo_name": "my-repo"
        ... })
    """
    try:
        body = await request.json()
        clone_url = body.get("clone_url")
        access_token = body.get("access_token")
        user_id = body.get("user_id")
        repo_name = body.get("repo_name")
        
        if not all([clone_url, access_token, user_id, repo_name]):
            return {"status": "error", "message": "Missing required fields"}
        
        # Performance: Use to_thread for blocking Git operations
        result = await asyncio.to_thread(clone_repo, clone_url, access_token, str(user_id), repo_name)
        return result
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/api/git/pull")
async def api_pull_repo(request: Request):
    """
    Pull latest changes from remote for a cloned repository.

    Fetches and merges changes from the origin remote.

    :param request: FastAPI request object containing JSON body
    :type request: Request

    :returns: Pull operation result
    :rtype: dict

    **Request Body (JSON):**

    - ``user_id`` (str): User's GitHub ID
    - ``repo_name`` (str): Repository name

    **Response Fields:**

    - ``status`` (str): "success" | "error"
    - ``message`` (str): Result message
    """
    try:
        body = await request.json()
        user_id = body.get("user_id")
        repo_name = body.get("repo_name")
        
        if not all([user_id, repo_name]):
            return {"status": "error", "message": "Missing required fields"}
        
        # Performance: Use to_thread for blocking Git operations
        result = await asyncio.to_thread(pull_repo, str(user_id), repo_name)
        return result
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/api/git/files")
async def api_list_files(user_id: str, repo_name: str, path: str = ""):
    """
    List files and directories in a cloned repository.

    Returns directory contents with file metadata.
    Directories are sorted before files, alphabetically.

    :param user_id: User's GitHub ID
    :type user_id: str
    :param repo_name: Repository name
    :type repo_name: str
    :param path: Subdirectory path (empty string for root)
    :type path: str

    :returns: File listing result
    :rtype: dict

    **Response Fields:**

    - ``status`` (str): "success" | "error"
    - ``path`` (str): Requested path
    - ``files`` (list): List of file/directory objects

    **File Object Fields:**

    - ``name`` (str): File or directory name
    - ``type`` (str): "file" | "directory"
    - ``size`` (int | None): File size in bytes (None for directories)
    - ``path`` (str): Relative path from repository root

    .. note::
        The ``.git`` directory is excluded from listings.
    """
    # Performance: Use to_thread for blocking Git operations
    result = await asyncio.to_thread(list_files, user_id, repo_name, path)
    return result


@app.get("/api/git/file")
async def api_read_file(user_id: str, repo_name: str, path: str):
    """
    Read file content from a cloned repository.

    Returns file content for text files. Binary files return
    metadata only with content set to None.

    :param user_id: User's GitHub ID
    :type user_id: str
    :param repo_name: Repository name
    :type repo_name: str
    :param path: File path relative to repository root
    :type path: str

    :returns: File content result
    :rtype: dict

    **Response Fields:**

    - ``status`` (str): "success" | "error"
    - ``path`` (str): File path
    - ``binary`` (bool): Whether file is binary
    - ``size`` (int): File size in bytes
    - ``content`` (str | None): File content (None for binary files)

    **Binary Detection:**

    Files with extensions like .png, .jpg, .pdf, .exe are
    treated as binary and content is not returned.
    """
    # Performance: Use to_thread for blocking Git operations
    result = await asyncio.to_thread(read_file, user_id, repo_name, path)
    return result


@app.get("/api/git/status")
async def api_repo_status(user_id: str, repo_name: str):
    """
    Check if a repository is cloned locally.

    :param user_id: User's GitHub ID
    :type user_id: str
    :param repo_name: Repository name
    :type repo_name: str

    :returns: Clone status
    :rtype: dict

    **Response Fields:**

    - ``cloned`` (bool): Whether repository exists locally with .git folder
    """
    cloned = await asyncio.to_thread(is_cloned, user_id, repo_name)
    return {
        "cloned": cloned
    }


@app.delete("/api/git/repo")
async def api_delete_repo(request: Request):
    """
    Delete a cloned repository from local storage.

    Removes the entire repository directory including all files.

    :param request: FastAPI request object containing JSON body
    :type request: Request

    :returns: Delete operation result
    :rtype: dict

    **Request Body (JSON):**

    - ``user_id`` (str): User's GitHub ID
    - ``repo_name`` (str): Repository name

    **Response Fields:**

    - ``status`` (str): "success" | "error"
    - ``message`` (str): Result message

    .. warning::
        This operation is irreversible. All local changes will be lost.
    """
    try:
        body = await request.json()
        user_id = body.get("user_id")
        repo_name = body.get("repo_name")
        
        if not all([user_id, repo_name]):
            return {"status": "error", "message": "Missing required fields"}
        
        # Performance: Use to_thread for blocking Git operations
        result = await asyncio.to_thread(delete_repo, str(user_id), repo_name)
        return result
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/api/git/search")
async def api_search_files(
    user_id: str,
    repo_name: str,
    query: str,
    content: bool = True,
    max_results: int = 50
):
    """
    Search files and content within a repository.

    Searches both filenames and file content (optionally).
    Binary files are skipped for content search.

    :param user_id: User's GitHub ID
    :type user_id: str
    :param repo_name: Repository name
    :type repo_name: str
    :param query: Search query (minimum 2 characters)
    :type query: str
    :param content: Whether to search file content (default: True)
    :type content: bool
    :param max_results: Maximum result count (max: 100)
    :type max_results: int

    :returns: Search results
    :rtype: dict

    **Response Fields:**

    - ``status`` (str): "success" | "error"
    - ``query`` (str): Original search query
    - ``total`` (int): Total result count
    - ``results`` (list): List of search result objects

    **Result Object Fields:**

    - ``type`` (str): "filename" | "content"
    - ``path`` (str): File path relative to repo root
    - ``name`` (str): File name
    - ``match`` (str): Matched text
    - ``line`` (int | None): Line number (for content matches)
    - ``context`` (str | None): Context around match (for content matches)
    """
    if not query or len(query) < 2:
        return {"status": "error", "message": "Query must be at least 2 characters", "results": []}
    
    # Performance: Use to_thread for blocking Git operations
    result = await asyncio.to_thread(search_files, user_id, repo_name, query, content, min(max_results, 100))
    return result


@app.get("/api/git/commits")
async def api_get_commits(
    user_id: str,
    repo_name: str,
    max_count: int = 50
):
    """
    Get commit history for a repository.

    Returns a list of commits with author, message, and stats.

    :param user_id: User's GitHub ID
    :type user_id: str
    :param repo_name: Repository name
    :type repo_name: str
    :param max_count: Maximum commit count (max: 100, default: 50)
    :type max_count: int

    :returns: Commit history
    :rtype: dict

    **Response Fields:**

    - ``status`` (str): "success" | "error"
    - ``total`` (int): Number of commits returned
    - ``commits`` (list): List of commit objects

    **Commit Object Fields:**

    - ``sha`` (str): Abbreviated commit SHA (7 characters)
    - ``full_sha`` (str): Full commit SHA
    - ``message`` (str): First line of commit message
    - ``author`` (str): Author name
    - ``author_email`` (str): Author email
    - ``date`` (str): Commit date (ISO 8601)
    - ``stats`` (dict): Commit statistics (files, insertions, deletions)
    """
    # Performance: Use to_thread for blocking Git operations
    result = await asyncio.to_thread(get_commits, user_id, repo_name, min(max_count, 100))
    return result


@app.get("/api/git/branches")
async def api_get_branches(
    user_id: str,
    repo_name: str
):
    """
    Get branch list for a repository.

    Returns both local and remote branches with current branch indicator.
    Performs a git fetch first to ensure remote branches are up to date.

    :param user_id: User's GitHub ID
    :type user_id: str
    :param repo_name: Repository name
    :type repo_name: str

    :returns: Branch list
    :rtype: dict

    **Response Fields:**

    - ``status`` (str): "success" | "error"
    - ``current_branch`` (str | None): Currently checked out branch
    - ``total`` (int): Total branch count
    - ``branches`` (list): List of branch objects

    **Branch Object Fields:**

    - ``name`` (str): Branch name
    - ``type`` (str): "local" | "remote"
    - ``is_current`` (bool): Whether this is the current branch
    - ``commit_sha`` (str): Latest commit SHA (7 characters)
    - ``commit_message`` (str): Latest commit message (first line)
    """
    # Performance: Use to_thread for blocking Git operations
    result = await asyncio.to_thread(get_branches, user_id, repo_name)
    return result


@app.post("/api/git/checkout")
async def api_checkout_branch(request: Request):
    """
    Checkout (switch to) a branch.

    Switches the working directory to the specified branch.
    If the branch only exists on remote, creates a local tracking branch.

    :param request: FastAPI request object containing JSON body
    :type request: Request

    :returns: Checkout result
    :rtype: dict

    **Request Body (JSON):**

    - ``user_id`` (str): User's GitHub ID
    - ``repo_name`` (str): Repository name
    - ``branch_name`` (str): Branch name to checkout

    **Response Fields:**

    - ``status`` (str): "success" | "error"
    - ``message`` (str): Result message
    - ``current_branch`` (str): Current branch after checkout

    **Checkout Behavior:**

    1. If local branch exists, checkout directly
    2. If only remote exists, create local branch tracking origin/{branch}
    """
    try:
        body = await request.json()
        user_id = body.get("user_id")
        repo_name = body.get("repo_name")
        branch_name = body.get("branch_name")
        
        if not all([user_id, repo_name, branch_name]):
            return {"status": "error", "message": "Missing required fields"}
        
        # Performance: Use to_thread for blocking Git operations
        result = await asyncio.to_thread(checkout_branch, user_id, repo_name, branch_name)
        return result
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ==============================================================================
# GitHub Issues & PRs API (Proxy)
# ==============================================================================
# Fetch Issues/PRs info by directly calling GitHub API
# Works without cloning the repository

@app.get("/api/github/issues")
async def api_get_issues(request: Request, owner: str, repo: str, state: str = "open"):
    """
    Get issues for a GitHub repository.

    Fetches issues directly from GitHub API (no clone required).
    Pull Requests are filtered out (they appear in issues endpoint).

    :param request: FastAPI request object (contains auth token)
    :type request: Request
    :param owner: Repository owner (username or organization)
    :type owner: str
    :param repo: Repository name
    :type repo: str
    :param state: Issue state filter ("open", "closed", "all")
    :type state: str

    :returns: Issues list
    :rtype: dict

    **Response Fields:**

    - ``status`` (str): "success" | "error"
    - ``total`` (int): Number of issues returned
    - ``issues`` (list): List of issue objects

    **Issue Object Fields:**

    - ``id`` (int): Issue ID
    - ``number`` (int): Issue number
    - ``title`` (str): Issue title
    - ``state`` (str): Issue state ("open" | "closed")
    - ``user`` (dict): Author info (login, avatar_url)
    - ``labels`` (list): List of label objects (name, color)
    - ``comments`` (int): Comment count
    - ``created_at`` (str): Creation timestamp (ISO 8601)
    - ``updated_at`` (str): Last update timestamp (ISO 8601)
    - ``html_url`` (str): GitHub web URL

    .. note::
        Requires Authorization header with valid GitHub token.
    """
    token = get_token(request)
    if not token:
        return {"status": "error", "message": "No authorization token", "issues": []}
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"https://api.github.com/repos/{owner}/{repo}/issues",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github.v3+json"
                },
                params={
                    "state": state,
                    "per_page": 50,
                    "sort": "updated",
                    "direction": "desc"
                }
            )
        
        if response.status_code != 200:
            return {"status": "error", "message": "Failed to fetch issues", "issues": []}
        
        issues_data = response.json()
        
        # Filter out PRs (they appear in issues endpoint too)
        issues = [
            {
                "id": issue["id"],
                "number": issue["number"],
                "title": issue["title"],
                "state": issue["state"],
                "user": {
                    "login": issue["user"]["login"],
                    "avatar_url": issue["user"]["avatar_url"]
                },
                "labels": [{"name": l["name"], "color": l["color"]} for l in issue.get("labels", [])],
                "comments": issue["comments"],
                "created_at": issue["created_at"],
                "updated_at": issue["updated_at"],
                "html_url": issue["html_url"]
            }
            for issue in issues_data
            if "pull_request" not in issue  # Exclude PRs
        ]
        
        return {
            "status": "success",
            "total": len(issues),
            "issues": issues
        }
    except Exception as e:
        return {"status": "error", "message": str(e), "issues": []}


@app.get("/api/github/pulls")
async def api_get_pulls(request: Request, owner: str, repo: str, state: str = "open"):
    """
    Get pull requests for a GitHub repository.

    Fetches pull requests directly from GitHub API (no clone required).

    :param request: FastAPI request object (contains auth token)
    :type request: Request
    :param owner: Repository owner (username or organization)
    :type owner: str
    :param repo: Repository name
    :type repo: str
    :param state: PR state filter ("open", "closed", "all")
    :type state: str

    :returns: Pull requests list
    :rtype: dict

    **Response Fields:**

    - ``status`` (str): "success" | "error"
    - ``total`` (int): Number of PRs returned
    - ``pulls`` (list): List of pull request objects

    **Pull Request Object Fields:**

    - ``id`` (int): PR ID
    - ``number`` (int): PR number
    - ``title`` (str): PR title
    - ``state`` (str): PR state ("open" | "closed" | "merged")
    - ``user`` (dict): Author info (login, avatar_url)
    - ``head`` (dict): Source branch info (ref, sha)
    - ``base`` (dict): Target branch info (ref)
    - ``draft`` (bool): Whether PR is a draft
    - ``mergeable_state`` (str | None): Merge status
    - ``created_at`` (str): Creation timestamp (ISO 8601)
    - ``updated_at`` (str): Last update timestamp (ISO 8601)
    - ``html_url`` (str): GitHub web URL

    .. note::
        Requires Authorization header with valid GitHub token.
    """
    token = get_token(request)
    if not token:
        return {"status": "error", "message": "No authorization token", "pulls": []}
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"https://api.github.com/repos/{owner}/{repo}/pulls",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github.v3+json"
                },
                params={
                    "state": state,
                    "per_page": 50,
                    "sort": "updated",
                    "direction": "desc"
                }
            )
        
        if response.status_code != 200:
            return {"status": "error", "message": "Failed to fetch pull requests", "pulls": []}
        
        pulls_data = response.json()
        
        pulls = [
            {
                "id": pr["id"],
                "number": pr["number"],
                "title": pr["title"],
                "state": pr["state"],
                "user": {
                    "login": pr["user"]["login"],
                    "avatar_url": pr["user"]["avatar_url"]
                },
                "head": {
                    "ref": pr["head"]["ref"],       # Source branch
                    "sha": pr["head"]["sha"][:7]    # Commit SHA (abbreviated)
                },
                "base": {
                    "ref": pr["base"]["ref"]        # Target branch
                },
                "draft": pr.get("draft", False),
                "mergeable_state": pr.get("mergeable_state"),
                "created_at": pr["created_at"],
                "updated_at": pr["updated_at"],
                "html_url": pr["html_url"]
            }
            for pr in pulls_data
        ]
        
        return {
            "status": "success",
            "total": len(pulls),
            "pulls": pulls
        }
    except Exception as e:
        return {"status": "error", "message": str(e), "pulls": []}


# ==============================================================================
# Server Entrypoint (Direct Execution)
# ==============================================================================
if __name__ == "__main__":
    import uvicorn
    # Run in development mode (no auto-reload)
    uvicorn.run(app, host="0.0.0.0", port=3001)
