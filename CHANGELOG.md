# Histórico de Alterações

Todas as alterações relevantes deste projeto são documentadas aqui.

Autor: Glauco Maximo <glaucomaximo@gmail.com>

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
