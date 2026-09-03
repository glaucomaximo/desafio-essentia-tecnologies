# Auditoria do Legado

Data da auditoria: 2026-09-02

Autor: Glauco Maximo <glaucomaximo@gmail.com>

## Estado Atual

### Arquitetura

- Monorepo npm com dois workspaces: `backend` e `frontend`.
- Backend em Node.js, TypeScript, Express 5, `mysql2`, `mongodb` e `jose`.
- Frontend em Angular 22 standalone com Reactive Forms.
- Banco relacional MySQL com esquema inicial em `database/init.sql`.
- Banco NoSQL MongoDB para metadados adicionais das tarefas.
- Aplicação pequena, adequada a monólito modular. Não há justificativa atual para microserviços.

### Tecnologias e Versões

- Node local: v24.15.0.
- npm local: 11.12.1.
- Ambiente de execução declarado: Node >=24.15.0 e npm >=11.
- Backend: TypeScript 6.0.3, Express 5.2.1, MySQL2 3.24.3, MongoDB 7.6.0 e jose 6.2.10.
- Frontend: Angular 22.1.x, TypeScript 6.0.3, RxJS 7.8.x, Zone.js 0.16.x.
- Containers: `node:24.15.0-alpine` e `nginxinc/nginx-unprivileged:1.27-alpine`.

### Módulos

- `backend/src/config`: carregamento e validação básica de ambiente.
- `backend/src/auth`: assinatura/verificação JWT e hash de senha com `scrypt`.
- `backend/src/db`: conexões MySQL/MongoDB, migrações idempotentes e espera por bancos.
- `backend/src/errors`: erro HTTP padronizado.
- `backend/src/middleware`: async handler, erros, contexto de requisição e limite de requisições.
- `backend/src/repositories`: adaptadores de persistência para usuários, tarefas e metadados.
- `backend/src/routes`: interfaces HTTP de autenticação e tarefas.
- `backend/src/schemas`: validação e normalização manual de payloads.
- `backend/src/services`: casos de uso de autenticação e tarefas.
- `backend/src/shared`: logger estruturado.
- `frontend/src/app`: componente principal e cliente HTTP.

### Infraestrutura e Implantação

- `docker-compose.yml` define MySQL, MongoDB, backend e frontend.
- Dockerfiles multiestágio existem para backend e frontend.
- Backend e frontend rodam sem usuário root nas imagens.
- Frontend é servido por Nginx sem privilégios de root com proxy para `/api`.
- Docker Desktop está instalado no host, mas `docker.exe` não está no PATH global.
- O projeto agora fornece wrapper `npm run docker` para localizar o CLI no caminho do Docker Desktop e preservar o PATH necessário aos auxiliares do Compose.
- `npm run docker -- compose up --build -d` foi validado localmente com MySQL, MongoDB, backend e frontend.
- CI versionado cobre compilação de imagens e varredura quando executado no GitHub Actions.

### Banco de Dados

- Tabela `users` com `id`, `name`, `email`, `password_hash`, `created_at`, `updated_at`.
- Tabela `tasks` com `id`, `title`, `description`, `completed`, `owner_user_id`, `created_at`, `updated_at`.
- Índice em `(completed, created_at)`.
- Índice em `(owner_user_id, completed, created_at)`.
- Coleção MongoDB `task_metadata` com índice único por `ownerUserId` e `taskId`.
- Migrações são idempotentes, mas ainda não possuem controle versionado de histórico.

### APIs

- Rota canônica versionada:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `GET /api/v1/auth/me`
  - `GET /api/v1/tasks`
  - `GET /api/v1/tasks/:id`
  - `POST /api/v1/tasks`
  - `PUT /api/v1/tasks/:id`
  - `PATCH /api/v1/tasks/:id`
  - `DELETE /api/v1/tasks/:id`
- Alias legado preservado: `/api/tasks`.
- Endpoints de saúde:
  - `GET /liveness`
  - `GET /readiness`
  - `GET /health`
- Contrato OpenAPI em `docs/api/openapi.yaml`.

### Segurança

