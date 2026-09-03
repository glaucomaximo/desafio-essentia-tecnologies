# Histórico de Alterações

Todas as alterações relevantes deste projeto são documentadas aqui.

Autor: Glauco Maximo <glaucomaximo@gmail.com>

## [1.0.0] - 2026-09-02

### Adicionado

- Aplicação fullstack de gerenciamento de tarefas para o desafio Essentia Group.
- Frontend Angular, API Node.js/TypeScript e persistência MySQL.
- Ambiente Docker Compose com serviços de backend, frontend e MySQL.
- Auditoria de legado, plano de modernização e Registros de Decisão Arquitetural.
- Endpoints de liveness/readiness, request IDs, logs JSON estruturados e limite de requisições na API.
- Contrato OpenAPI, política de segurança, guia de contribuição e arquivo de versão SemVer.
- Pipeline GitHub Actions com build, testes, auditoria, build de container, SAST e geração de SBOM.

### Alterado

- Linha de base de runtime atualizada para Node.js 24.15.0.
- Framework da API atualizado para Express 5 e frontend atualizado para Angular 22.
- Rota versionada `/api/v1/tasks` adicionada, preservando `/api/tasks` como alias de compatibilidade.

### Segurança

- Vulnerabilidades conhecidas de dependências de produção removidas após atualização controlada.
- Override do pacote `qs` adicionado para manter a resolução de runtime em versão corrigida.
