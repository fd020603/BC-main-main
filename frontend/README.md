# Frontend

This frontend is the Korean-language Next.js interface for Border Checker.

## Run

```bash
npm ci
npm run dev
```

Default app URL:

```bash
http://127.0.0.1:3000
```

Backend base URL can be overridden with:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

## Main UI Areas

- hero and product framing
- legal-pack selector
- guided step-by-step input workspace
- merge preview and evaluation actions
- decision result and explainability panels
- pack metadata and disclaimer

## Verification

```bash
npm run lint
npm run build
```

For full project setup and backend instructions, see the repository root
`README.md`.
