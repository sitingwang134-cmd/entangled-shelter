# Local Deployment

## Requirements

- Node.js 24 or newer
- npm

## Development

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production preview

```powershell
npm run build
npm run start
```

## Static export

```powershell
npm run build:static
```

The deployable site is written to `out/`. The root `wrangler.toml` points Cloudflare Pages at that directory. All media shipped in the static export is kept below the Cloudflare Pages 25 MiB per-file limit.

## Quality checks

```powershell
npm run lint
npm run typecheck
npm run build
```

The decision archive is browser-local: accepted answers are stored under `entangled-shelter:decisions:v1` in `localStorage`.