- Helmet habilitado.
- CORS configurável por ambiente.
- Body JSON limitado por `JSON_BODY_LIMIT`.
- SQL parametrizado.
- Hash de senhas com `scrypt`, sal aleatório e comparação em tempo constante.
- JWT com emissor, audiência, expiração e segredo externo.
- Rotas de tarefas protegidas por Bearer token.
- Isolamento server-side por `owner_user_id`.
- Limite de requisições configurável em rotas `/api`.
- Erros de payload JSON inválido retornam 400 em vez de 500.
- Logs estruturados com redação de chaves sensíveis.
- `X-Request-ID` propagado nas respostas.
- Exemplos `.env` usam credenciais fracas de desenvolvimento e documentam que devem ser substituídas fora do ambiente local.

### Testes

- Testes unitários para validação de payload de tarefas.
- Testes HTTP de contrato com `supertest` e repositório em memória.
- Cobertura atual valida vivacidade, prontidão, autenticação JWT, listagem autenticada, criação com metadados, isolamento por usuário, alias legado, erros 400/401 e limite de requisições.
- Teste de fumaça real com MySQL e MongoDB em Docker foi validado via API e proxy Nginx.
- Ambiente de desenvolvimento local foi validado com backend e frontend no host usando bancos em container.
- Sem testes automatizados de frontend nesta rodada.

### CI/CD e Cadeia de Suprimentos

- GitHub Actions em `.github/workflows/ci.yml`.
- Controles de qualidade: instalação determinística, format-check, lint, typecheck, testes, auditoria de produção, varredura de padrões de segredo, SBOM, CodeQL, revisão de dependências, compilação OCI e varredura de container.
- Atualizações de dependências devem ser revisadas manualmente durante a submissão do desafio.
- SBOM CycloneDX gerado por `npm run sbom` a partir do lockfile.
- Proveniência e assinatura de artefatos ainda dependem de registro OCI/política de release.

### Logging e Observabilidade

- Logs JSON em stdout/stderr.
- Request ID por requisição.
- Separação entre vivacidade (`/liveness`) e prontidão (`/readiness`).
- Métricas e tracing distribuídos ainda não implementados por não haver necessidade operacional demonstrada neste escopo.

## Problemas Encontrados

