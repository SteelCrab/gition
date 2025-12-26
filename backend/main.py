"""
==============================================================================
Gition Auth Server (FastAPI)
==============================================================================
Description: GitHub OAuth authentication and API proxy server

Main Features:
    - GitHub OAuth 2.0 authentication (login/logout)
    - Repository listing (public/private)
    - Git operations API (clone, pull, files, commits, branches)
    - GitHub Issues/PRs API proxy

Environment Variables (.env):
    - GITHUB_CLIENT_ID: GitHub OAuth app client ID
    - GITHUB_CLIENT_SECRET: GitHub OAuth app client secret
    - REPOS_PATH: Cloned repository storage path (default: /repos)

Run Command:
    uvicorn main:app --host 0.0.0.0 --port 3001 --reload
==============================================================================
"""

from fastapi import FastAPI, Request, Response
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx
import asyncio
import os
import json
import logging
from urllib.parse import urlencode
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app instance
app = FastAPI(title="Gition Auth Server")

# CORS middleware configuration
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost,http://localhost:80,http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GitHub OAuth configuration (loaded from environment variables)
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
#: :meta private:
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
#: :meta private:
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost")  # Redirect URL after authentication


# ==============================================================================
# Health Check Endpoint
# ==============================================================================
@app.get("/health")
async def health():
    """
    Server status and configuration check endpoint
    
    Returns:
        - status: Server status ("ok")
        - github_configured: Whether GitHub OAuth is configured
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
    Initiate GitHub OAuth authentication
    - Redirects to GitHub login page when frontend navigates to this URL
    
    OAuth Scopes:
        - read:user: Read user profile
        - user:email: Read user email
        - repo: Access public/private repositories (important!)
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
    Handle GitHub OAuth callback
    
    Flow:
        1. Receive authorization code from GitHub
        2. Exchange code for access token
        3. Fetch user info/email with access token
        4. Pass user info to frontend (via URL parameters)
    
    Args:
        code: Authorization code from GitHub
        error: Error message on auth failure
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
# Authentication Verification API
# ==============================================================================

@app.get("/api/auth/verify")
async def verify_auth(request: Request):
    """
    Verify the current user's session by checking the GitHub token
    - Used by frontend ProtectedRoute to prevent client-side bypass
    """
    token = get_token(request)
    if not token:
        return Response(
            status_code=401,
            media_type="application/json",
            content=json.dumps({"status": "error", "authenticated": False, "message": "Not authenticated"}),
        )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = {
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github.v3+json",
            }
            user_response = await client.get("https://api.github.com/user", headers=headers)

            if user_response.status_code == 200:
                user_data = user_response.json()
                return {
                    "status": "success",
                    "authenticated": True,
                    "user": {
                        "id": user_data.get("id"),
                        "login": user_data.get("login"),
                        "name": user_data.get("name"),
                    },
                }

            if user_response.status_code in (401,):
                return Response(
                    status_code=401,
                    media_type="application/json",
                    content=json.dumps({"status": "error", "authenticated": False, "message": "Invalid token"}),
                )

            # Treat rate limit / upstream issues as transient
            return Response(
                status_code=503,
                media_type="application/json",
                content=json.dumps({"status": "error", "authenticated": False, "message": "Auth verification unavailable"}),
            )
    except Exception as e:
        logger.error(f"Auth verification failed: {e}")
        return Response(
            status_code=503,
            media_type="application/json",
            content=json.dumps({"status": "error", "authenticated": False, "message": "Auth verification unavailable"}),
        )


# ==============================================================================
# Audit Logging API
# ==============================================================================

@app.post("/api/audit/log")
async def log_audit_event(request: Request):
    """
    Record a trusted, structured audit event
    - Requires authentication
    - Derives user/timestamp on server
    - Validates event types and metadata
    """
    # 1. Authentication Check
    token = get_token(request)
    if not token:
        return Response(
            status_code=401,
            media_type="application/json",
            content=json.dumps({"status": "error", "message": "Authentication required for auditing"}),
        )

    try:
        # Verify token and get user context
        async with httpx.AsyncClient(timeout=5.0) as client:
            user_response = await client.get("https://api.github.com/user", headers={"Authorization": f"Bearer {token}"})
            if user_response.status_code != 200:
                return Response(status_code=401, content=json.dumps({"status": "error", "message": "Invalid session"}))
            user_data = user_response.json()
            user_id = user_data.get("login")

        body = await request.json()
        
        # 2. Validation: Event Type Allowlist
        ALLOWED_EVENTS = {"COMMIT_INITIATED", "COMMIT_SUCCESS", "COMMIT_FAILURE"}
        event_type = body.get("event_type")
        if event_type not in ALLOWED_EVENTS:
            return Response(status_code=400, content=json.dumps({"status": "error", "message": "Invalid event type"}))

        # 3. Validation: Metadata Filtering
        # Only allow specific keys and ensure values are strings/primitives
        ALLOWED_METADATA_KEYS = {"branch", "status", "error", "file_count"}
        raw_metadata = body.get("metadata") or {}
        if not isinstance(raw_metadata, dict):
            raw_metadata = {}

        metadata = {
            k: str(v)[:500]  # Sanitize/Truncate values
            for k, v in raw_metadata.items()
            if k in ALLOWED_METADATA_KEYS
        }

        # 4. Construct Trusted Log Entry
        from datetime import datetime, timezone
        repo_name = str(body.get("repo_name") or "")[:100]
        status = str(body.get("status") or "info")[:20]

        log_entry = {
            "version": "1.1",
            "event": event_type,
            "user": user_id, # Derived from verified token
            "repo": repo_name,
            "status": status,
            "metadata": metadata,
            "timestamp": datetime.now(timezone.utc).isoformat() # Trusted server time
        }
        
        logger.info(f"AUDIT_EVENT: {json.dumps(log_entry)}")
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Failed to record audit event: {e}")
        return Response(status_code=500, content=json.dumps({"status": "error", "message": "Logging failed"}))


# ==============================================================================
# Repository List API
# ==============================================================================

def get_token(request: Request) -> str | None:
    """Helper to extract token from header or cookie"""
    auth = request.headers.get("Authorization")
    if auth:
        return auth.replace("Bearer ", "") if auth.startswith("Bearer ") else auth
    return request.cookies.get("github_token")


@app.get("/api/repos")
async def get_repos(request: Request):
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
    clone_repo, reclone_repo, pull_repo, list_files, read_file,
    is_cloned, delete_repo, search_files, get_commits,
    get_branches, checkout_branch
)


@app.post("/api/git/clone")
async def api_clone_repo(request: Request):
    """
    Clone a GitHub repository to the server
    
    Body (JSON):
        - clone_url: Repository HTTPS clone URL
        - access_token: GitHub access token (for private repo access)
        - user_id: User ID (for path separation)
        - repo_name: Repository name
    
    Storage Path: /repos/{user_id}/{repo_name}/
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


