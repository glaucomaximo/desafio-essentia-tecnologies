# Desafio Fullstack Tech - Essentia Group

Aplicação fullstack de gerenciamento de tarefas criada para a empresa fictícia TechX, conforme o desafio fullstack da Essentia Group.

**Autor:** Glauco Maximo
**E-mail:** glaucomaximo@gmail.com

## Visão Geral

O sistema permite cadastrar usuários, autenticar com JWT, listar, criar, editar, remover e marcar tarefas como concluídas ou pendentes. A entrega foi modernizada com foco em reprodutibilidade, segurança básica, testes, containers, documentação e controles automatizados de qualidade.

## Arquitetura

Arquitetura atual: monólito modular com dois processos.

- `frontend`: Angular 22 servido por Nginx sem privilégios de root.
- `backend`: Node.js 24, TypeScript, Express 5, MySQL e MongoDB.
- `banco relacional`: usuarios e registro principal das tarefas em MySQL.
- `banco NoSQL`: metadados adicionais das tarefas em MongoDB.

Fluxo principal:

```text
Navegador -> Frontend/Nginx -> proxy /api -> Backend/Express -> MySQL + MongoDB
```

Documentação complementar:

- `docs/architecture/system-overview.md`
- `docs/modernization/legacy-assessment.md`
- `docs/modernization/modernization-plan.md`
- `docs/adr/`

## Requisitos

- Node.js `24.15.0` ou superior compatível com Angular 22.
- npm `11+`.
- Docker Compose para o caminho recomendado de execução.
- MySQL 8.4 e MongoDB 8.0 quando executar sem Compose.

Use `.nvmrc` para alinhar a versão local do Node.

## Desenvolvimento Local

Instale as dependências:

```bash
npm ci
```

Crie o ambiente do backend:

```bash
cp backend/.env.example backend/.env
```

Suba os bancos pelo Compose:

```bash
npm run docker -- compose up -d mysql mongo
```

Execute a API:

```bash
npm run dev:backend
```

Execute o frontend em outro terminal:

```bash
npm run dev:frontend
```

URLs locais:

- Frontend: `http://localhost:4200`
- API: `http://localhost:3333`
- Vivacidade: `http://localhost:3333/liveness`
- Prontidão: `http://localhost:3333/readiness`

## Desenvolvimento com Containers

O caminho principal de avaliação e execução é Docker Compose:

```bash
cp .env.example .env
npm run docker:up
```

O projeto inclui um wrapper para Docker em `scripts/docker-cli.mjs`. Ele usa `docker` do PATH quando disponível e, no Windows, também localiza o Docker Desktop instalado em `%LOCALAPPDATA%\Programs\DockerDesktop\resources\bin`. Isso evita falha de auxiliares como `docker-credential-desktop` quando o Docker Desktop existe, mas o CLI não foi adicionado ao PATH global.

Para validar a configuração final do Compose:

```bash
npm run docker:config
```

Parar containers:

```bash
npm run docker:down
```

Remover também os volumes locais dos bancos:

```bash
npm run docker -- compose down -v
```

As imagens usam compilação multiestágio, execução sem root, verificações de saúde e configuração externa por variáveis de ambiente.

## Configuração

Copie `.env.example` para `.env` em execução por Compose. Copie `backend/.env.example` para `backend/.env` em desenvolvimento local sem backend containerizado.

Variáveis principais:

| Variável                         | Descrição                                | Valor local padrão      |
| -------------------------------- | ---------------------------------------- | ----------------------- |
| `APP_VERSION`                    | Versão SemVer exposta nas rotas de saúde | `2.0.0`                 |
| `NODE_ENV`                       | Ambiente lógico da aplicação             | `development`           |
| `SERVICE_NAME`                   | Nome do serviço nos logs                 | `techx-tasks-api`       |
| `PORT`                           | Porta interna da API                     | `3333`                  |
| `CORS_ORIGIN`                    | Origem permitida para o frontend         | `http://localhost:4200` |
| `JSON_BODY_LIMIT`                | Limite do corpo JSON                     | `1mb`                   |
| `RATE_LIMIT_ENABLED`             | Habilita limite de requisições da API    | `true`                  |
| `RATE_LIMIT_WINDOW_MS`           | Janela do limite de requisições          | `900000`                |
| `RATE_LIMIT_MAX_REQUESTS`        | Requisições por cliente dentro da janela | `100`                   |
| `DB_HOST`                        | Host MySQL para a API                    | `mysql` no Compose      |
| `DB_USER`                        | Usuário MySQL                            | `techx`                 |
| `DB_PASSWORD`                    | Senha MySQL local de desenvolvimento     | `techx`                 |
| `DB_NAME`                        | Banco de dados                           | `techx_tasks`           |
| `MONGO_URI`                      | String de conexão MongoDB da API         | definida no Compose     |
| `MONGO_DB_NAME`                  | Banco MongoDB                            | `techx_tasks`           |
| `MONGO_TASK_METADATA_COLLECTION` | Coleção de metadados das tarefas         | `task_metadata`         |
| `JWT_SECRET`                     | Segredo HMAC do JWT                      | valor fictício local    |
| `JWT_ISSUER`                     | Emissor esperado do JWT                  | `techx-tasks-api`       |
| `JWT_AUDIENCE`                   | Audiência esperada do JWT                | `techx-tasks-web`       |
| `JWT_EXPIRES_IN_SECONDS`         | Tempo de expiração do token              | `3600`                  |

