# API TechX Tasks

Documentacao da API RESTful do desafio Essentia Group.

**Autor:** Glauco Maximo
**E-mail:** glaucomaximo@gmail.com

Contrato OpenAPI: `docs/api/openapi.yaml`.

## Saude

| Metodo | Rota         | Descricao                                           |
| ------ | ------------ | --------------------------------------------------- |
| GET    | `/liveness`  | Confirma que o processo da API esta vivo            |
| GET    | `/readiness` | Confirma que a API consegue acessar MySQL e MongoDB |
| GET    | `/health`    | Endpoint legado de compatibilidade operacional      |

## Observabilidade

| Metodo | Rota       | Descricao                                               |
| ------ | ---------- | ------------------------------------------------------- |
| GET    | `/metrics` | Expoe metricas de processo e HTTP em formato Prometheus |

Exemplos de series:

```text
process_uptime_seconds
process_memory_rss_bytes
http_requests_total
http_request_duration_seconds
```

## Autenticacao

As rotas de tarefas exigem JWT no cabecalho:

```text
Authorization: Bearer <token>
```

### Criar Usuario

`POST /api/v1/auth/register`

```json
{
  "name": "Glauco Maximo",
  "email": "glauco@example.test",
  "password": "Senha1234"
}
```

### Entrar

`POST /api/v1/auth/login`

```json
{
  "email": "glauco@example.test",
  "password": "Senha1234",
  "mfaCode": "123456"
}
```

`mfaCode` e obrigatorio somente quando MFA estiver habilitado para a conta.

### Consultar Sessao

`GET /api/v1/auth/me`

Retorna o usuario autenticado quando o JWT e valido.

### Recuperar Senha

`POST /api/v1/auth/password-reset/request`

```json
{
  "email": "glauco@example.test"
}
```

Retorna `202` mesmo quando o e-mail nao existe para reduzir enumeracao de contas. Em desenvolvimento, a resposta pode incluir `resetToken` para teste local. Em producao, o token deve ser enviado por canal externo controlado.

`POST /api/v1/auth/password-reset/confirm`

```json
{
  "token": "token-recebido",
  "password": "NovaSenha123"
}
```

Ao trocar a senha, todas as sessoes ativas do usuario sao revogadas.

### MFA TOTP

`POST /api/v1/auth/mfa/setup`

Requer JWT e retorna `secret` e `otpauthUrl` compativeis com apps autenticadores.

`POST /api/v1/auth/mfa/enable`

```json
{
  "code": "123456"
}
```

Valida o codigo TOTP atual e habilita MFA para logins futuros.

### Encerrar Sessoes

`POST /api/v1/auth/logout`

Revoga centralmente a sessao JWT atual.

`POST /api/v1/auth/logout-all`

Revoga todas as sessoes ativas do usuario autenticado.

## Recurso: Tarefas

Uma tarefa representa uma atividade diaria que pertence ao usuario autenticado.

```ts
interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  metadata: {
    priority: "low" | "medium" | "high";
    dueDate: string | null;
    tags: string[];
    notes: string | null;
  };
  createdAt: string;
  updatedAt: string;
}
```

Rota canonica:

```text
/api/v1/tasks
```

Alias legado preservado:

```text
/api/tasks
```

## Listar Tarefas

`GET /api/v1/tasks`

Retorna tarefas do usuario autenticado, com pendentes primeiro e concluidas depois.

## Buscar Tarefa

`GET /api/v1/tasks/:id`

Retorna `400` quando o id nao e inteiro positivo, `401` quando o token esta ausente ou invalido, e `404` quando a tarefa nao pertence ao usuario autenticado ou nao existe.

## Criar Tarefa

`POST /api/v1/tasks`

```json
{
  "title": "Preparar daily",
  "description": "Revisar prioridades antes da reuniao",
  "completed": false,
  "metadata": {
    "priority": "high",
    "dueDate": "2026-09-10",
    "tags": ["api", "documentacao"],
    "notes": "Confirmar criterios de aceite"
  }
}
```

Campos:

- `title`: obrigatorio, texto com ate 180 caracteres.
- `description`: opcional, texto ou `null`.
- `completed`: opcional, booleano. Quando omitido, assume `false`.
- `metadata.priority`: opcional, `low`, `medium` ou `high`. Quando omitido, assume `medium`.
- `metadata.dueDate`: opcional, data `YYYY-MM-DD` ou `null`.
- `metadata.tags`: opcional, ate 10 textos unicos com ate 40 caracteres cada.
- `metadata.notes`: opcional, texto com ate 1000 caracteres ou `null`.

## Atualizar Tarefa

`PUT /api/v1/tasks/:id` ou `PATCH /api/v1/tasks/:id`

Aceita atualizacao parcial:

```json
{
  "completed": true
}
```

Tambem aceita atualizacao apenas dos metadados:

```json
{
  "metadata": {
    "priority": "low",
    "tags": ["suporte"]
  }
}
```

Retorna `400` quando nenhum campo valido e enviado e `404` quando o id nao existe no escopo do usuario autenticado.

## Remover Tarefa

`DELETE /api/v1/tasks/:id`

Retorna `204` em caso de sucesso e `404` quando o id nao existe no escopo do usuario autenticado.

## Erros

Erros retornam JSON com `message` e `requestId`.

```json
{
  "message": "Tarefa nao encontrada.",
  "requestId": "4df0549f-04fb-45ac-bf6c-2cb19f5da30d"
}
```
