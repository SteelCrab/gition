# Pre-commit Hooks

To ensure code quality and consistency before pushing to the repository, we use `pre-commit` hooks. These hooks run automated checks (linting, formatting, security scans) on your local machine every time you try to commit.

## Installation

1.  **Install pre-commit**:
    ```bash
    pip install pre-commit
    ```

2.  **Install the hooks**:
    Run this command in the root of the repository:
    ```bash
    pre-commit install
    ```

## Hooks Configuration

The configuration is defined in `.pre-commit-config.yaml`. Currently, we include:

- **Flake8**: Python linting.
- **ESLint**: JavaScript/React linting.
- **Gitleaks**: Scans for secrets and sensitive information.
- **Trailing Whitespace**: Removes unnecessary spaces at the end of lines.
- **Fix End of Files**: Ensures files end with a newline.

## Manual Run

You can run the hooks manually on all files at any time:
```bash
pre-commit run --all-files
```

## Benefits
- Catch errors early, before they reach CI.
- Maintain a clean and consistent codebase.
- Avoid "fix lint" commits.