Valores dos exemplos são apenas para desenvolvimento local. Troque senhas e `JWT_SECRET` em qualquer ambiente compartilhado ou produtivo.

## Banco de Dados

Tabelas MySQL:

- `users`: identidade local para cadastro e login.
- `tasks`: registro principal das tarefas, com vínculo ao usuário proprietário.

Campos principais de `tasks`:

- `id`
- `title`
- `description`
- `completed`
- `owner_user_id`
- `created_at`
- `updated_at`

Coleção MongoDB:

- `task_metadata`: prioridade, prazo, etiquetas e observações adicionais por tarefa e usuário.

O esquema inicial fica em `database/init.sql`. A API também executa migrações idempotentes ao iniciar para garantir tabelas, índices, chave estrangeira de proprietário e índices do MongoDB.

## Migrações

Migração atual:

```bash
npm --workspace backend run migrate
```

Para evoluções futuras de esquema, preferir estratégia progressiva `expand -> migrate -> contract` e registrar decisões em ADR quando houver impacto relevante.

## Testes

Controles locais de qualidade:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm audit --omit=dev
```

Gerar SBOM CycloneDX:

```bash
npm run sbom
```

## Segurança

Controles atuais:

- Cabeçalhos de segurança via Helmet.
- CORS configurável.
- Limite de corpo JSON.
- SQL parametrizado com `mysql2`.
- Senhas armazenadas com hash `scrypt` e sal aleatório.
- Autenticação JWT HMAC SHA-256 com emissor, audiência e expiração configuráveis.
- Isolamento server-side de tarefas por usuário autenticado.
- Limite de requisições configurável para rotas `/api`.
- Logs JSON com redação de chaves sensíveis.
- `X-Request-ID` para correlação.
- Containers sem usuário root.
- CI com auditoria de dependências, varredura de padrões de segredo, CodeQL, revisão de dependências, compilação de imagens e SBOM.

Leia `SECURITY.md` antes de reportar ou tratar vulnerabilidades.

## API

Rota canônica:

```text
/api/v1/tasks
```

Alias legado preservado:

```text
/api/tasks
```

Endpoints:

| Método | Rota                    | Descrição                        |
| ------ | ----------------------- | -------------------------------- |
| POST   | `/api/v1/auth/register` | Cria usuário e retorna JWT       |
| POST   | `/api/v1/auth/login`    | Autentica usuário e retorna JWT  |
| GET    | `/api/v1/auth/me`       | Retorna usuário autenticado      |
| GET    | `/api/v1/tasks`         | Lista tarefas autenticadas       |
| GET    | `/api/v1/tasks/:id`     | Busca uma tarefa                 |
| POST   | `/api/v1/tasks`         | Cria uma tarefa                  |
| PUT    | `/api/v1/tasks/:id`     | Atualiza uma tarefa              |
| PATCH  | `/api/v1/tasks/:id`     | Atualiza parcialmente uma tarefa |
| DELETE | `/api/v1/tasks/:id`     | Remove uma tarefa                |

As rotas de tarefas exigem:

```text
Authorization: Bearer <token>
```

Contrato OpenAPI: `docs/api/openapi.yaml`.

## Implantação

O projeto segue o princípio: construir uma vez, testar uma vez, assinar uma vez e promover o mesmo artefato.

Fluxo recomendado:

```text
commit -> CI -> testes/segurança -> compilação OCI -> varredura de container -> SBOM -> registro OCI -> homologação -> produção
```

Não coloque segredos em Dockerfiles, Compose ou workflows. Use variáveis protegidas do ambiente de destino.

## Solução de Problemas

- `docker` não encontrado: valide com `npm run docker -- --version`; se falhar, instale Docker Desktop ou outro ambiente de execução OCI compatível.
- Docker Desktop instalado, mas fora do PATH: use os scripts `npm run docker:*` ou defina `DOCKER_CLI` com o caminho absoluto do executável.
- MySQL não inicia: confira `MYSQL_PORT` e logs com `npm run docker -- compose logs mysql`.
- MongoDB não inicia: confira `MONGO_PORT` e logs com `npm run docker -- compose logs mongo`.
- API sem prontidão: confira `DB_*`, `MONGO_*` e `JWT_SECRET`.
- Frontend não chama API: confira `CORS_ORIGIN`, proxy do Nginx e `frontend/proxy.conf.json`.
- Porta ocupada: altere `API_PORT`, `FRONTEND_PORT`, `MYSQL_PORT` ou `MONGO_PORT` no `.env`.

## Autoria

Projeto desenvolvido por Glauco Maximo, glaucomaximo@gmail.com.