@app.post("/api/git/reclone")
async def api_reclone_repo(request: Request):
    """
    Delete existing repository and clone fresh.
    Useful for fixing corrupted clones or resetting local changes.
    
    Body (JSON):
        - clone_url: Repository HTTPS clone URL
        - access_token: GitHub access token
        - user_id: User ID
        - repo_name: Repository name
    """
    try:
        body = await request.json()
        clone_url = body.get("clone_url")
        access_token = body.get("access_token")
        user_id = body.get("user_id")
        repo_name = body.get("repo_name")
        
        if not all([clone_url, access_token, user_id, repo_name]):
            return {"status": "error", "message": "Missing required fields"}
        
        result = await asyncio.to_thread(reclone_repo, clone_url, access_token, str(user_id), repo_name)
        return result
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/api/git/pull")
async def api_pull_repo(request: Request):
    """
    Pull latest changes from a cloned repository
    
    Body (JSON):
        - user_id: User ID
        - repo_name: Repository name
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
    List files/directories in a cloned repository
    
    Query Params:
        - user_id: User ID
        - repo_name: Repository name
        - path: Path to browse (empty string for root)
    
    Returns:
        - files: [{name, type, size, path}, ...]
    """
    # Performance: Use to_thread for blocking Git operations
    result = await asyncio.to_thread(list_files, user_id, repo_name, path)
    return result


@app.get("/api/git/file")
async def api_read_file(user_id: str, repo_name: str, path: str):
    """
    Read file content from a cloned repository
    
    Query Params:
        - user_id: User ID
        - repo_name: Repository name
        - path: File path
    
    Returns:
        - content: File content (for text files)
        - binary: Whether file is binary
    """
    # Performance: Use to_thread for blocking Git operations
    result = await asyncio.to_thread(read_file, user_id, repo_name, path)
    return result


@app.get("/api/git/status")
async def api_repo_status(user_id: str, repo_name: str):
    """Check if a repository is cloned"""
    cloned = await asyncio.to_thread(is_cloned, user_id, repo_name)
    return {
        "cloned": cloned
    }


@app.delete("/api/git/repo")
async def api_delete_repo(request: Request):
    """
    Delete a cloned repository
    
    Body (JSON):
        - user_id: User ID
        - repo_name: Repository name
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
    Search files/content within a repository
    
    Query Params:
        - user_id: User ID
        - repo_name: Repository name
        - query: Search query (minimum 2 characters)
        - content: Whether to search file content (default: true)
        - max_results: Maximum result count (max: 100)
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
    Get commit history for a repository
    
    Query Params:
        - user_id: User ID
        - repo_name: Repository name
        - max_count: Maximum commit count (max: 100)
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
    Get branch list for a repository
    
    Returns:
        - current_branch: Currently checked out branch
        - branches: [{name, type, is_current, commit_sha}, ...]
    """
    # Performance: Use to_thread for blocking Git operations
    result = await asyncio.to_thread(get_branches, user_id, repo_name)
    return result


@app.post("/api/git/checkout")
async def api_checkout_branch(request: Request):
    """
    Checkout (switch to) a branch
    
    Body (JSON):
        - user_id: User ID
        - repo_name: Repository name
        - branch_name: Branch name to checkout
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
    Get issues for a GitHub repository
    
    Query Params:
        - owner: Repository owner (username or organization)
        - repo: Repository name
        - state: Issue state (open, closed, all)
    
    Headers:
        Authorization: Bearer <access_token>
    
    Note: Pull Requests also appear in Issues API, so filtering is needed
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
    Get pull requests for a GitHub repository
    
    Query Params:
        - owner: Repository owner
        - repo: Repository name
        - state: PR state (open, closed, all)
    
    Headers:
        Authorization: Bearer <access_token>
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
