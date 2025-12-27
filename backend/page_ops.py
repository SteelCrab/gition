"""
==============================================================================
Branch Page Operations Module (page_ops.py) - MySQL Version
==============================================================================
Description: Manages branch-specific pages stored in MySQL database

Main Features:
    - create_branch_page: Create a new page for a branch
    - get_branch_page: Read an existing branch page
    - update_branch_page: Update page content
    - list_branch_pages: List all pages for a repository
    - ensure_branch_page: Create page if not exists
    - delete_branch_page: Delete a branch page

Data Storage:
    Pages are stored in: branch_pages table
    
Data Structure:
    {
        "id": "uuid",
        "user_id": 1,
        "repo_id": 1,
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
==============================================================================
"""

import json
import uuid
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import database
import user_ops
import repo_ops

# Configure logging
logger = logging.getLogger(__name__)


async def _resolve_ids(
    user_login: str,
    repo_name: str
) -> tuple[Optional[int], Optional[int]]:
    """
    Resolve user_id and repo_id from login and repo_name.
    
    Args:
        user_login: GitHub login (username)
        repo_name: Repository name
        
    Returns:
        Tuple of (user_id, repo_id) or (None, None) if not found
    """
    user_id = await user_ops.get_user_id_by_login(user_login)
    if not user_id:
        return None, None
    
    repo_id = await repo_ops.get_repo_id(user_id, repo_name)
    return user_id, repo_id


async def create_branch_page(
    user_id: int,
    repo_id: int,
    branch_name: str,
    title: Optional[str] = None,
    content: str = ""
) -> Dict[str, Any]:
    """
    Create a new page for a branch.
    
    Args:
        user_id: Internal user ID
        repo_id: Internal repository ID
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
        # Check if page already exists
        existing = await database.fetchone(
            """SELECT * FROM branch_pages 
               WHERE user_id = %s AND repo_id = %s AND branch_name = %s""",
            (user_id, repo_id, branch_name)
        )
        
        if existing:
            return {
                "status": "exists",
                "message": f"Page for branch '{branch_name}' already exists",
                "page": _row_to_page(existing)
            }
        
        # Create page
        page_id = str(uuid.uuid4())
        metadata = json.dumps({
            "created_from_branch": True,
            "branch_exists": True
        })
        
        await database.execute(
            """INSERT INTO branch_pages 
               (id, user_id, repo_id, branch_name, title, content, metadata)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (page_id, user_id, repo_id, branch_name, title or branch_name, content, metadata)
        )
        
        # Fetch created page
        page = await database.fetchone(
            "SELECT * FROM branch_pages WHERE id = %s", (page_id,)
        )
        
        logger.info(f"Created page for branch '{branch_name}' (id={page_id})")
        
        return {
            "status": "success",
            "message": f"Page created for branch '{branch_name}'",
            "page": _row_to_page(page)
        }
        
    except Exception as e:
        logger.exception(f"Failed to create page for branch '{branch_name}': {e}")
        return {
            "status": "error",
            "message": str(e),
            "page": None
        }


async def get_branch_page(
    user_id: int,
    repo_id: int,
    branch_name: str
) -> Dict[str, Any]:
    """
    Get a branch page.
    
    Args:
        user_id: Internal user ID
        repo_id: Internal repository ID
        branch_name: Branch name
        
    Returns:
        Dict:
            - status: "success" | "not_found" | "error"
            - page: Page data (on success)
            - message: Status message
    """
    try:
        page = await database.fetchone(
            """SELECT * FROM branch_pages 
               WHERE user_id = %s AND repo_id = %s AND branch_name = %s""",
            (user_id, repo_id, branch_name)
        )
        
        if not page:
            return {
                "status": "not_found",
                "message": f"Page for branch '{branch_name}' not found",
                "page": None
            }
        
        return {
            "status": "success",
            "message": "Page retrieved successfully",
            "page": _row_to_page(page)
        }
        
    except Exception as e:
        logger.exception(f"Failed to get page for branch '{branch_name}': {e}")
        return {
            "status": "error",
            "message": str(e),
            "page": None
        }


