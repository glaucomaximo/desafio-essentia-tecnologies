# Visão Geral do Sistema

Autor: Glauco Maximo <glaucomaximo@gmail.com>

## Contexto

TechX Tasks é uma aplicação fullstack de gerenciamento de tarefas criada para o desafio Essentia Group. O sistema expõe uma API REST consumida por uma aplicação Angular de página única, autentica usuários com JWT e persiste dados em MySQL e MongoDB.

## Estilo Arquitetural

A arquitetura atual permanece como monólito modular dividido em dois processos implantáveis:

- `frontend`: SPA Angular 22.1.5 standalone, zoneless, Signals e Tailwind CSS 4.3.3, servida por Nginx sem privilégios de root.
- `backend`: API Express em Node.js/TypeScript.

MySQL e MongoDB são dependências externas com estado e não ficam embutidos nas imagens da aplicação.

```text
Navegador
  -> container frontend/Nginx
  -> proxy /api
  -> container API/Express
  -> MySQL para usuarios e tarefas
  -> MongoDB para metadados adicionais
```

## Módulos do Backend

- `auth`: assinatura e verificação JWT, hash de senha com `scrypt`.
- `config`: configuração orientada por variáveis de ambiente.
- `db`: conexões MySQL/MongoDB, prontidão e migrações idempotentes.
- `errors`: modelo de erro HTTP.
- `middleware`: tratamento assincrono, autenticacao, erros, contexto de requisicao e limite de requisicoes.
- `repositories`: adaptadores de persistencia para usuarios, tarefas e metadados.
- `routes`: interfaces HTTP de autenticação e tarefas.
- `schemas`: validação e normalização de payloads.
- `services`: casos de uso de autenticação e tarefas.
- `shared`: utilitarios transversais, como logging estruturado.

## Módulos do Frontend

- `core`: clientes HTTP, autenticação local segura para SSR e fachada reativa `TaskWorkspaceFacade`.
- `features/auth`: painel standalone de autenticação.
- `features/tasks`: formulário e lista standalone de tarefas.
- O componente raiz atua como composição visual e usa `@defer` para carregar a lista de tarefas sob demanda.

## Limites da API

A rota canônica da API é `/api/v1`. A rota anterior `/api/tasks` permanece disponível como alias de compatibilidade, agora protegida por JWT como a rota canônica.

As tarefas preservam o contrato principal e adicionam `metadata`:

```text
id, title, description, completed, metadata, createdAt, updatedAt
```

## Modelo de Dados

- MySQL `users`: identidade local, e-mail único e hash de senha.
- MySQL `tasks`: dados principais da tarefa e `owner_user_id`.
- MongoDB `task_metadata`: prioridade, prazo, etiquetas e observações por par usuário/tarefa.

Tarefas antigas em bancos já existentes recebem `owner_user_id` nulo durante a migração progressiva. Elas não ficam visíveis nas rotas autenticadas até serem associadas a um usuário por decisão operacional explícita.

## Modelo Operacional

- `/liveness` confirma que o processo da API está vivo.
- `/readiness` valida disponibilidade de MySQL e MongoDB.
- `/health` é preservado como endpoint legado leve.
- Logs são emitidos como linhas JSON em stdout/stderr.
- Cada requisição recebe o cabeçalho de resposta `X-Request-ID`.
- Docker Compose é o ambiente de execução local recomendado.

## Modelo de Seguranca

- Cadastro e login retornam JWT assinado com HS256.
- `JWT_SECRET` é obrigatório em produção e deve ter no mínimo 32 caracteres.
- Senhas são armazenadas com `scrypt`, sal aleatório e comparação em tempo constante.
- Rotas de tarefas exigem `Authorization: Bearer <token>`.
- Consultas e mutacoes de tarefas filtram por `owner_user_id` no servidor.
- Metadados no MongoDB usam índice único por `ownerUserId` e `taskId`.
- Cabeçalhos de segurança via Helmet, CORS configurado por ambiente e limite de corpo JSON permanecem ativos.
- Containers executam sem usuário root e recebem configuração por variáveis de ambiente.

## Caminho de Evolucao

O sistema deve continuar como monólito modular enquanto o domínio permanecer pequeno. Extraia serviços somente se houver justificativa objetiva, como escala independente, ciclos distintos de implantação ou isolamento operacional real.
