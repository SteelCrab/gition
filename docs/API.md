# Gition API Reference

Base URL: `http://localhost/api`

## Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health status |

## Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/github` | Redirect to GitHub OAuth |
| GET | `/auth/github/callback` | OAuth callback handler |

## Repositories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/repos` | List user repositories |

**Headers Required:**
```
Authorization: Bearer <github_token>
```

## Git Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/git/clone` | Clone a repository |
| POST | `/api/git/pull` | Pull latest changes |
| GET | `/api/git/files` | List files in repo |
| GET | `/api/git/file` | Get file content |
| GET | `/api/git/status` | Check clone status |
| DELETE | `/api/git/repo` | Delete cloned repo |
| GET | `/api/git/search` | Search within files |
| GET | `/api/git/commits` | Get commit history |
| GET | `/api/git/branches` | List branches |
| POST | `/api/git/checkout` | Switch branch |

### Common Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `user_id` | string | User login or ID |
| `repo_name` | string | Repository name |
| `path` | string | File/directory path |

## GitHub API (Proxy)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/github/issues` | Get repository issues |
| GET | `/api/github/pulls` | Get pull requests |
