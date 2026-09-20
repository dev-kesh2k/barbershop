# Barbershop

Aplicação de agendamento de barbearias compatível com o **Central Apps Hub**.

- **Frontend:** Vite + React (base `/barbershop/`)
- **Backend:** Express + Prisma + JWT (API na raiz; o Hub faz proxy de `/{slug}/api/` → `/`)

Slug: `barbershop`

## 1. Desenvolvimento local

### Backend

```bash
cd backend
cp .env.example .env
# Ajuste DATABASE_URL e JWT_SECRET
npm install
npx prisma db push
npm run seed
npm run dev
```

API em `http://127.0.0.1:4000` — health: `GET /health`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite em `http://127.0.0.1:5173/barbershop/` com proxy:

`/barbershop/api/*` → `http://127.0.0.1:4000/*`

### Contas seed

| Papel    | E-mail                   | Senha      |
|----------|--------------------------|------------|
| Admin    | `admin@barbershop.local` | `admin123` |
| Cliente  | `cliente@barbershop.local` | `cliente123` |

## 2. Publicar no Hub

1. Compacte o **conteúdo** de `frontend/` (não a pasta pai) → `frontend.zip`  
   Deve incluir `index.html`, `package.json`, `vite.config.ts`, `src/`, etc.
2. Compacte o **conteúdo** de `backend/` → `backend.zip`  
   Deve incluir `package.json`, `Dockerfile`, `prisma/`, `src/`, etc.
3. No Hub → **Aplicações** → criar/atualizar **"Barbershop"** e enviar os dois ZIPs.

O Hub injeta, entre outras:

- `DATABASE_URL`
- `JWT_SECRET`
- `PORT`
- `PUBLIC_PATH` (ex.: `/barbershop`)
- `CORS_ORIGINS`

## 3. Variáveis de ambiente (backend)

| Variável       | Descrição                                      |
|----------------|------------------------------------------------|
| `DATABASE_URL` | Postgres (Prisma)                              |
| `JWT_SECRET`   | Segredo para assinar tokens                    |
| `PORT`         | Porta HTTP (padrão 4000)                       |
| `CORS_ORIGINS` | Origens permitidas, separadas por vírgula      |
| `TRUST_PROXY`  | Se definido, ativa `trust proxy`               |
| `DEMO_MODE`    | Se `true`/`1`, eleva usuário a admin no `/me`  |
| `PUBLIC_PATH`  | Prefixo público (informativo)                  |

## 4. Scripts opcionais (raiz)

```bash
npm install
npm run dev      # backend + frontend
npm run build    # build de ambos
```
