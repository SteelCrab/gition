"""
==============================================================================
Repository Operations Module (repo_ops.py)
==============================================================================
Description: MySQL-based repository management operations

Main Features:
    - sync_user_repos: Sync repositories from GitHub to database
    - get_repo_by_name: Get repository by name
    - get_repo_id: Get repository internal ID
==============================================================================
"""

import logging
from typing import Any, Dict, List, Optional

import database

logger = logging.getLogger(__name__)


async def sync_user_repos(user_id: int, repos: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Sync user's repositories from GitHub to database.
    
    Args:
        user_id: Internal user ID
        repos: List of repository data from GitHub API
        
    Returns:
        Dict with sync result
    """
    try:
        synced = 0
        for repo in repos:
            await database.execute(
                """INSERT INTO repositories 
                   (user_id, github_repo_id, name, full_name, description, 
                    is_private, html_url, clone_url, ssh_url, language, 
                    stargazers_count, default_branch)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                   ON DUPLICATE KEY UPDATE
                   name = VALUES(name),
                   full_name = VALUES(full_name),
                   description = VALUES(description),
                   is_private = VALUES(is_private),
                   html_url = VALUES(html_url),
                   clone_url = VALUES(clone_url),
                   ssh_url = VALUES(ssh_url),
                   language = VALUES(language),
                   stargazers_count = VALUES(stargazers_count),
                   default_branch = VALUES(default_branch),
                   synced_at = CURRENT_TIMESTAMP""",
                (
                    user_id,
                    repo.get("id"),
                    repo.get("name"),
                    repo.get("full_name"),
                    repo.get("description"),
                    repo.get("private", False),
                    repo.get("html_url"),
                    repo.get("clone_url"),
                    repo.get("ssh_url"),
                    repo.get("language"),
                    repo.get("stargazers_count", 0),
                    repo.get("default_branch", "main"),
                )
            )
            synced += 1
        
        logger.info(f"Synced {synced} repositories for user_id={user_id}")
        return {"status": "success", "synced": synced}
        
    except Exception as e:
        logger.exception(f"Failed to sync_user_repos: {e}")
        raise


async def get_repo_by_name(user_id: int, repo_name: str) -> Optional[Dict[str, Any]]:
    """
    Get repository by name for a user.
    
    Args:
        user_id: Internal user ID
        repo_name: Repository name
        
    Returns:
        Repository dict or None
    """
    return await database.fetchone(
        "SELECT * FROM repositories WHERE user_id = %s AND name = %s",
        (user_id, repo_name)
    )


async def get_repo_id(user_id: int, repo_name: str) -> Optional[int]:
    """
    Get repository internal ID.
    
    Args:
        user_id: Internal user ID
        repo_name: Repository name
        
    Returns:
        Repository ID (int) or None
    """
    result = await database.fetchone(
        "SELECT id FROM repositories WHERE user_id = %s AND name = %s",
        (user_id, repo_name)
    )
    return result["id"] if result else None


async def get_user_repos(user_id: int) -> List[Dict[str, Any]]:
    """
    Get all repositories for a user.
    
    Args:
        user_id: Internal user ID
        
    Returns:
        List of repository dicts
    """
    return await database.fetchall(
        "SELECT * FROM repositories WHERE user_id = %s ORDER BY updated_at DESC",
        (user_id,)
    )


async def ensure_repo(
    user_id: int,
    github_repo_id: int,
    name: str,
    full_name: str,
    **kwargs
) -> int:
    """
    Ensure repository exists in database, create if not.
    Returns the repository internal ID.
    
    Args:
        user_id: Internal user ID
        github_repo_id: GitHub repository ID
        name: Repository name
        full_name: Full repository name (owner/name)
        **kwargs: Additional repository fields
        
    Returns:
        Repository internal ID
    """
    existing = await database.fetchone(
        "SELECT id FROM repositories WHERE user_id = %s AND github_repo_id = %s",
        (user_id, github_repo_id)
    )
    
    if existing:
        return existing["id"]
    
    # Insert new repository
    repo_id = await database.execute(
        """INSERT INTO repositories 
           (user_id, github_repo_id, name, full_name, description,
            is_private, html_url, clone_url, ssh_url, language,
            stargazers_count, default_branch)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        (
            user_id,
            github_repo_id,
            name,
            full_name,
            kwargs.get("description"),
            kwargs.get("private", False),
            kwargs.get("html_url"),
            kwargs.get("clone_url"),
            kwargs.get("ssh_url"),
            kwargs.get("language"),
            kwargs.get("stargazers_count", 0),
            kwargs.get("default_branch", "main"),
        )
    )
    
    logger.info(f"Created repository: {full_name} (id={repo_id})")
    return repo_id
