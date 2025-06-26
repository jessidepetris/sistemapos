# Contributing Guidelines

Thank you for considering contributing to this project! This document describes the general workflow for contributing code and the basic expectations for pull requests.

## Setup
1. Install dependencies with `npm install`.
2. Ensure the TypeScript code compiles by running:
   ```bash
   npm run check
   ```

## Code Formatting
There is currently no automated formatter configured. Please follow the existing code style and keep formatting consistent with the surrounding files.

## Linting
This project does not yet include a linter. Rely on TypeScript's compiler checks (`npm run check`) to catch type errors and compile-time issues.

## Pull Request Process
1. Create a feature branch for your changes.
2. Make sure `npm run check` completes successfully before opening the pull request.
3. Submit a pull request targeting the `master` branch.
4. Provide a clear description of the problem being solved or feature implemented.
5. A maintainer will review your contribution and may request changes before merging.
