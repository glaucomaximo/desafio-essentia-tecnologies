# API TechX Tasks

Documentação da API RESTful do desafio Essentia Group.

**Autor:** Glauco Maximo
**E-mail:** glaucomaximo@gmail.com

Contrato OpenAPI: `docs/api/openapi.yaml`.

## Saúde

| Método | Rota         | Descrição                                      |
| ------ | ------------ | ---------------------------------------------- |
| GET    | `/liveness`  | Confirma que o processo da API está vivo       |
| GET    | `/readiness` | Confirma que a API consegue acessar o MySQL    |
| GET    | `/health`    | Endpoint legado de compatibilidade operacional |

## Recurso: Tarefas

Uma tarefa representa uma atividade diária que pode estar pendente ou concluída.

```ts
interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}
```

Rota canônica:

```text
/api/v1/tasks
```

Alias legado preservado:

```text
/api/tasks
```

## Listar Tarefas

`GET /api/v1/tasks`

Retorna uma lista ordenada com tarefas pendentes primeiro e, em seguida, as concluídas.

## Buscar Tarefa

`GET /api/v1/tasks/:id`

Retorna `400` quando o id não é inteiro positivo e `404` quando a tarefa não existe.

## Criar Tarefa

`POST /api/v1/tasks`

```json
{
  "title": "Preparar daily",
  "description": "Revisar prioridades antes da reunião",
  "completed": false
}
```

Campos:

- `title`: obrigatório, texto com até 180 caracteres.
- `description`: opcional, texto ou `null`.
- `completed`: opcional, booleano. Quando omitido, assume `false`.

## Atualizar Tarefa

`PUT /api/v1/tasks/:id` ou `PATCH /api/v1/tasks/:id`

Aceita atualização parcial:

```json
{
  "completed": true
}
```

Retorna `400` quando nenhum campo válido é enviado e `404` quando o id não existe.

## Remover Tarefa

`DELETE /api/v1/tasks/:id`

Retorna `204` em caso de sucesso e `404` quando o id não existe.

## Erros

Erros retornam JSON com `message` e `requestId`.

```json
{
  "message": "Tarefa nao encontrada.",
  "requestId": "4df0549f-04fb-45ac-bf6c-2cb19f5da30d"
}
```
