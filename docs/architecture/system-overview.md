# Visao Geral do Sistema

Autor: Glauco Maximo <glaucomaximo@gmail.com>

## Contexto

TechX Tasks e uma aplicacao fullstack de gerenciamento de tarefas criada para o desafio Essentia Group. O sistema expoe uma API REST consumida por uma aplicacao Angular de pagina unica, autentica usuarios com JWT e persiste dados em MySQL e MongoDB.

## Estilo Arquitetural

A arquitetura atual permanece como monolito modular dividido em dois processos implantaveis:

- `frontend`: SPA Angular servida por Nginx sem privilegios de root.
- `backend`: API Express em Node.js/TypeScript.

MySQL e MongoDB sao dependencias externas com estado e nao ficam embutidos nas imagens da aplicacao.

```text
Navegador
  -> container frontend/Nginx
  -> proxy /api
  -> container API/Express
  -> MySQL para usuarios e tarefas
  -> MongoDB para metadados adicionais
```

## Modulos do Backend

- `auth`: assinatura e verificacao JWT, hash de senha com `scrypt`.
- `config`: configuracao orientada por variaveis de ambiente.
- `db`: conexoes MySQL/MongoDB, prontidao e migracoes idempotentes.
- `errors`: modelo de erro HTTP.
- `middleware`: tratamento assincrono, autenticacao, erros, contexto de requisicao e limite de requisicoes.
- `repositories`: adaptadores de persistencia para usuarios, tarefas e metadados.
- `routes`: interfaces HTTP de autenticacao e tarefas.
- `schemas`: validacao e normalizacao de payloads.
- `services`: casos de uso de autenticacao e tarefas.
- `shared`: utilitarios transversais, como logging estruturado.

## Limites da API

A rota canonica da API e `/api/v1`. A rota anterior `/api/tasks` permanece disponivel como alias de compatibilidade, agora protegida por JWT como a rota canonica.

As tarefas preservam o contrato principal e adicionam `metadata`:

```text
id, title, description, completed, metadata, createdAt, updatedAt
```

## Modelo de Dados

- MySQL `users`: identidade local, e-mail unico e hash de senha.
- MySQL `tasks`: dados principais da tarefa e `owner_user_id`.
- MongoDB `task_metadata`: prioridade, prazo, etiquetas e observacoes por par usuario/tarefa.

Tarefas antigas em bancos ja existentes recebem `owner_user_id` nulo durante a migracao progressiva. Elas nao ficam visiveis nas rotas autenticadas ate serem associadas a um usuario por decisao operacional explicita.

## Modelo Operacional

- `/liveness` confirma que o processo da API esta vivo.
- `/readiness` valida disponibilidade de MySQL e MongoDB.
- `/health` e preservado como endpoint legado leve.
- Logs sao emitidos como linhas JSON em stdout/stderr.
- Cada requisicao recebe o cabecalho de resposta `X-Request-ID`.
- Docker Compose e o ambiente de execucao local recomendado.

## Modelo de Seguranca

- Cadastro e login retornam JWT assinado com HS256.
- `JWT_SECRET` e obrigatorio em producao e deve ter no minimo 32 caracteres.
- Senhas sao armazenadas com `scrypt`, sal aleatorio e comparacao em tempo constante.
- Rotas de tarefas exigem `Authorization: Bearer <token>`.
- Consultas e mutacoes de tarefas filtram por `owner_user_id` no servidor.
- Metadados no MongoDB usam indice unico por `ownerUserId` e `taskId`.
- Cabeçalhos de seguranca via Helmet, CORS configurado por ambiente e limite de corpo JSON permanecem ativos.
- Containers executam sem usuario root e recebem configuracao por variaveis de ambiente.

## Caminho de Evolucao

O sistema deve continuar como monolito modular enquanto o dominio permanecer pequeno. Extraia servicos somente se houver justificativa objetiva, como escala independente, ciclos distintos de implantacao ou isolamento operacional real.
