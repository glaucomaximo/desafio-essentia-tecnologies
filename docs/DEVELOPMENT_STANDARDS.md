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
- Containers de aplicação com compilações multiestágio para reduzir superfície de execução.
- Backend executando com usuário sem root dentro do container.
- Frontend servido por Nginx sem privilégios de root.
- Verificações de saúde para MySQL, backend e frontend.
- `/liveness` para processo e `/readiness` para dependência de banco.
- Configuração externa via variáveis de ambiente, com `.env.example` versionado.
- Shutdown gracioso no backend para encerrar servidor HTTP e pool do MySQL.

## Segurança

- Helmet no backend para cabeçalhos HTTP de segurança.
- CORS configurável por ambiente.
- SQL parametrizado via `mysql2`.
- Limite de requisições configurável para rotas `/api`.
- Limite de corpo JSON configurável.
- Logs estruturados com redação de chaves sensíveis.
- `.dockerignore` para reduzir contexto de compilação.
- `.gitignore` para manter credenciais, dependências, compilações e SBOM local fora do versionamento.
- `npm audit --omit=dev` como controle de release.

## Qualidade

- Compilações reprodutíveis com `package-lock.json` e `npm ci`.
- Prettier para formatação.
- ESLint para análise estática.
- `npm run typecheck`, `npm test` e `npm run build` como controles locais.
- OpenAPI em `docs/api/openapi.yaml`.
- ADRs para decisões arquiteturais relevantes.

## Cadeia de Suprimentos

- SBOM CycloneDX gerado por `npm run sbom`.
- CI com CodeQL, revisão de dependências, varredura de padrões de segredo, compilação de imagens e varredura Trivy.
- Atualizações de dependências devem ser propostas, revisadas e versionadas manualmente durante a submissão do desafio.
- Assinatura e proveniência devem ser adicionadas quando houver registro OCI e política de release definidos.