async def update_branch_page(
    user_id: int,
    repo_id: int,
    branch_name: str,
    title: Optional[str] = None,
    content: Optional[str] = None
) -> Dict[str, Any]:
    """
    Update a branch page.
    
    Args:
        user_id: Internal user ID
        repo_id: Internal repository ID
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
        # Check if page exists
        existing = await database.fetchone(
            """SELECT * FROM branch_pages 
               WHERE user_id = %s AND repo_id = %s AND branch_name = %s""",
            (user_id, repo_id, branch_name)
        )
        
        if not existing:
            return {
                "status": "not_found",
                "message": f"Page for branch '{branch_name}' not found",
                "page": None
            }
        
        # Build update query
        updates = []
        params = []
        
        if title is not None:
            updates.append("title = %s")
            params.append(title)
        if content is not None:
            updates.append("content = %s")
            params.append(content)
        
        if not updates:
            return {
                "status": "success",
                "message": "No changes made",
                "page": _row_to_page(existing)
            }
        
        # Add WHERE clause params
        params.extend([user_id, repo_id, branch_name])
        
        await database.execute(
            f"""UPDATE branch_pages SET {', '.join(updates)}
                WHERE user_id = %s AND repo_id = %s AND branch_name = %s""",
            tuple(params)
        )
        
        # Fetch updated page
        page = await database.fetchone(
            """SELECT * FROM branch_pages 
               WHERE user_id = %s AND repo_id = %s AND branch_name = %s""",
            (user_id, repo_id, branch_name)
        )
        
        logger.info(f"Updated page for branch '{branch_name}'")
        
        return {
            "status": "success",
            "message": "Page updated successfully",
            "page": _row_to_page(page)
        }
        
    except Exception as e:
        logger.exception(f"Failed to update page for branch '{branch_name}': {e}")
        return {
            "status": "error",
            "message": str(e),
            "page": None
        }


async def list_branch_pages(user_id: int, repo_id: int) -> Dict[str, Any]:
    """
    List all branch pages for a repository.
    
    Args:
        user_id: Internal user ID
        repo_id: Internal repository ID
        
    Returns:
        Dict:
            - status: "success" | "error"
            - pages: List of page summaries
            - total: Total count
    """
    try:
        pages = await database.fetchall(
            """SELECT id, branch_name, title, created_at, updated_at
               FROM branch_pages 
               WHERE user_id = %s AND repo_id = %s
               ORDER BY updated_at DESC""",
            (user_id, repo_id)
        )
        
        return {
            "status": "success",
            "pages": [_row_to_page(p) for p in pages],
            "total": len(pages)
        }
        
    except Exception as e:
        logger.exception(f"Failed to list pages: {e}")
        return {
            "status": "error",
            "message": str(e),
            "pages": [],
            "total": 0
        }


async def ensure_branch_page(
    user_id: int,
    repo_id: int,
    branch_name: str
) -> Dict[str, Any]:
    """
    Ensure a page exists for a branch (create if not exists).
    
    This is the main function called during branch checkout.
    
    Args:
        user_id: Internal user ID
        repo_id: Internal repository ID
        branch_name: Branch name
        
    Returns:
        Dict:
            - status: "success" | "exists" | "error"
            - page: Page data
            - created: True if newly created
    """
    result = await get_branch_page(user_id, repo_id, branch_name)
    
    if result["status"] == "success":
        return {
            "status": "exists",
            "page": result["page"],
            "created": False
        }
    
    if result["status"] == "not_found":
        create_result = await create_branch_page(user_id, repo_id, branch_name)
        if create_result["status"] in ("success", "exists"):
            return {
                "status": "success",
                "page": create_result["page"],
                "created": create_result["status"] == "success"
            }
        return create_result
    
    return result


async def delete_branch_page(
    user_id: int,
    repo_id: int,
    branch_name: str
) -> Dict[str, Any]:
    """
    Delete a branch page.
    
    Note: This function is provided for manual cleanup.
    Pages are NOT auto-deleted when branches are deleted.
    
    Args:
        user_id: Internal user ID
        repo_id: Internal repository ID
        branch_name: Branch name
        
    Returns:
        Dict:
            - status: "success" | "not_found" | "error"
            - message: Status message
    """
    try:
        # Check if page exists
        existing = await database.fetchone(
            """SELECT id FROM branch_pages 
               WHERE user_id = %s AND repo_id = %s AND branch_name = %s""",
            (user_id, repo_id, branch_name)
        )
        
        if not existing:
            return {
                "status": "not_found",
                "message": f"Page for branch '{branch_name}' not found"
            }
        
        await database.execute(
            """DELETE FROM branch_pages 
               WHERE user_id = %s AND repo_id = %s AND branch_name = %s""",
            (user_id, repo_id, branch_name)
        )
        
        logger.info(f"Deleted page for branch '{branch_name}'")
        
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


def _row_to_page(row: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert database row to page dict.
    
    Handles datetime serialization and metadata parsing.
    """
    if not row:
        return None
    
    page = dict(row)
    
    # Convert datetime objects to ISO strings
    for key in ("created_at", "updated_at"):
        if key in page and page[key]:
            if hasattr(page[key], "isoformat"):
                page[key] = page[key].isoformat()
    
    # Parse metadata JSON
    if "metadata" in page and isinstance(page["metadata"], str):
        try:
            page["metadata"] = json.loads(page["metadata"])
        except json.JSONDecodeError:
            page["metadata"] = {}
    
    return page


