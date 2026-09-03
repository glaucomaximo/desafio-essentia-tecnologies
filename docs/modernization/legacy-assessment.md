# Auditoria do Legado

Data da auditoria: 2026-09-02

Autor: Glauco Maximo <glaucomaximo@gmail.com>

## Estado Atual

### Arquitetura

- Monorepo npm com dois workspaces: `backend` e `frontend`.
- Backend em Node.js, TypeScript, Express 5 e `mysql2`.
- Frontend em Angular 22 standalone com Reactive Forms.
- Banco relacional MySQL com esquema inicial em `database/init.sql`.
- Aplicação pequena, adequada a monólito modular. Não há justificativa atual para microserviços.

### Tecnologias e Versões

- Node local: v24.15.0.
- npm local: 11.12.1.
- Runtime declarado: Node >=24.15.0 e npm >=11.
- Backend: TypeScript 6.0.3, Express 5.2.1, MySQL2 3.24.3.
- Frontend: Angular 22.1.x, TypeScript 6.0.3, RxJS 7.8.x, Zone.js 0.16.x.
- Containers: `node:24.15.0-alpine` e `nginxinc/nginx-unprivileged:1.27-alpine`.

### Módulos

- `backend/src/config`: carregamento e validação básica de ambiente.
- `backend/src/db`: pool MySQL, migrações simples e espera pelo banco.
- `backend/src/errors`: erro HTTP padronizado.
- `backend/src/middleware`: async handler, erros, contexto de requisição e limite de requisições.
- `backend/src/repositories`: adaptador SQL de tarefas.
- `backend/src/routes`: interface HTTP.
- `backend/src/schemas`: validação e normalização manual de payloads.
- `backend/src/shared`: logger estruturado.
- `frontend/src/app`: componente principal e cliente HTTP.

### Infraestrutura e Implantação

- `docker-compose.yml` define MySQL, backend e frontend.
- Dockerfiles multiestágio existem para backend e frontend.
- Backend e frontend rodam sem usuário root nas imagens.
- Frontend é servido por Nginx sem privilégios de root com proxy para `/api`.
- Docker CLI não está instalado ou não está no PATH do host avaliado, então `docker compose up --build` não foi validado localmente.
- CI versionado cobre build de imagens e scan quando executado no GitHub Actions.

### Banco de Dados

- Tabela `tasks` com `id`, `title`, `description`, `completed`, `created_at`, `updated_at`.
- Índice em `(completed, created_at)`.
- Migrações são idempotentes, mas ainda não possuem controle versionado de histórico.

### APIs

- Rota canônica versionada:
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
- Limite de requisições configurável em rotas `/api`.
- Erros de payload JSON inválido retornam 400 em vez de 500.
- Logs estruturados com redação de chaves sensíveis.
- `X-Request-ID` propagado nas respostas.
- Sem autenticação/autorização, coerente com o escopo básico do desafio, mas P1 se houver usuários reais ou exposição externa.
- Exemplos `.env` usam credenciais fracas de desenvolvimento e documentam que devem ser substituídas fora do ambiente local.

### Testes

- Testes unitários para validação de payload de tarefas.
- Testes HTTP de contrato com `supertest` e repositório em memória.
- Cobertura atual valida liveness, readiness, listagem, criação, alias legado, erros 400 e limite de requisições.
- Sem testes de integração com MySQL por indisponibilidade local do Docker CLI.
- Sem testes automatizados de frontend nesta rodada.

### CI/CD e Cadeia de Suprimentos

- GitHub Actions em `.github/workflows/ci.yml`.
- Controles de qualidade: install determinístico, format-check, lint, typecheck, testes, auditoria de produção, varredura de padrões de segredo, SBOM, CodeQL, revisão de dependências, build OCI e scan de container.
- Dependabot configurado para npm, Docker e GitHub Actions.
- SBOM CycloneDX gerado por `npm run sbom` a partir do lockfile.
- Provenance e assinatura de artefatos ainda dependem de registry/política de release.

### Logging e Observabilidade

- Logs JSON em stdout/stderr.
- Request ID por requisição.
- Separação entre `/liveness` e `/readiness`.
- Métricas e tracing distribuídos ainda não implementados por não haver necessidade operacional demonstrada neste escopo.

## Problemas Encontrados

