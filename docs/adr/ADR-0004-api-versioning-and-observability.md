# ADR-0004 - Versionamento de API e Observabilidade Inicial

Status: Aceita

Autor: Glauco Maximo <glaucomaximo@gmail.com>

## Contexto

A API original expunha rotas de tarefas sem versionamento em `/api/tasks` e um único endpoint `/health`. A modernização requer evolução mais segura, semântica de saúde mais clara e correlação básica de requisições sem alterar o comportamento do desafio.

## Decisão

- Introduzir `/api/v1/tasks` como rota canônica.
- Preservar `/api/tasks` como alias de compatibilidade.
- Separar health em `/liveness` e `/readiness`.
- Preservar `/health` como endpoint de compatibilidade.
- Adicionar propagação de `X-Request-ID` e logging JSON estruturado.
- Adicionar limite de requisições configurável em memória para rotas de API.

## Consequências

- Consumidores podem migrar para `/api/v1/tasks` sem quebrar uso existente de `/api/tasks`.
- Orquestradores conseguem distinguir saúde do processo de readiness do banco.
- Logs ficam mais fáceis de correlacionar em suporte e investigação de incidentes.
- O limite de requisições em memória é adequado para este runtime de desafio em processo único, mas uma implantação distribuída exigiria store compartilhado.

## Alternativas Consideradas

- Substituir `/api/tasks` quebrando compatibilidade: rejeitado para evitar quebra desnecessária de contrato.
- Integração completa com OpenTelemetry: adiada porque o sistema é pequeno e ainda não justifica infraestrutura de tracing.
- Store externo para limite de requisições: adiado até haver escala horizontal.

## Impacto de Segurança

Positivo. Adiciona proteção contra abuso, diagnósticos mais seguros e evita expor stack traces ou segredos em logs estruturados.

## Impacto de Migração

Baixo. Clientes existentes continuam funcionando por `/api/tasks`; novos clientes devem usar `/api/v1/tasks`.
