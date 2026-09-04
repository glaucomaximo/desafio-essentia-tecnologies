# Histórico de Alterações

Todas as alterações relevantes deste projeto são documentadas aqui.

Autor: Glauco Maximo <glaucomaximo@gmail.com>

## [2.1.1] - 2026-09-04

### Corrigido

- Removidas da interface inicial as informações institucionais de autor, título e descrição.
- Tela de autenticação simplificada para um fluxo mais limpo e profissional.
- Cadastro e login agora exibem mensagens específicas para e-mail já cadastrado, credenciais inválidas, dados incompletos e API indisponível.
- Campo de nome deixou de ser pré-preenchido na criação de conta.

### Validado

- Versão SemVer sincronizada entre pacotes, Docker Compose, ambiente de exemplo e contrato OpenAPI.

## [2.1.0] - 2026-09-03

### Adicionado

- Tailwind CSS 4.3.3 integrado ao build Angular via PostCSS.
- Componentes standalone de autenticação, formulário e lista de tarefas com APIs reativas `input()` e `output()`.
- ADR para adoção de frontend Angular zoneless, Signals e Tailwind.

### Alterado

- Frontend migrado para aplicação zoneless com `provideZonelessChangeDetection`.
- Removido `zone.js` do runtime e dos polyfills do Angular.
- Template raiz e componentes migrados de `*ngIf`/`*ngFor` para `@if`, `@for`, `@switch` e `@defer`.
- Lista de tarefas carregada em chunk lazy por `@defer (on viewport; prefetch on idle)`.
- Orquestração de autenticação, formulários e tarefas movida para fachada injetável baseada em Signals.
- `AuthStorage` tornado seguro para SSR/hydration por meio de `isPlatformBrowser`.

### Documentado

- TypeScript 7 permanece bloqueado temporariamente porque Angular 22.1.5 suporta oficialmente TypeScript `>=6.0 <6.1`.

### Mudança Incompatível

- Nenhuma breaking change funcional ou de API.

## [2.0.0] - 2026-09-03

### Adicionado

- Autenticação de usuários com cadastro, login, endpoint `/api/v1/auth/me` e JWT.
- Hash de senha com `scrypt`, sal aleatório e comparação em tempo constante.
- Isolamento server-side de tarefas por usuário autenticado.
- Metadados adicionais de tarefas em MongoDB: prioridade, prazo, etiquetas e observações.
- Serviço MongoDB no Docker Compose com healthcheck e volume persistente.
- Testes HTTP de autenticação, autorização, isolamento por usuário e metadados.
- ADR para autenticação JWT e MongoDB.

### Alterado

- Rotas `/api/v1/tasks` e alias legado `/api/tasks` agora exigem `Authorization: Bearer <token>`.
- Readiness da API agora valida MySQL e MongoDB.
- README, API, OpenAPI, arquitetura, runbook e política de segurança atualizados para o desafio extra.

### Mudança Incompatível

- Consumidores das rotas de tarefas precisam autenticar antes de listar, criar, alterar ou remover tarefas.

## [1.1.3] - 2026-09-03

### Corrigido

- Atualizados pacotes OpenSSL da imagem runtime do backend durante o build OCI.
- Removidos `npm`, `npx` e `corepack` da imagem final do backend, reduzindo superfície de ataque em produção.
- Atualizada a imagem runtime do frontend para Nginx unprivileged suportado, com atualização mínima de bibliotecas do sistema usadas pelo scanner OCI.

## [1.1.2] - 2026-09-03

### Corrigido

- Atualizada a ação Trivy do CI para uma versão existente e estável, restaurando o job de build e varredura OCI no GitHub Actions.

## [1.1.1] - 2026-09-03

### Alterado

- Removida automação de atualização de dependências para manter o ciclo de vida da submissão aderente ao desafio.
- Documentação ajustada para tratar atualizações de dependências como revisão manual e rastreável.
- Padronizada a normalização de fim de linha do repositório.

### Validado

- Branch local de publicação reconstruída com commits incrementais e sem commits de automações no caminho.

## [1.1.0] - 2026-09-03

### Adicionado

- Wrapper `npm run docker` para localizar o Docker Desktop no Windows mesmo quando `docker.exe` não está no PATH.
- Script `docker:config` para validar a configuração final do Docker Compose.

### Alterado

- Documentação de execução Docker atualizada para usar os scripts reprodutíveis do projeto.
- `.dockerignore` sanitizado para reduzir risco de envio de artefatos locais, arquivos de ambiente e chaves ao contexto de compilação.
- Compose agora propaga `APP_VERSION` para a API, mantendo verificações de saúde coerentes com a versão SemVer.

### Validado

- Compilação Docker real de MySQL, backend e frontend.
- Containers Docker com verificações de saúde saudáveis.
- Teste de fumaça de API e frontend via proxy Nginx containerizado.
- Ambiente de desenvolvimento local validado com backend e frontend no host usando MySQL em container.

## [1.0.1] - 2026-09-03

### Corrigido

- Atualização reativa da interface Angular após chamadas assíncronas da API.
- Estado de carregamento da lista de tarefas agora é encerrado corretamente no navegador.

## [1.0.0] - 2026-09-02

### Adicionado

- Aplicação fullstack de gerenciamento de tarefas para o desafio Essentia Group.
- Frontend Angular, API Node.js/TypeScript e persistência MySQL.
- Ambiente Docker Compose com serviços de backend, frontend e MySQL.
- Auditoria de legado, plano de modernização e Registros de Decisão Arquitetural.
- Endpoints de vivacidade/prontidão, request IDs, logs JSON estruturados e limite de requisições na API.
- Contrato OpenAPI, política de segurança, guia de contribuição e arquivo de versão SemVer.
- Pipeline GitHub Actions com compilação, testes, auditoria, compilação de container, SAST e geração de SBOM.

### Alterado

- Linha de base do ambiente de execução atualizada para Node.js 24.15.0.
- Framework da API atualizado para Express 5 e frontend atualizado para Angular 22.
- Rota versionada `/api/v1/tasks` adicionada, preservando `/api/tasks` como alias de compatibilidade.

### Segurança

- Vulnerabilidades conhecidas de dependências de produção removidas após atualização controlada.
- Override do pacote `qs` adicionado para manter a resolução de produção em versão corrigida.
