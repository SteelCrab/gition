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
# Database configuration from environment
DB_CONFIG = {
    "user": os.getenv("MYSQL_USER", "pista"),
    "password": os.getenv("MYSQL_PASSWORD", "pista"),
    "db": os.getenv("MYSQL_DATABASE", "gition"),
    "charset": "utf8mb4",
    "autocommit": True,
}

DB_READ_HOST = os.getenv("MYSQL_READ_HOST", "mysql")
DB_WRITE_HOST = os.getenv("MYSQL_WRITE_HOST", "mysql")
DB_PORT = int(os.getenv("MYSQL_PORT", "3306"))

# Global connection pools
_read_pool: Optional[aiomysql.Pool] = None
_write_pool: Optional[aiomysql.Pool] = None


async def init_pool(min_size: int = 1, max_size: int = 10) -> None:
    """
    Initialize the database connection pools (Read and Write).
    
    Args:
        min_size: Minimum number of connections in pool
        max_size: Maximum number of connections in pool
    """
    global _read_pool, _write_pool
    
    if _read_pool is not None or _write_pool is not None:
        logger.warning("Pools already initialized")
        return
    
    try:
        # Initialize Write Pool
        _write_pool = await aiomysql.create_pool(
            host=DB_WRITE_HOST,
            port=DB_PORT,
            minsize=min_size,
            maxsize=max_size,
            **DB_CONFIG
        )
        logger.info(f"Write pool initialized: {DB_WRITE_HOST}:{DB_PORT}/{DB_CONFIG['db']}")

        # Initialize Read Pool
        _read_pool = await aiomysql.create_pool(
            host=DB_READ_HOST,
            port=DB_PORT,
            minsize=min_size,
            maxsize=max_size,
            **DB_CONFIG
        )
        logger.info(f"Read pool initialized: {DB_READ_HOST}:{DB_PORT}/{DB_CONFIG['db']}")
        
    except Exception as e:
        logger.error(f"Failed to initialize database pools: {e}")
        # Clean up if one failed
        if _write_pool:
            _write_pool.close()
            await _write_pool.wait_closed()
        if _read_pool:
            _read_pool.close()
            await _read_pool.wait_closed()
        raise


async def close_pool() -> None:
    """
    Close the database connection pools.
    """
    global _read_pool, _write_pool
    
    if _read_pool:
        _read_pool.close()
        await _read_pool.wait_closed()
        _read_pool = None
        logger.info("Read pool closed")

    if _write_pool:
        _write_pool.close()
        await _write_pool.wait_closed()
        _write_pool = None
        logger.info("Write pool closed")


def get_pool(write: bool = False) -> aiomysql.Pool:
    """
    Get the connection pool.
    
    Args:
        write: If True, returns the Write pool. Otherwise, returns the Read pool.

    Returns:
        aiomysql.Pool: The connection pool
        
    Raises:
        RuntimeError: If pool is not initialized
    """
    pool = _write_pool if write else _read_pool
    if pool is None:
        raise RuntimeError(f"{'Write' if write else 'Read'} database pool not initialized. Call init_pool() first.")
    return pool


@asynccontextmanager
async def get_connection(write: bool = False):
    """
    Context manager for acquiring a database connection.
    
    Args:
        write: If True, acquires a connection from the Write pool.

    Usage:
        async with get_connection(write=True) as conn:
            async with conn.cursor() as cur:
                await cur.execute("INSERT INTO users ...")
    
    Yields:
        aiomysql.Connection: Database connection
    """
    pool = get_pool(write)
    async with pool.acquire() as conn:
        yield conn


@asynccontextmanager
async def get_cursor(dict_cursor: bool = True, write: bool = False):
    """
    Context manager for acquiring a database cursor.
    
    Args:
        dict_cursor: If True, use DictCursor for dict-like results
        write: If True, uses the Write pool.
    
    Usage:
        async with get_cursor() as cur:
            await cur.execute("SELECT * FROM users WHERE id = %s", (1,))
            result = await cur.fetchone()
    
    Yields:
        aiomysql.Cursor: Database cursor
    """
    cursor_class = aiomysql.DictCursor if dict_cursor else aiomysql.Cursor
    async with get_connection(write) as conn:
        async with conn.cursor(cursor_class) as cur:
            yield cur


async def execute(
    query: str, 
    args: Optional[Tuple] = None,
    fetch: Optional[str] = None,
    use_write_pool: bool = True
) -> Any:
    """
    Execute a query and optionally fetch results.
    Defaults to Write pool for safety unless it's a pure fetch operation.
    
    Args:
        query: SQL query string
        args: Query parameters
        fetch: "one" for fetchone, "all" for fetchall, None for no fetch
        use_write_pool: Whether to use the write pool (default: True for generic execute)
        
    Returns:
        Query result based on fetch parameter
    """
    # If explicitly fetching, default to read pool usually, but allow override
    # If just executing (INSERT/UPDATE), default to write pool
    
    async with get_cursor(write=use_write_pool) as cur:
        await cur.execute(query, args or ())
        
        if fetch == "one":
            return await cur.fetchone()
        elif fetch == "all":
            return await cur.fetchall()
        else:
            return cur.lastrowid


async def fetchone(query: str, args: Optional[Tuple] = None, use_write_pool: bool = False) -> Optional[Dict[str, Any]]:
    """
    Execute a query and fetch one result.
    Defaults to Read pool.
    
    Args:
        query: SQL query string
        args: Query parameters
        use_write_pool: Force use of write pool (e.g. for read-after-write consistency)
        
    Returns:
        Dict result or None
    """
    return await execute(query, args, fetch="one", use_write_pool=use_write_pool)


async def fetchall(query: str, args: Optional[Tuple] = None, use_write_pool: bool = False) -> List[Dict[str, Any]]:
    """
    Execute a query and fetch all results.
    Defaults to Read pool.
    
    Args:
        query: SQL query string
        args: Query parameters
        use_write_pool: Force use of write pool (e.g. for read-after-write consistency)
        
    Returns:
        List of dict results
    """
    return await execute(query, args, fetch="all", use_write_pool=use_write_pool)