| ID      | Severidade | Domínio                          | Componente              | Descrição                                                                                                                                          | Impacto                                                                                    | Probabilidade | Recomendação                                                                                                                 | Esforço     | Risco de Regressão | Estado                           |
| ------- | ---------- | -------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------ | -------------------------------- |
| LEG-001 | ALTA       | Dependências, Segurança          | Angular 18.2.x          | `npm audit --omit=dev` reportou vulnerabilidades altas em pacotes Angular de produção, incluindo XSS e caching.                                    | Exposição a vulnerabilidades conhecidas no frontend.                                       | Média         | Atualizar Angular em majors controlados ou migrar diretamente neste projeto pequeno com validação forte.                     | Médio       | Médio              | Mitigado com Angular 22          |
| LEG-002 | MÉDIA      | Dependências, Segurança          | Express 4.22.2          | `npm audit --omit=dev` reportou vulnerabilidade via `qs`/`body-parser` na cadeia do Express.                                                       | Possível DoS em parsing de query/body em cenários específicos.                             | Baixa-média   | Atualizar para Express 5.2.x e validar contratos HTTP.                                                                       | Baixo-médio | Médio              | Mitigado em produção             |
| LEG-003 | MÉDIA      | API, Manutenibilidade            | `/api/tasks`            | API sem versionamento explícito.                                                                                                                   | Evolução futura pode causar breaking changes silenciosos.                                  | Média         | Introduzir `/api/v1/tasks` preservando `/api/tasks` como alias compatível.                                                   | Baixo       | Baixo              | Mitigado                         |
| LEG-004 | MÉDIA      | API, Segurança                   | Backend                 | Ausência de limite de requisições e proteção básica contra abuso.                                                                                  | API pode ser abusada por chamadas excessivas.                                              | Média         | Adicionar limite de requisições configurável em rotas de API.                                                                | Baixo       | Baixo              | Mitigado                         |
| LEG-005 | MÉDIA      | Observabilidade, Confiabilidade  | Backend                 | Endpoint único de saúde mistura vivacidade e prontidão.                                                                                            | Orquestradores podem reiniciar ou rotear tráfego incorretamente.                           | Média         | Criar `/liveness` e `/readiness`, mantendo `/health` por compatibilidade.                                                    | Baixo       | Baixo              | Mitigado                         |
| LEG-006 | MÉDIA      | Observabilidade                  | Backend                 | Logs não estruturados e sem request ID.                                                                                                            | Investigação de incidentes e troubleshooting ficam difíceis.                               | Alta          | Adicionar logger JSON e middleware de request ID.                                                                            | Baixo       | Baixo              | Mitigado                         |
| LEG-007 | MÉDIA      | Testes                           | Backend/API             | Sem testes HTTP de contrato.                                                                                                                       | Regressão em status codes/rotas pode passar despercebida.                                  | Média         | Adicionar testes com `supertest` para health e rotas principais com repositório isolado.                                     | Médio       | Baixo              | Mitigado                         |
| LEG-008 | ALTA       | DevOps, Cadeia de Suprimentos    | CI/CD                   | Ausência de pipeline CI.                                                                                                                           | Falhas de compilação/teste/auditoria podem entrar no branch principal.                     | Média         | Criar GitHub Actions com instalação, typecheck, testes, auditoria, compilação Docker, varredura de segredo e SAST.           | Médio       | Baixo              | Mitigado inicial                 |
| LEG-009 | MÉDIA      | Cadeia de Suprimentos            | SBOM/Proveniência       | Sem SBOM/proveniência/assinatura.                                                                                                                  | Menor rastreabilidade de dependências e artefatos.                                         | Média         | Gerar SBOM em CI e documentar assinatura/proveniência como próxima fase se o registro OCI suportar.                          | Médio       | Baixo              | SBOM mitigado; assinatura futura |
| LEG-010 | MÉDIA      | Containers                       | Dockerfiles             | Imagens usavam Node 20 e tags sem digest.                                                                                                          | Reprodutibilidade parcial e incompatibilidade com Angular 22.                              | Média         | Fixar versão SemVer do Node e alinhar `.nvmrc`/engines/container. Digest pinning fica pendente por política de release.      | Baixo       | Baixo              | Parcialmente mitigado            |
| LEG-011 | BAIXA      | Banco de Dados, Segredos         | `.env.example`, Compose | Credenciais de desenvolvimento (`techx`/`root`) podem ser copiadas indevidamente.                                                                  | Uso acidental em ambiente não-dev.                                                         | Média         | Reforçar documentação e substituir em ambientes reais.                                                                       | Baixo       | Baixo              | Documentado                      |
| LEG-012 | MÉDIA      | Banco de Dados, Manutenibilidade | Migrações               | Migração atual é SQL idempotente sem tabela de controle de versão.                                                                                 | Evoluções futuras de esquema podem ficar difíceis de auditar.                              | Média         | Introduzir ferramenta de migrações em fase posterior ou tabela simples de histórico.                                         | Médio       | Médio              | Pendente                         |
| LEG-013 | BAIXA      | Arquitetura                      | Backend                 | Rotas ainda chamam repositório diretamente; camada de aplicação ainda ausente.                                                                     | Para escopo pequeno é aceitável, mas regras futuras podem acoplar HTTP e persistência.     | Média         | Evoluir para `domain/application/infrastructure/interfaces/shared` de forma incremental se o domínio crescer.                | Médio       | Médio              | Aceito por escopo                |
| LEG-014 | BAIXA      | Documentação                     | API                     | Documentação textual existia, mas sem OpenAPI.                                                                                                     | Consumidores não conseguiam validar contrato automaticamente.                              | Média         | Adicionar `docs/api/openapi.yaml`.                                                                                           | Baixo       | Baixo              | Mitigado                         |
| LEG-015 | ALTA       | Autenticação, Autorização        | Sistema                 | Autenticação JWT era extra opcional e foi solicitada como incremento do desafio.                                                                   | Sem isolamento por usuário caso o produto deixe de ser demo.                               | Média         | Implementar cadastro/login, JWT, hash de senha e filtro server-side por proprietário.                                        | Médio       | Médio              | Mitigado em `2.0.0`              |
| LEG-016 | MÉDIA      | Dependências, DevOps             | Ferramental Angular     | `npm audit` completo ainda aponta 8 vulnerabilidades moderadas restritas ao desenvolvimento em `webpack-dev-server`, `sockjs`, `uuid` e Express 4. | Risco limitado a ambiente de desenvolvimento/compilação; auditoria de produção está limpa. | Baixa-média   | Monitorar ferramental de compilação Angular, evitar expor servidor dev e manter `npm audit --omit=dev` como gate de release. | Médio       | Médio              | Aceito temporariamente           |
| LEG-017 | MÉDIA      | Containers                       | Host local              | Docker Desktop instalado fora do PATH global, causando falha do Compose ao localizar `docker-credential-desktop`.                                  | Execução direta de `docker compose` falha em shells sem PATH configurado.                  | Alta          | Usar wrapper local `npm run docker`, ou adicionar Docker Desktop ao PATH global do usuário.                                  | Baixo       | Baixo              | Mitigado                         |

