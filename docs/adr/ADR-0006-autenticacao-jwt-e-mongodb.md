# ADR-0006 - Autenticacao JWT e MongoDB para Metadados

Status: Aceita

## Contexto

O desafio extra solicita autenticacao de usuarios com JWT e integracao com banco NoSQL para armazenar informacoes adicionais sobre tarefas. O sistema ja possui API REST, frontend Angular, MySQL para tarefas e arquitetura pequena adequada a monolito modular.

## Decisao

Implementar cadastro e login no backend, emitir JWT assinado com HS256 e proteger as rotas de tarefas com Bearer token. Armazenar usuarios e hash de senha no MySQL, mantendo o registro principal das tarefas no MySQL com `owner_user_id`.

Usar MongoDB para os metadados adicionais da tarefa: prioridade, prazo, etiquetas e observacoes. O MongoDB tera indice unico por `ownerUserId` e `taskId`.

## Consequencias

- O contrato de tarefas passa a exigir autenticacao.
- O alias legado `/api/tasks` continua existindo, mas tambem exige JWT.
- O frontend passa a oferecer cadastro/login e a enviar o token automaticamente nas chamadas `/api`.
- A prontidao da API depende de MySQL e MongoDB.
- Bancos existentes recebem `owner_user_id` nulo em tarefas antigas; essas tarefas nao aparecem para usuarios autenticados ate associacao operacional explicita.

## Alternativas Consideradas

- Armazenar todos os dados em MongoDB: rejeitado porque alteraria a fonte principal de tarefas e aumentaria risco de regressao sem necessidade.
- Armazenar metadados no MySQL: rejeitado porque nao atenderia ao requisito opcional de banco NoSQL.
- Usar ORM completo: rejeitado nesta rodada porque os repositórios atuais sao pequenos, parametrizados e suficientes.

## Impacto de Seguranca

- Senhas sao armazenadas com `scrypt`, sal aleatorio e comparacao em tempo constante.
- `JWT_SECRET` deve ser externo e e obrigatorio em producao.
- Tokens possuem emissor, audiencia e expiracao configuraveis.
- Autorizacao server-side filtra tarefas por proprietario, reduzindo risco de IDOR/BOLA.
- Protecoes avançadas de conta, como MFA, recuperacao de senha e revogacao centralizada, permanecem fora do escopo demonstrativo.

## Impacto de Migracao

- Criar tabela `users`.
- Adicionar `owner_user_id` nullable em `tasks`, indice por proprietario/status/data e chave estrangeira para `users`.
- Criar indices do MongoDB para `task_metadata`.
- Manter migracao progressiva e nao destrutiva para preservar dados existentes.
