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

Remova o estado local dos bancos apenas quando ele for descartavel:

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

## Teste Manual da API

Crie uma sessao:

```bash
curl -s -X POST http://localhost:3333/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Glauco Maximo\",\"email\":\"glauco@example.test\",\"password\":\"Senha1234\"}"
```

Use o token retornado nas rotas de tarefas:

```bash
curl -s http://localhost:3333/api/v1/tasks \
  -H "Authorization: Bearer <token>"
```

## Gerar SBOM

```bash
npm run sbom
```

O arquivo `sbom.cdx.json` gerado é um artefato local ou de release e é ignorado pelo Git intencionalmente.

## Falhas Comuns

- Docker fora do PATH no Windows: use `npm run docker -- --version`; o wrapper local procura o Docker Desktop instalado no perfil do usuário.
- MySQL não está pronto: verifique `npm run docker -- compose logs mysql` e aguarde a verificação de saúde passar.
- MongoDB não está pronto: verifique `npm run docker -- compose logs mongo` e aguarde a verificação de saúde passar.
- Prontidão do backend falhando: verifique `DB_*`, `MONGO_*` e `JWT_SECRET`.
- Chamadas de API do frontend falhando: verifique `CORS_ORIGIN` e o proxy `/api` do Nginx.
- Conflito de porta: altere `MYSQL_PORT`, `MONGO_PORT`, `API_PORT` ou `FRONTEND_PORT` no `.env`.
