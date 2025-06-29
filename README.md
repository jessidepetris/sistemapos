# Sistema POS

This project contains a point-of-sale application with a React frontend and an Express backend.

## Environment variables

The server requires a `SESSION_SECRET` environment variable for managing user sessions. The
application will throw an error during startup if this variable is not defined.

## Development

Install dependencies and start the application in development mode:

```bash
npm install
npm run dev
```

The server listens on port `5000` by default.

### Products API

`GET /api/products` now accepts optional query parameters:

- `search`: filter products by name or description (case insensitive).
- `sort`: order results by `name` or `price`.