| ID      | Severidade  | Domínio                          | Componente              | Descrição                                                                                                                      | Impacto                                                                                | Probabilidade | Recomendação                                                                                                            | Esforço     | Risco de Regressão | Status                           |
| ------- | ----------- | -------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------ | -------------------------------- |
| LEG-001 | ALTA        | Dependências, Segurança          | Angular 18.2.x          | `npm audit --omit=dev` reportou vulnerabilidades altas em pacotes Angular runtime, incluindo XSS e caching.                    | Exposição a vulnerabilidades conhecidas no frontend.                                   | Média         | Atualizar Angular em majors controlados ou migrar diretamente neste projeto pequeno com validação forte.                | Médio       | Médio              | Mitigado com Angular 22          |
| LEG-002 | MÉDIA       | Dependências, Segurança          | Express 4.22.2          | `npm audit --omit=dev` reportou vulnerabilidade via `qs`/`body-parser` na cadeia do Express.                                   | Possível DoS em parsing de query/body em cenários específicos.                         | Baixa-média   | Atualizar para Express 5.2.x e validar contratos HTTP.                                                                  | Baixo-médio | Médio              | Mitigado em runtime              |
| LEG-003 | MÉDIA       | API, Manutenibilidade            | `/api/tasks`            | API sem versionamento explícito.                                                                                               | Evolução futura pode causar breaking changes silenciosos.                              | Média         | Introduzir `/api/v1/tasks` preservando `/api/tasks` como alias compatível.                                              | Baixo       | Baixo              | Mitigado                         |
| LEG-004 | MÉDIA       | API, Segurança                   | Backend                 | Ausência de limite de requisições e proteção básica contra abuso.                                                              | API pode ser abusada por chamadas excessivas.                                          | Média         | Adicionar limite de requisições configurável em rotas de API.                                                           | Baixo       | Baixo              | Mitigado                         |
| LEG-005 | MÉDIA       | Observabilidade, Confiabilidade  | Backend                 | Health endpoint único mistura liveness/readiness.                                                                              | Orquestradores podem reiniciar ou rotear tráfego incorretamente.                       | Média         | Criar `/liveness` e `/readiness`, mantendo `/health` por compatibilidade.                                               | Baixo       | Baixo              | Mitigado                         |
| LEG-006 | MÉDIA       | Observabilidade                  | Backend                 | Logs não estruturados e sem request ID.                                                                                        | Investigação de incidentes e troubleshooting ficam difíceis.                           | Alta          | Adicionar logger JSON e middleware de request ID.                                                                       | Baixo       | Baixo              | Mitigado                         |
| LEG-007 | MÉDIA       | Testes                           | Backend/API             | Sem testes HTTP de contrato.                                                                                                   | Regressão em status codes/rotas pode passar despercebida.                              | Média         | Adicionar testes com `supertest` para health e rotas principais com repositório isolado.                                | Médio       | Baixo              | Mitigado                         |
| LEG-008 | ALTA        | DevOps, Cadeia de Suprimentos    | CI/CD                   | Ausência de pipeline CI.                                                                                                       | Falhas de build/teste/audit podem entrar no branch principal.                          | Média         | Criar GitHub Actions com install, typecheck, testes, auditoria, build Docker, varredura de segredo e SAST.              | Médio       | Baixo              | Mitigado inicial                 |
| LEG-009 | MÉDIA       | Cadeia de Suprimentos            | SBOM/Provenance         | Sem SBOM/provenance/assinatura.                                                                                                | Menor rastreabilidade de dependências e artefatos.                                     | Média         | Gerar SBOM em CI e documentar assinatura/provenance como próxima fase se registry suportar.                             | Médio       | Baixo              | SBOM mitigado; assinatura futura |
| LEG-010 | MÉDIA       | Containers                       | Dockerfiles             | Imagens usavam Node 20 e tags sem digest.                                                                                      | Reprodutibilidade parcial e incompatibilidade com Angular 22.                          | Média         | Fixar versão SemVer do Node e alinhar `.nvmrc`/engines/container. Digest pinning fica pendente por política de release. | Baixo       | Baixo              | Parcialmente mitigado            |
| LEG-011 | BAIXA       | Banco de Dados, Segredos         | `.env.example`, Compose | Credenciais de desenvolvimento (`techx`/`root`) podem ser copiadas indevidamente.                                              | Uso acidental em ambiente não-dev.                                                     | Média         | Reforçar documentação e substituir em ambientes reais.                                                                  | Baixo       | Baixo              | Documentado                      |
| LEG-012 | MÉDIA       | Banco de Dados, Manutenibilidade | Migrações               | Migração atual é SQL idempotente sem tabela de controle de versão.                                                             | Evoluções futuras de esquema podem ficar difíceis de auditar.                          | Média         | Introduzir ferramenta de migrações em fase posterior ou tabela simples de histórico.                                    | Médio       | Médio              | Pendente                         |
| LEG-013 | BAIXA       | Arquitetura                      | Backend                 | Rotas ainda chamam repositório diretamente; camada de aplicação ainda ausente.                                                 | Para escopo pequeno é aceitável, mas regras futuras podem acoplar HTTP e persistência. | Média         | Evoluir para `domain/application/infrastructure/interfaces/shared` de forma incremental se o domínio crescer.           | Médio       | Médio              | Aceito por escopo                |
| LEG-014 | BAIXA       | Documentação                     | API                     | Documentação textual existia, mas sem OpenAPI.                                                                                 | Consumidores não conseguiam validar contrato automaticamente.                          | Média         | Adicionar `docs/api/openapi.yaml`.                                                                                      | Baixo       | Baixo              | Mitigado                         |
| LEG-015 | INFORMATIVA | Autenticação, Autorização        | Sistema                 | Autenticação JWT era extra opcional no desafio e não foi implementada.                                                         | Sem isolamento por usuário caso o produto deixe de ser demo.                           | Média futura  | Registrar como decisão bloqueada/escopo futuro; não implementar sem requisito de negócio.                               | Alto        | Alto               | Pendente por requisito           |
| LEG-016 | MÉDIA       | Dependências, DevOps             | Toolchain Angular       | `npm audit` completo ainda aponta 8 vulnerabilidades moderadas dev-only em `webpack-dev-server`, `sockjs`, `uuid` e Express 4. | Risco limitado a ambiente de desenvolvimento/build; runtime audit está limpo.          | Baixa-média   | Monitorar Angular build tooling, evitar expor dev server e manter `npm audit --omit=dev` como gate de release.          | Médio       | Médio              | Aceito temporariamente           |
| LEG-017 | MÉDIA       | Containers                       | Host local              | Docker CLI não está disponível no host avaliado.                                                                               | Build/execução local de imagens não pode ser validado nesta máquina.                   | Alta          | Instalar Docker Desktop ou runtime OCI compatível; usar CI para build/scan enquanto isso.                               | Baixo       | Baixo              | Bloqueado por ambiente           |

