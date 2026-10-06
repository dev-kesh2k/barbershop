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

### App (celular e navegador)

O app em `mobile/` é Expo: o mesmo código abre no celular e na web, usando a API do backend.

```bash
cd mobile
npm install
npx expo start          # celular (Expo Go) e opções de plataforma
npx expo start --web    # navegador
```

No celular, use o Expo Go na mesma rede Wi-Fi. No navegador, as rotas são `/`, `/agendar`, `/servicos`, `/agenda`, `/entrar` e `/admin`. No navegador a página usa a largura da tela. No celular o app continua em tela cheia. No emulador Android, a API local é `http://10.0.2.2:4002`. No simulador iOS e no navegador, `http://127.0.0.1:4002`.

Para apontar outro endereço:

```bash
EXPO_PUBLIC_API_URL=http://192.168.0.10:4002 npx expo start
```

O backend precisa escutar em `0.0.0.0` (já é o padrão) e a porta local do exemplo é `4002`.

### Contas seed

| Papel    | E-mail                   | Senha      |
|----------|--------------------------|------------|
| Admin    | `jeferson.santana.s@hotmail.com` | `***REMOVIDO***` |
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
