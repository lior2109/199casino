# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is a static HTML landing page for "199 Casino". The entire application is a single `index.html` file with inline CSS. There is no build system, no package manager, and no runtime dependencies.

### Running the application

Serve the site locally with Python's built-in HTTP server:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000/index.html` in a browser.

### CI

The GitHub Actions workflow (`.github/workflows/jekyll-docker.yml`) builds the site using a Jekyll Docker container. There are no local Jekyll config files; the workflow runs on pushes/PRs to `main`.

### Notes

- No linter, test framework, or build tool is configured. Validation is manual (open in browser).
- No `.env` files, secrets, or external services are required.
