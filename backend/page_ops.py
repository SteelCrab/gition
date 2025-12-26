"""
==============================================================================
Branch Page Operations Module (page_ops.py)
==============================================================================
Description: Manages branch-specific pages stored locally in .gition directory

Main Features:
    - create_branch_page: Create a new page for a branch
    - get_branch_page: Read an existing branch page
    - update_branch_page: Update page content
    - list_branch_pages: List all pages for a repository
    - ensure_branch_page: Create page if not exists

Data Storage:
    Pages are stored in: /repos/{user_id}/{repo_name}/.gition/pages/{branch_name}.json
    
Data Structure:
    {
        "id": "uuid",
        "branch_name": "main",
        "title": "main",
        "content": "",
        "created_at": "ISO timestamp",
        "updated_at": "ISO timestamp",
        "metadata": {
            "created_from_branch": true,
            "branch_exists": true
        }
    }

Note:
    - .gition/ directory is in .gitignore, so pages are local-only
    - Pages persist even after branch deletion (historical data)
==============================================================================
"""

import os
import json
import uuid
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List

# Configure logging
logger = logging.getLogger(__name__)

# Base path for cloned repositories
REPOS_BASE_PATH = os.getenv("REPOS_PATH", "/repos")

# Page directory name
GITION_DIR = ".gition"
PAGES_DIR = "pages"


def _get_gition_path(user_id: str, repo_name: str) -> Path:
    """
    Get the .gition directory path for a repository.
    
    Args:
        user_id: User's GitHub ID
        repo_name: Repository name
        
    Returns:
        Path: Path to .gition directory
    """
    if not user_id or not repo_name:
        raise ValueError("Invalid user_id or repo_name")
    
    # Sanitize: Reject path separators in components
    if any(sep in str(user_id) for sep in ('/', '\\', '..')):
        raise ValueError(f"Invalid user_id: {user_id}")
    if any(sep in repo_name for sep in ('/', '\\', '..')):
        raise ValueError(f"Invalid repo_name: {repo_name}")
    
    base_path = Path(REPOS_BASE_PATH).resolve()
    gition_path = (base_path / str(user_id) / repo_name / GITION_DIR).resolve()
    
    # Verify path is still within REPOS_BASE_PATH
    if not gition_path.is_relative_to(base_path):
        raise ValueError("Path traversal detected")
    
    return gition_path


def _get_page_path(user_id: str, repo_name: str, branch_name: str) -> Path:
    """
    Get the file path for a branch page.
    
    Args:
        user_id: User's GitHub ID
        repo_name: Repository name
        branch_name: Branch name
        
    Returns:
        Path: Path to the page JSON file
    """
    if not branch_name:
        raise ValueError("Invalid branch_name")
    
    # Sanitize branch name for filesystem (replace / with _)
    safe_branch = branch_name.replace('/', '_').replace('\\', '_')
    if '..' in safe_branch:
        raise ValueError(f"Invalid branch_name: {branch_name}")
    
    gition_path = _get_gition_path(user_id, repo_name)
    return gition_path / PAGES_DIR / f"{safe_branch}.json"


def _ensure_pages_dir(user_id: str, repo_name: str) -> Path:
    """
    Ensure the pages directory exists.
    
    Args:
        user_id: User's GitHub ID
        repo_name: Repository name
        
    Returns:
        Path: Path to the pages directory
    """
    pages_path = _get_gition_path(user_id, repo_name) / PAGES_DIR
    pages_path.mkdir(parents=True, exist_ok=True)
    return pages_path


def create_branch_page(
    user_id: str,
    repo_name: str,
    branch_name: str,
    title: Optional[str] = None,
    content: str = ""
) -> Dict[str, Any]:
    """
    Create a new page for a branch.
    
    Args:
        user_id: User's GitHub ID
        repo_name: Repository name
        branch_name: Branch name
        title: Page title (defaults to branch name)
        content: Initial content
        
    Returns:
        Dict:
            - status: "success" | "exists" | "error"
            - page: Page data (on success)
            - message: Status message
    """
    try:
        page_path = _get_page_path(user_id, repo_name, branch_name)
        
        # Check if page already exists
        if page_path.exists():
            return {
                "status": "exists",
                "message": f"Page for branch '{branch_name}' already exists",
                "page": json.loads(page_path.read_text(encoding='utf-8'))
            }
        
        # Ensure directory exists
        _ensure_pages_dir(user_id, repo_name)
        
        # Create page data
        now = datetime.now(timezone.utc).isoformat()
        page_data = {
            "id": str(uuid.uuid4()),
            "branch_name": branch_name,
            "title": title or branch_name,
            "content": content,
            "created_at": now,
            "updated_at": now,
            "metadata": {
                "created_from_branch": True,
                "branch_exists": True
            }
        }
        
        # Write to file
        page_path.write_text(json.dumps(page_data, indent=2, ensure_ascii=False), encoding='utf-8')
        logger.info(f"Created page for branch '{branch_name}' in {repo_name}")
        
        return {
            "status": "success",
            "message": f"Page created for branch '{branch_name}'",
            "page": page_data
        }
    except Exception as e:
        logger.exception(f"Failed to create page for branch '{branch_name}': {e}")
        return {
            "status": "error",
            "message": str(e),
            "page": None
        }


