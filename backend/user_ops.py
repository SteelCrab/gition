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

import os
import logging
from typing import Any, Dict, Optional

from cryptography.fernet import Fernet

import database

logger = logging.getLogger(__name__)

# Load encryption key from environment. Keep this key secret!
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
if not ENCRYPTION_KEY:
    raise ValueError("ENCRYPTION_KEY environment variable not set.")
fernet = Fernet(ENCRYPTION_KEY.encode())


def _encrypt_token(token: str) -> bytes:
    """Encrypt a token using Fernet symmetric encryption."""
    return fernet.encrypt(token.encode())


def _decrypt_token(encrypted_token: bytes) -> str:
    """Decrypt a token using Fernet symmetric encryption."""
    return fernet.decrypt(encrypted_token).decode()


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
        # Encrypt access token before storage
        encrypted_token = _encrypt_token(access_token) if access_token else None
        
        # Check if user exists
        existing = await database.fetchone(
            "SELECT * FROM users WHERE github_id = %s",
            (github_id,)
        )
        
        if existing:
            # Update user data and access token if provided
            if access_token:
                await database.execute(
                    """UPDATE users SET access_token = %s, login = %s, 
                       name = %s, email = %s, avatar_url = %s 
                       WHERE github_id = %s""",
                    (encrypted_token, login, name, email, avatar_url, github_id)
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
            (github_id, login, name, email, avatar_url, encrypted_token)
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
