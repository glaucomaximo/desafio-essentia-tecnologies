# Padrões de Desenvolvimento

Diretrizes aplicadas neste projeto para manter uma entrega alinhada a práticas internacionais de desenvolvimento web.

**Autor:** Glauco Maximo
**E-mail:** glaucomaximo@gmail.com

## Engenharia

- TypeScript em modo estrito no backend e no frontend.
- Monólito modular com separação por responsabilidade: configuração, banco, erros, middleware, repositórios, rotas, validação, tipos e utilitários compartilhados.
- API REST versionada em `/api/v1`, com alias legado preservado em `/api/tasks`.
- Validação de entrada antes de acessar a camada de persistência.
- Tratamento centralizado de erros para respostas previsíveis.
- Testes automatizados para validação de payload e contratos HTTP.

## Operação

- Docker Compose como fluxo recomendado de execução.
- Containers de aplicação com builds multiestágio para reduzir superfície de runtime.
- Backend executando com usuário sem root dentro do container.
- Frontend servido por Nginx sem privilégios de root.
- Healthchecks para MySQL, backend e frontend.
- `/liveness` para processo e `/readiness` para dependência de banco.
- Configuração externa via variáveis de ambiente, com `.env.example` versionado.
- Shutdown gracioso no backend para encerrar servidor HTTP e pool do MySQL.

## Segurança

- Helmet no backend para cabeçalhos HTTP de segurança.
- CORS configurável por ambiente.
- SQL parametrizado via `mysql2`.
- Limite de requisições configurável para rotas `/api`.
- Limite de body JSON configurável.
- Logs estruturados com redação de chaves sensíveis.
- `.dockerignore` para reduzir contexto de build.
- `.gitignore` para manter credenciais, dependências, builds e SBOM local fora do versionamento.
- `npm audit --omit=dev` como controle de release.

## Qualidade

- Builds reprodutíveis com `package-lock.json` e `npm ci`.
- Prettier para formatação.
- ESLint para análise estática.
- `npm run typecheck`, `npm test` e `npm run build` como controles locais.
- OpenAPI em `docs/api/openapi.yaml`.
- ADRs para decisões arquiteturais relevantes.

## Cadeia de Suprimentos

- SBOM CycloneDX gerado por `npm run sbom`.
- CI com CodeQL, revisão de dependências, varredura de padrões de segredo, build de imagens e Trivy scan.
- Dependabot para npm, Docker e GitHub Actions.
- Assinatura e provenance devem ser adicionadas quando houver registry e política de release definidos.
