# Manual de Operação Local

Autor: Glauco Maximo <glaucomaximo@gmail.com>

## Iniciar com Containers

```bash
cp .env.example .env
docker compose up --build
```

Endpoints esperados:

- Frontend: `http://localhost:4200`
- Liveness da API: `http://localhost:3333/liveness`
- Readiness da API: `http://localhost:3333/readiness`

## Parar

```bash
docker compose down
```

Remova o estado local do MySQL apenas quando ele for descartável:

```bash
docker compose down -v
```

## Validar Localmente

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm audit --omit=dev
```

## Gerar SBOM

```bash
npm run sbom
```

O arquivo `sbom.cdx.json` gerado é um artefato local ou de release e é ignorado pelo Git intencionalmente.

## Falhas Comuns

- MySQL não está pronto: verifique `docker compose logs mysql` e aguarde o healthcheck passar.
- Readiness do backend falhando: verifique `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME`.
- Chamadas de API do frontend falhando: verifique `CORS_ORIGIN` e o proxy `/api` do Nginx.
- Conflito de porta: altere `MYSQL_PORT`, `API_PORT` ou `FRONTEND_PORT` no `.env`.
