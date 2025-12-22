from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx
import requests
import os
import json
from urllib.parse import urlencode
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Gition Auth Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://localhost:80", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
FRONTEND_URL = "http://localhost"


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "github_configured": bool(GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET)
    }


@app.get("/auth/github")
async def github_auth():
    """Redirect to GitHub OAuth"""
    # Use port 80 since nginx proxies to backend
    redirect_uri = "http://localhost/auth/github/callback"
    # Added 'repo' scope to access private repositories
    scope = "read:user user:email repo"
    
    params = urlencode({
        "client_id": GITHUB_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "scope": scope
    })
    
    return RedirectResponse(f"https://github.com/login/oauth/authorize?{params}")


@app.get("/auth/github/callback")
async def github_callback(code: str = None, error: str = None):
    """Handle GitHub OAuth callback"""
    if error or not code:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=auth_failed")
    
    async with httpx.AsyncClient() as client:
        # Exchange code for access token
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
        
        # Get user info
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        user_response = await client.get("https://api.github.com/user", headers=headers)
        user_data = user_response.json()
        
        # Get user email
        email_response = await client.get("https://api.github.com/user/emails", headers=headers)
        emails = email_response.json()
        primary_email = next((e["email"] for e in emails if e.get("primary")), emails[0]["email"] if emails else None)
        
        # Prepare user data for frontend
        user_info = {
            "id": user_data.get("id"),
            "login": user_data.get("login"),
            "name": user_data.get("name") or user_data.get("login"),
            "email": primary_email or f"{user_data.get('login')}@github.com",
            "avatar_url": user_data.get("avatar_url"),
            "access_token": access_token
        }
        
        encoded_user = urlencode({"user": json.dumps(user_info)})
        return RedirectResponse(f"{FRONTEND_URL}/auth/callback?{encoded_user}")


@app.get("/api/repos")
async def get_repos(request: Request):
    """Fetch user's repositories (public and private)"""
    authorization = request.headers.get("Authorization")
    
    if not authorization:
        return {"error": "No authorization token provided", "repos": []}
    
    # Extract token from "Bearer <token>" format
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    
    async with httpx.AsyncClient() as client:
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        # Fetch all repos (includes private if token has repo scope)
        repos_response = await client.get(
            "https://api.github.com/user/repos",
            headers=headers,
            params={
                "visibility": "all",
                "affiliation": "owner,collaborator,organization_member",
                "sort": "updated",
                "per_page": 100
            }
        )
        
        if repos_response.status_code != 200:
            return {"error": "Failed to fetch repos", "repos": []}
        
        repos_data = repos_response.json()
        
        # Format response
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


# ============== Git Operations API ==============

from git_ops import clone_repo, pull_repo, list_files, read_file, is_cloned, delete_repo, search_files, get_commits, get_branches, checkout_branch


@app.post("/api/git/clone")
async def api_clone_repo(request: Request):
    """Clone a repository from GitHub."""
    try:
        body = await request.json()
        clone_url = body.get("clone_url")
        access_token = body.get("access_token")
        user_id = body.get("user_id")
        repo_name = body.get("repo_name")
        
        if not all([clone_url, access_token, user_id, repo_name]):
            return {"status": "error", "message": "Missing required fields"}
        
        result = clone_repo(clone_url, access_token, str(user_id), repo_name)
        return result
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/api/git/pull")
async def api_pull_repo(request: Request):
    """Pull latest changes for a repository."""
    try:
        body = await request.json()
        user_id = body.get("user_id")
        repo_name = body.get("repo_name")
        
        if not all([user_id, repo_name]):
            return {"status": "error", "message": "Missing required fields"}
        
        result = pull_repo(str(user_id), repo_name)
        return result
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/api/git/files")
async def api_list_files(request: Request, user_id: str, repo_name: str, path: str = ""):
    """List files in a cloned repository."""
    result = list_files(user_id, repo_name, path)
    return result


@app.get("/api/git/file")
async def api_read_file(request: Request, user_id: str, repo_name: str, path: str):
    """Read a file from a cloned repository."""
    result = read_file(user_id, repo_name, path)
    return result


@app.get("/api/git/status")
async def api_repo_status(user_id: str, repo_name: str):
    """Check if a repository is cloned."""
    return {
        "cloned": is_cloned(user_id, repo_name)
    }


@app.delete("/api/git/repo")
async def api_delete_repo(request: Request):
    """Delete a cloned repository."""
    try:
        body = await request.json()
        user_id = body.get("user_id")
        repo_name = body.get("repo_name")
        
        if not all([user_id, repo_name]):
            return {"status": "error", "message": "Missing required fields"}
        
        result = delete_repo(str(user_id), repo_name)
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
    """Search for files and content within a cloned repository."""
    if not query or len(query) < 2:
        return {"status": "error", "message": "Query must be at least 2 characters", "results": []}
    
    result = search_files(user_id, repo_name, query, content, min(max_results, 100))
    return result


@app.get("/api/git/commits")
async def api_get_commits(
    user_id: str,
    repo_name: str,
    max_count: int = 50
):
    """Get commit history for a cloned repository."""
    result = get_commits(user_id, repo_name, min(max_count, 100))
    return result


@app.get("/api/git/branches")
async def api_get_branches(
    user_id: str,
    repo_name: str
):
    """Get all branches for a cloned repository."""
    result = get_branches(user_id, repo_name)
    return result


@app.post("/api/git/checkout")
async def api_checkout_branch(request: Request):
    """Checkout a specific branch."""
    try:
        body = await request.json()
        user_id = body.get("user_id")
        repo_name = body.get("repo_name")
        branch_name = body.get("branch_name")
        
        if not all([user_id, repo_name, branch_name]):
            return {"status": "error", "message": "Missing required fields"}
        
        result = checkout_branch(user_id, repo_name, branch_name)
        return result
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ============== GitHub Issues & PRs API ==============

@app.get("/api/github/issues")
async def api_get_issues(request: Request, owner: str, repo: str, state: str = "open"):
    """Get issues for a repository from GitHub."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return {"status": "error", "message": "No authorization token", "issues": []}
    
    token = auth_header.replace("Bearer ", "")
    
    try:
        response = requests.get(
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
        
        # Filter out pull requests (they also appear in issues endpoint)
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
            if "pull_request" not in issue
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
    """Get pull requests for a repository from GitHub."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return {"status": "error", "message": "No authorization token", "pulls": []}
    
    token = auth_header.replace("Bearer ", "")
    
    try:
        response = requests.get(
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
                    "ref": pr["head"]["ref"],
                    "sha": pr["head"]["sha"][:7]
                },
                "base": {
                    "ref": pr["base"]["ref"]
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001)
