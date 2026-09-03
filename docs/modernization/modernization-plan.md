# Plano de Modernização

Autor: Glauco Maximo <glaucomaximo@gmail.com>

## Estratégia

Modernização incremental, rastreável e reversível. O sistema é pequeno e deve permanecer como monólito modular. Mudanças devem preservar o CRUD de tarefas e validar compilação/testes após cada etapa relevante.

## Fase 0 - Linha de Base

Objetivo: entender o sistema, registrar riscos e garantir que o comportamento atual seja conhecido.

Estado: concluída nesta rodada.

Entregas:

- Mapeamento de linguagens, frameworks, versões e entrypoints.
- Linha de base de compilação, typecheck, testes e auditoria de dependências.
- `docs/modernization/legacy-assessment.md`.
- ADRs iniciais em `docs/adr/`.

## Fase 1 - Build e Dependências

Objetivo: reduzir vulnerabilidades conhecidas sem alterar comportamento funcional.

Estado: concluída para dependências de produção.

Entregas:

- Express atualizado para 5.2.x.
- Angular atualizado para 22.1.x.
- TypeScript atualizado para 6.0.x.
- Node alvo atualizado para 24.15.0.
- `npm audit --omit=dev` sem vulnerabilidades.
- Lockfile atualizado.

Pendência:

- Auditoria completa ainda possui vulnerabilidades moderadas restritas ao desenvolvimento no ferramental Angular atual.

## Fase 2 - Qualidade Estrutural

Objetivo: introduzir controles de qualidade sem overengineering.

Estado: concluída para linha de base.

Entregas:

- Prettier com `format` e `format:check`.
- ESLint para TypeScript de backend e frontend.
- API canônica `/api/v1/tasks`.
- Alias legado `/api/tasks` preservado.
- `tsconfig` atualizado para TypeScript 6 sem opções legadas.

## Fase 3 - Testes

Objetivo: cobrir comportamento relevante e contratos de API.

Estado: concluída para linha de base de backend/API.

Entregas:

- Testes unitários de validação preservados.
- Testes HTTP com `supertest`.
- Caracterização de vivacidade, prontidão, listagem, criação, alias legado, erros 400 e limite de requisições.

Pendências:

- Automatizar teste de integração com MySQL em CI usando Docker Compose.
- Testes de frontend se a interface crescer.

## Fase 4 - Segurança

Objetivo: aplicar security by default no escopo real do sistema.

Estado: linha de base concluída.

Entregas:

- Limite de requisições configurável.
- Limite de body preservado e configurável.
- Tratamento 400 para JSON inválido.
- Logs com redação de chaves sensíveis.
- `.env.example` documentado como exclusivo de desenvolvimento.
- `SECURITY.md`.
- Varredura de padrões de segredo no CI.

Pendência:

- Autenticação/autorização depende de requisito de negócio. Não implementar JWT apenas por opcionalidade do desafio.

## Fase 5 - Containerização

Objetivo: manter Container/OCI-first.

Estado: implementada e validada localmente.

Entregas:

- Dockerfiles com Node 24.15.0.
- Compilações multiestágio.
- Execução sem root.
- Verificações de saúde alinhadas a `/readiness` e `/health`.
- Configuração externa por variáveis de ambiente.
- Persistência via volume MySQL.
- Wrapper `npm run docker` para localizar Docker Desktop no Windows quando o CLI não está no PATH.
- `npm run docker -- compose up --build -d` validado localmente com containers saudáveis.

Pendências:

- Avaliar pinning por digest em política de release.

## Fase 6 - CI/CD e Cadeia de Suprimentos

Objetivo: automatizar qualidade e rastreabilidade.

Estado: linha de base concluída.

Entregas:

- GitHub Actions para formatação, lint, typecheck, testes, auditoria, varredura de segredo, SBOM, CodeQL, revisão de dependências, compilação OCI e varredura Trivy.
- Atualizações de dependências revisadas manualmente durante a submissão do desafio.
- SBOM CycloneDX via `npm run sbom`.

Pendências:

- Assinatura de imagens e proveniência quando houver registro OCI e política definidos.
- Proteção de branch no GitHub para exigir checks.

## Fase 7 - Observabilidade

Objetivo: tornar operação e troubleshooting mais previsíveis.

Estado: linha de base concluída.

Entregas:

- Request ID por requisição.
- Logs JSON com `timestamp`, `level`, `service`, `environment`, `message` e contexto.
- `/liveness`, `/readiness` e `/health`.

Pendências:

- Métricas e rastreamento OpenTelemetry se houver operação real ou implantação distribuída.

## Fase 8 - Documentação e Governança

Objetivo: deixar o projeto compreensível e auditável.

Estado: linha de base concluída.

Entregas:

- README com seções mínimas.
- `VERSION`.
- `CHANGELOG.md`.
- `CONTRIBUTING.md`.
- `SECURITY.md`.
- `docs/architecture/system-overview.md`.
- `docs/api/openapi.yaml`.
- `docs/runbooks/local-operations.md`.
- ADRs relevantes.

## Backlog Priorizado

- P1: adicionar teste de integração com MySQL em container.
- P1: habilitar proteção de branch exigindo CI.
- P1: definir registro OCI, política de tags SemVer, pinning por digest, assinatura e proveniência.
- P2: acompanhar release do ferramental Angular para remover vulnerabilidades moderadas restritas ao desenvolvimento restantes.
- P2: introduzir histórico de migrações se o esquema evoluir.
- P2: adicionar testes de frontend para interações principais.
- P3: adicionar autenticação/autorização somente se houver requisito multiusuário.
- P3: adicionar métricas/rastreamento OpenTelemetry se houver operação em ambiente compartilhado.