# ==============================================================================
# Legacy API Compatibility Layer
# ==============================================================================
# These functions accept user_login (str) and repo_name (str) like the old API
# and resolve them to internal IDs internally.

async def create_branch_page_by_login(
    user_login: str,
    repo_name: str,
    branch_name: str,
    title: Optional[str] = None,
    content: str = ""
) -> Dict[str, Any]:
    """Legacy wrapper using login/repo_name instead of IDs."""
    user_id, repo_id = await _resolve_ids(user_login, repo_name)
    if not user_id or not repo_id:
        return {
            "status": "error",
            "message": "User or repository not found in database",
            "page": None
        }
    return await create_branch_page(user_id, repo_id, branch_name, title, content)


async def get_branch_page_by_login(
    user_login: str,
    repo_name: str,
    branch_name: str
) -> Dict[str, Any]:
    """Legacy wrapper using login/repo_name instead of IDs."""
    user_id, repo_id = await _resolve_ids(user_login, repo_name)
    if not user_id or not repo_id:
        return {
            "status": "not_found",
            "message": "User or repository not found in database",
            "page": None
        }
    return await get_branch_page(user_id, repo_id, branch_name)


async def update_branch_page_by_login(
    user_login: str,
    repo_name: str,
    branch_name: str,
    title: Optional[str] = None,
    content: Optional[str] = None
) -> Dict[str, Any]:
    """Legacy wrapper using login/repo_name instead of IDs."""
    user_id, repo_id = await _resolve_ids(user_login, repo_name)
    if not user_id or not repo_id:
        return {
            "status": "not_found",
            "message": "User or repository not found in database",
            "page": None
        }
    return await update_branch_page(user_id, repo_id, branch_name, title, content)


async def list_branch_pages_by_login(
    user_login: str,
    repo_name: str
) -> Dict[str, Any]:
    """Legacy wrapper using login/repo_name instead of IDs."""
    user_id, repo_id = await _resolve_ids(user_login, repo_name)
    if not user_id or not repo_id:
        return {
            "status": "error",
            "message": "User or repository not found in database",
            "pages": [],
            "total": 0
        }
    return await list_branch_pages(user_id, repo_id)


async def ensure_branch_page_by_login(
    user_login: str,
    repo_name: str,
    branch_name: str
) -> Dict[str, Any]:
    """Legacy wrapper using login/repo_name instead of IDs."""
    user_id, repo_id = await _resolve_ids(user_login, repo_name)
    if not user_id or not repo_id:
        return {
            "status": "error",
            "message": "User or repository not found in database",
            "page": None
        }
    return await ensure_branch_page(user_id, repo_id, branch_name)


async def delete_branch_page_by_login(
    user_login: str,
    repo_name: str,
    branch_name: str
) -> Dict[str, Any]:
    """Legacy wrapper using login/repo_name instead of IDs."""
    user_id, repo_id = await _resolve_ids(user_login, repo_name)
    if not user_id or not repo_id:
        return {
            "status": "not_found",
            "message": "User or repository not found in database"
        }
    return await delete_branch_page(user_id, repo_id, branch_name)

