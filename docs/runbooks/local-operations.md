# Manual de Operação Local

Autor: Glauco Maximo <glaucomaximo@gmail.com>

## Iniciar com Containers

```bash
cp .env.example .env
npm run docker:up
```

Se precisar passar argumentos diretamente ao Compose:

```bash
npm run docker -- compose ps
```

Endpoints esperados:

- Frontend: `http://localhost:4200`
- Vivacidade da API: `http://localhost:3333/liveness`
- Prontidão da API: `http://localhost:3333/readiness`

## Parar

```bash
npm run docker:down
```

Remova o estado local do MySQL apenas quando ele for descartável:

```bash
npm run docker -- compose down -v
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

- Docker fora do PATH no Windows: use `npm run docker -- --version`; o wrapper local procura o Docker Desktop instalado no perfil do usuário.
- MySQL não está pronto: verifique `npm run docker -- compose logs mysql` e aguarde a verificação de saúde passar.
- Prontidão do backend falhando: verifique `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME`.
- Chamadas de API do frontend falhando: verifique `CORS_ORIGIN` e o proxy `/api` do Nginx.
- Conflito de porta: altere `MYSQL_PORT`, `API_PORT` ou `FRONTEND_PORT` no `.env`.
