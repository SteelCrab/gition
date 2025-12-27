"""
==============================================================================
Database Connection Module (database.py)
==============================================================================
Description: Manages MySQL database connection pool using aiomysql

Main Features:
    - init_pool: Initialize connection pool on app startup
    - close_pool: Close connection pool on app shutdown
    - get_connection: Context manager for acquiring connections
    - execute: Helper for executing queries
    - fetchone/fetchall: Helpers for fetching results

Environment Variables:
    - MYSQL_HOST: Database host (default: mysql)
    - MYSQL_PORT: Database port (default: 3306)
    - MYSQL_USER: Database user (default: pista)
    - MYSQL_PASSWORD: Database password
    - MYSQL_DATABASE: Database name (default: gition)
==============================================================================
"""

import os
import logging
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional, Tuple

import aiomysql

# Configure logging
logger = logging.getLogger(__name__)

# Database configuration from environment
DB_CONFIG = {
    "host": os.getenv("MYSQL_HOST", "mysql"),
    "port": int(os.getenv("MYSQL_PORT", "3306")),
    "user": os.getenv("MYSQL_USER", "pista"),
    "password": os.getenv("MYSQL_PASSWORD"),  # Required - no default for security
    "db": os.getenv("MYSQL_DATABASE", "gition"),
    "charset": "utf8mb4",
    "autocommit": True,
}

# Global connection pool
_pool: Optional[aiomysql.Pool] = None


async def init_pool(min_size: int = 1, max_size: int = 10) -> aiomysql.Pool:
    """
    Initialize the database connection pool.
    
    Args:
        min_size: Minimum number of connections in pool
        max_size: Maximum number of connections in pool
        
    Returns:
        aiomysql.Pool: The connection pool
    """
    global _pool
    
    if _pool is not None:
        logger.warning("Pool already initialized")
        return _pool
    
    try:
        _pool = await aiomysql.create_pool(
            minsize=min_size,
            maxsize=max_size,
            **DB_CONFIG
        )
        logger.info(f"Database pool initialized: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['db']}")
        return _pool
    except Exception as e:
        logger.exception("Failed to initialize database pool")
        raise


async def close_pool() -> None:
    """
    Close the database connection pool.
    """
    global _pool
    
    if _pool is None:
        logger.warning("Pool not initialized")
        return
    
    _pool.close()
    await _pool.wait_closed()
    _pool = None
    logger.info("Database pool closed")


def get_pool() -> aiomysql.Pool:
    """
    Get the connection pool.
    
    Returns:
        aiomysql.Pool: The connection pool
        
    Raises:
        RuntimeError: If pool is not initialized
    """
    if _pool is None:
        raise RuntimeError("Database pool not initialized. Call init_pool() first.")
    return _pool


@asynccontextmanager
async def get_connection():
    """
    Context manager for acquiring a database connection.
    
    Usage:
        async with get_connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute("SELECT * FROM users")
                result = await cur.fetchall()
    
    Yields:
        aiomysql.Connection: Database connection
    """
    pool = get_pool()
    async with pool.acquire() as conn:
        yield conn


@asynccontextmanager
async def get_cursor(dict_cursor: bool = True):
    """
    Context manager for acquiring a database cursor.
    
    Args:
        dict_cursor: If True, use DictCursor for dict-like results
    
    Usage:
        async with get_cursor() as cur:
            await cur.execute("SELECT * FROM users WHERE id = %s", (1,))
            result = await cur.fetchone()
    
    Yields:
        aiomysql.Cursor: Database cursor
    """
    cursor_class = aiomysql.DictCursor if dict_cursor else aiomysql.Cursor
    async with get_connection() as conn:
        async with conn.cursor(cursor_class) as cur:
            yield cur


async def execute(
    query: str, 
    args: Optional[Tuple] = None,
    fetch: Optional[str] = None
) -> Any:
    """
    Execute a query and optionally fetch results.
    
    Args:
        query: SQL query string
        args: Query parameters
        fetch: "one" for fetchone, "all" for fetchall, None for no fetch
        
    Returns:
        Query result based on fetch parameter
    """
    async with get_cursor() as cur:
        await cur.execute(query, args or ())
        
        if fetch == "one":
            return await cur.fetchone()
        elif fetch == "all":
            return await cur.fetchall()
        else:
            return cur.lastrowid


async def fetchone(query: str, args: Optional[Tuple] = None) -> Optional[Dict[str, Any]]:
    """
    Execute a query and fetch one result.
    
    Args:
        query: SQL query string
        args: Query parameters
        
    Returns:
        Dict result or None
    """
    return await execute(query, args, fetch="one")


async def fetchall(query: str, args: Optional[Tuple] = None) -> List[Dict[str, Any]]:
    """
    Execute a query and fetch all results.
    
    Args:
        query: SQL query string
        args: Query parameters
        
    Returns:
        List of dict results
    """
    return await execute(query, args, fetch="all")