def get_branch_page(
    user_id: str,
    repo_name: str,
    branch_name: str
) -> Dict[str, Any]:
    """
    Get a branch page.
    
    Args:
        user_id: User's GitHub ID
        repo_name: Repository name
        branch_name: Branch name
        
    Returns:
        Dict:
            - status: "success" | "not_found" | "error"
            - page: Page data (on success)
            - message: Status message
    """
    try:
        page_path = _get_page_path(user_id, repo_name, branch_name)
        
        if not page_path.exists():
            return {
                "status": "not_found",
                "message": f"Page for branch '{branch_name}' not found",
                "page": None
            }
        
        page_data = json.loads(page_path.read_text(encoding='utf-8'))
        return {
            "status": "success",
            "message": "Page retrieved successfully",
            "page": page_data
        }
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in page file for '{branch_name}': {e}")
        return {
            "status": "error",
            "message": "Page file is corrupted",
            "page": None
        }
    except Exception as e:
        logger.exception(f"Failed to get page for branch '{branch_name}': {e}")
        return {
            "status": "error",
            "message": str(e),
            "page": None
        }


def update_branch_page(
    user_id: str,
    repo_name: str,
    branch_name: str,
    title: Optional[str] = None,
    content: Optional[str] = None
) -> Dict[str, Any]:
    """
    Update a branch page.
    
    Args:
        user_id: User's GitHub ID
        repo_name: Repository name
        branch_name: Branch name
        title: New title (optional)
        content: New content (optional)
        
    Returns:
        Dict:
            - status: "success" | "not_found" | "error"
            - page: Updated page data (on success)
            - message: Status message
    """
    try:
        page_path = _get_page_path(user_id, repo_name, branch_name)
        
        if not page_path.exists():
            return {
                "status": "not_found",
                "message": f"Page for branch '{branch_name}' not found",
                "page": None
            }
        
        # Read existing page
        page_data = json.loads(page_path.read_text(encoding='utf-8'))
        
        # Update fields
        if title is not None:
            page_data["title"] = title
        if content is not None:
            page_data["content"] = content
        page_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        # Write back
        page_path.write_text(json.dumps(page_data, indent=2, ensure_ascii=False), encoding='utf-8')
        logger.info(f"Updated page for branch '{branch_name}' in {repo_name}")
        
        return {
            "status": "success",
            "message": "Page updated successfully",
            "page": page_data
        }
    except Exception as e:
        logger.exception(f"Failed to update page for branch '{branch_name}': {e}")
        return {
            "status": "error",
            "message": str(e),
            "page": None
        }


def list_branch_pages(user_id: str, repo_name: str) -> Dict[str, Any]:
    """
    List all branch pages for a repository.
    
    Args:
        user_id: User's GitHub ID
        repo_name: Repository name
        
    Returns:
        Dict:
            - status: "success" | "error"
            - pages: List of page summaries
            - total: Total count
    """
    try:
        pages_dir = _get_gition_path(user_id, repo_name) / PAGES_DIR
        
        if not pages_dir.exists():
            return {
                "status": "success",
                "pages": [],
                "total": 0
            }
        
        pages: List[Dict[str, Any]] = []
        for page_file in pages_dir.glob("*.json"):
            try:
                page_data = json.loads(page_file.read_text(encoding='utf-8'))
                pages.append({
                    "id": page_data.get("id"),
                    "branch_name": page_data.get("branch_name"),
                    "title": page_data.get("title"),
                    "updated_at": page_data.get("updated_at"),
                    "created_at": page_data.get("created_at")
                })
            except json.JSONDecodeError:
                logger.warning(f"Skipping corrupted page file: {page_file}")
                continue
        
        # Sort by updated_at descending
        pages.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
        
        return {
            "status": "success",
            "pages": pages,
            "total": len(pages)
        }
    except Exception as e:
        logger.exception(f"Failed to list pages for {repo_name}: {e}")
        return {
            "status": "error",
            "message": str(e),
            "pages": [],
            "total": 0
        }


def ensure_branch_page(
    user_id: str,
    repo_name: str,
    branch_name: str
) -> Dict[str, Any]:
    """
    Ensure a page exists for a branch (create if not exists).
    
    This is the main function called during branch checkout.
    
    Args:
        user_id: User's GitHub ID
        repo_name: Repository name
        branch_name: Branch name
        
    Returns:
        Dict:
            - status: "success" | "exists" | "error"
            - page: Page data
            - created: True if newly created
    """
    result = get_branch_page(user_id, repo_name, branch_name)
    
    if result["status"] == "success":
        return {
            "status": "exists",
            "page": result["page"],
            "created": False
        }
    
    if result["status"] == "not_found":
        create_result = create_branch_page(user_id, repo_name, branch_name)
        if create_result["status"] in ("success", "exists"):
            return {
                "status": "success",
                "page": create_result["page"],
                "created": create_result["status"] == "success"
            }
        return create_result
    
    return result


def delete_branch_page(
    user_id: str,
    repo_name: str,
    branch_name: str
) -> Dict[str, Any]:
    """
    Delete a branch page.
    
    Note: This function is provided for manual cleanup.
    Pages are NOT auto-deleted when branches are deleted.
    
    Args:
        user_id: User's GitHub ID
        repo_name: Repository name
        branch_name: Branch name
        
    Returns:
        Dict:
            - status: "success" | "not_found" | "error"
            - message: Status message
    """
    try:
        page_path = _get_page_path(user_id, repo_name, branch_name)
        
        if not page_path.exists():
            return {
                "status": "not_found",
                "message": f"Page for branch '{branch_name}' not found"
            }
        
        page_path.unlink()
        logger.info(f"Deleted page for branch '{branch_name}' in {repo_name}")
        
        return {
            "status": "success",
            "message": f"Page for branch '{branch_name}' deleted"
        }
    except Exception as e:
        logger.exception(f"Failed to delete page for branch '{branch_name}': {e}")
        return {
            "status": "error",
            "message": str(e)
        }
