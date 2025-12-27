"""
==============================================================================
User Operations Module (user_ops.py)
==============================================================================
Description: MySQL-based user management operations

Main Features:
    - get_or_create_user: Upsert user from GitHub OAuth data
    - get_user_by_login: Get user by GitHub login
    - get_user_by_github_id: Get user by GitHub ID
==============================================================================
"""

import logging
from typing import Any, Dict, Optional

import database

logger = logging.getLogger(__name__)


async def get_or_create_user(
    github_id: int,
    login: str,
    name: Optional[str] = None,
    email: Optional[str] = None,
    avatar_url: Optional[str] = None,
    access_token: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get existing user or create new one.
    
    Args:
        github_id: GitHub user ID
        login: GitHub login (username)
        name: User's display name
        email: User's email
        avatar_url: User's avatar URL
        access_token: GitHub access token
        
    Returns:
        Dict with user data and 'created' flag
    """
    try:
        # Check if user exists
        existing = await database.fetchone(
            "SELECT * FROM users WHERE github_id = %s",
            (github_id,)
        )
        
        if existing:
            # Update access token if provided
            if access_token:
                await database.execute(
                    """UPDATE users SET access_token = %s, login = %s, 
                       name = %s, email = %s, avatar_url = %s 
                       WHERE github_id = %s""",
                    (access_token, login, name, email, avatar_url, github_id)
                )
                # Refetch updated user
                existing = await database.fetchone(
                    "SELECT * FROM users WHERE github_id = %s",
                    (github_id,)
                )
            return {"user": existing, "created": False}
        
        # Create new user
        user_id = await database.execute(
            """INSERT INTO users (github_id, login, name, email, avatar_url, access_token)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (github_id, login, name, email, avatar_url, access_token)
        )
        
        user = await database.fetchone(
            "SELECT * FROM users WHERE id = %s", (user_id,)
        )
        
        logger.info(f"Created new user: {login} (id={user_id})")
        return {"user": user, "created": True}
        
    except Exception as e:
        logger.exception(f"Failed to get_or_create_user: {e}")
        raise


async def get_user_by_login(login: str) -> Optional[Dict[str, Any]]:
    """
    Get user by GitHub login.
    
    Args:
        login: GitHub login (username)
        
    Returns:
        User dict or None
    """
    return await database.fetchone(
        "SELECT * FROM users WHERE login = %s", (login,)
    )


async def get_user_by_github_id(github_id: int) -> Optional[Dict[str, Any]]:
    """
    Get user by GitHub ID.
    
    Args:
        github_id: GitHub user ID
        
    Returns:
        User dict or None
    """
    return await database.fetchone(
        "SELECT * FROM users WHERE github_id = %s", (github_id,)
    )


async def get_user_id_by_login(login: str) -> Optional[int]:
    """
    Get user's internal ID by GitHub login.
    
    Args:
        login: GitHub login (username)
        
    Returns:
        User ID (int) or None
    """
    result = await database.fetchone(
        "SELECT id FROM users WHERE login = %s", (login,)
    )
    return result["id"] if result else None
