# MCP Cloudflare (template kbouffe)

Serveur MCP minimal pour piloter Cloudflare via `wrangler` depuis un agent IDE.

## Installation

```bash
cd tools/mcp-cloudflare
npm install
```

## Lancer en local

```bash
npm start
```

## Outils exposés

- `cf_workers_deploy`
- `cf_r2_bucket_create`
- `cf_r2_bucket_list`
- `cf_workers_deploy`
- `cf_r2_bucket_create`
- `cf_r2_bucket_list`
- `cf_secret_put`

## Pré-requis

- `wrangler` disponible (`npx wrangler --version`)
- Login fait: `npx wrangler login`
- Un `wrangler.toml` dans le dossier ciblé (par exemple `apps/web-dashboard`)

## Exemples de payloads

```json
{ "name": "cf_r2_bucket_create", "arguments": { "bucketName": "kbouffe-images", "cwd": "apps/web-dashboard" } }
```
