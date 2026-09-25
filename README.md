# Sistema de Vendas

O projeto possui frontend e backend separados:

- `front/`: frontend estático, servido por qualquer servidor de arquivos.
- `back/`: backend Express, rotas, sessão e dados locais.

## Backend local

```powershell
Set-Location back
npm install
$env:FRONTEND_ORIGIN = "http://localhost:5500"
$env:NODE_ENV = "development"
npm start
```

O backend fica em `http://localhost:3000`.

## Frontend local

Sirva a pasta `front/` em `http://localhost:5500`.

A API padrão usada pelo frontend é `http://localhost:3000`. Para outro endereço, defina `window.TOCA_API_URL` antes de carregar `front/js/app-config.js`.

## Produção

Configurações mínimas:

- `FRONTEND_ORIGIN`: origem exata do frontend, sem barra final.
- `TOCA_API_URL`: URL pública do backend usada pelo frontend.
- `NODE_ENV=production`.
- `DATABASE_URL` (PostgreSQL).
- `SESSION_SECRET` forte.

## Render

O arquivo `render.yaml` cria três recursos: API Node, frontend estático e PostgreSQL.

1. Crie um Blueprint no Render apontando para este repositório.
2. Confirme os nomes `sistema-vendas-api`, `sistema-vendas-front` e `sistema-vendas-db`, ou ajuste as URLs/origens no `render.yaml`.
3. Preencha `BOOTSTRAP_ADMIN_CPF` e `BOOTSTRAP_ADMIN_SENHA` quando o Render solicitar.

Health check da API: `/healthz`.
