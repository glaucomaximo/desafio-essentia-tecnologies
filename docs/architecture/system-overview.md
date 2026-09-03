# Visão Geral do Sistema

Autor: Glauco Maximo <glaucomaximo@gmail.com>

## Contexto

TechX Tasks é uma pequena aplicação fullstack de gerenciamento de tarefas criada para o desafio Essentia Group. O sistema expõe uma API REST consumida por uma aplicação Angular de página única e persiste tarefas em MySQL.

## Estilo Arquitetural

A arquitetura atual é um monólito modular dividido em dois processos implantáveis:

- `frontend`: SPA Angular servida por Nginx sem privilégios de root.
- `backend`: API Express em Node.js/TypeScript.

O MySQL é uma dependência externa com estado e não fica embutido nas imagens da aplicação.

```text
Navegador
  -> container frontend/Nginx
  -> proxy /api
  -> container API/Express
  -> container MySQL ou MySQL gerenciado
```

## Módulos do Backend

- `config`: configuração orientada por variáveis de ambiente.
- `db`: pool MySQL, readiness de banco e bootstrap idempotente de esquema.
- `errors`: modelo de erro HTTP.
- `middleware`: tratamento assíncrono, erros, contexto de requisição e limite de requisições.
- `repositories`: adaptador de persistência SQL para tarefas.
- `routes`: interface HTTP do recurso de tarefas.
- `schemas`: validação e normalização de payloads.
- `shared`: utilitários transversais, como logging estruturado.

## Limites da API

A rota canônica da API é `/api/v1/tasks`. A rota anterior `/api/tasks` permanece disponível como alias de compatibilidade.

As respostas preservam o formato público de tarefa:

```text
id, title, description, completed, createdAt, updatedAt
```

## Modelo Operacional

- `/liveness` confirma que o processo da API está vivo.
- `/readiness` valida disponibilidade do banco de dados.
- `/health` é preservado como endpoint legado leve.
- Logs são emitidos como linhas JSON em stdout/stderr.
- Cada requisição recebe o cabeçalho de resposta `X-Request-ID`.
- Docker Compose é o runtime local recomendado.

## Modelo de Segurança

O escopo atual do desafio não possui usuários, papéis ou autenticação. Os controles de segurança focam em padrões seguros:

- Cabeçalhos de segurança via Helmet.
- CORS configurado por ambiente.
- Limite de corpo JSON.
- SQL parametrizado.
- Limite de requisições na API.
- Containers sem usuário root.
- Nenhum segredo embutido nas imagens.

## Caminho de Evolução

Se o domínio crescer, introduza uma camada de serviço de aplicação antes de adicionar mais endpoints. Mantenha o sistema como monólito modular, salvo quando escala independente, cadência distinta de implantação ou isolamento de falhas justificarem extração de serviços.