## Linha de Base Inicial de Validação

- `npm run build`: passou.
- `npm run typecheck`: passou.
- `npm test`: passou.
- `npm audit --omit=dev --json`: falhou com 9 vulnerabilidades, sendo 6 altas e 3 moderadas.
- `npm audit --json`: falhou com 55 vulnerabilidades totais, sendo 1 crítica, 30 altas, 17 moderadas e 7 baixas.
- `docker compose up --build`: não executado porque Docker CLI não está disponível no host.

## Validação Pós-Rodada

- `npm run format:check`: passou.
- `npm run lint`: passou.
- `npm run typecheck`: passou.
- `npm test`: passou com 11 testes.
- `npm run build`: passou.
- `npm audit --omit=dev --audit-level=moderate`: passou com 0 vulnerabilidades.
- `npm audit --audit-level=moderate`: falhou com 8 vulnerabilidades moderadas dev-only.
- `npm run sbom`: passou e gerou `sbom.cdx.json` como artefato local ignorado pelo Git.
- `docker compose up --build`: não executado porque Docker CLI não está disponível no host.

## Pontos Críticos de Negócio

- CRUD de tarefas permanece compatível.
- Marcar tarefa como concluída ou pendente continua funcionando por `PATCH`.
- Campos existentes da resposta `Task` foram preservados.
- `/api/tasks` foi mantido para compatibilidade; `/api/v1/tasks` é a rota canônica.
- A execução por Docker continua sendo o caminho principal para avaliação.

## P0/P1 Priorizados

- P1 concluído: atualizar Angular/Express para remover vulnerabilidades conhecidas de runtime.
- P1 concluído: criar CI com controles essenciais de qualidade.
- P1 concluído: adicionar liveness/readiness, limite de requisições e logs estruturados.
- P1 concluído parcialmente: manter containerização alinhada ao runtime atualizado; validação local bloqueada por ausência de Docker.
- P2 concluído: adicionar OpenAPI e testes HTTP de contrato.
- P2 concluído: introduzir lint/format/checks automatizados.