## Linha de Base Inicial de Validação

- `npm run build`: passou.
- `npm run typecheck`: passou.
- `npm test`: passou.
- `npm audit --omit=dev --json`: falhou com 9 vulnerabilidades, sendo 6 altas e 3 moderadas.
- `npm audit --json`: falhou com 55 vulnerabilidades totais, sendo 1 crítica, 30 altas, 17 moderadas e 7 baixas.
- `docker compose up --build`: inicialmente bloqueado porque Docker CLI não estava no PATH do host.

## Validação Pós-Rodada

- `npm run format:check`: passou.
- `npm run lint`: passou.
- `npm run typecheck`: passou.
- `npm test`: passou com 19 testes.
- `npm run build`: passou.
- `npm audit --omit=dev --audit-level=moderate`: passou com 0 vulnerabilidades.
- `npm audit --audit-level=moderate`: falhou com 8 vulnerabilidades moderadas restritas ao desenvolvimento.
- `npm run sbom`: passou e gerou `sbom.cdx.json` como artefato local ignorado pelo Git.
- `npm run docker -- compose up --build -d`: passou com compilação real de MySQL, MongoDB, backend e frontend.
- `npm run docker -- compose ps`: passou com containers saudáveis.
- Varredura Trivy local das imagens backend/frontend: 0 achados HIGH/CRITICAL.
- Teste de fumaça Docker via `http://127.0.0.1:4200/api/v1/auth/register` e `http://127.0.0.1:4200/api/v1/tasks`: passou com JWT, metadados MongoDB, PATCH, listagem, DELETE e rejeição 401 sem token.
- Teste de fumaça local dev autenticado: passou com backend/frontend no host e MySQL/MongoDB em containers.
- Validação visual no navegador: passou em Docker e em modo desenvolvimento local, sem erros de console.

## Pontos Críticos de Negócio

- CRUD de tarefas permanece compatível no escopo do usuário autenticado.
- Marcar tarefa como concluída ou pendente continua funcionando por `PATCH`.
- Campos existentes da resposta `Task` foram preservados.
- Campo `metadata` foi adicionado para cumprir o desafio extra com dados adicionais em MongoDB.
- `/api/tasks` foi mantido para compatibilidade; `/api/v1/tasks` é a rota canônica.
- Autenticação obrigatória nas rotas de tarefas é mudança incompatível registrada em `2.0.0`.
- A execução por Docker continua sendo o caminho principal para avaliação.

## P0/P1 Priorizados

- P1 concluído: atualizar Angular/Express para remover vulnerabilidades conhecidas de produção.
- P1 concluído: criar CI com controles essenciais de qualidade.
- P1 concluído: adicionar vivacidade/prontidão, limite de requisições e logs estruturados.
- P1 concluído: adicionar autenticação JWT e isolamento de tarefas por usuário.
- P1 concluído: manter containerização alinhada ao ambiente de execução atualizado e validar Docker local com wrapper resiliente.
- P2 concluído: integrar MongoDB para metadados adicionais das tarefas.
- P2 concluído: adicionar OpenAPI e testes HTTP de contrato.
- P2 concluído: introduzir lint/format/checks automatizados.
