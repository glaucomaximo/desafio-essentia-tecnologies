# ADR-0001 - Monólito Modular

Estado: Aceita

Autor: Glauco Maximo <glaucomaximo@gmail.com>

## Contexto

O projeto é uma aplicação pequena de gerenciamento de tarefas, com um único domínio delimitado e um banco relacional. Não existem requisitos independentes de escala, disponibilidade, organização ou implantação que justifiquem serviços distribuídos.

## Decisão

Manter o sistema como monólito modular, com limites explícitos entre frontend/backend e limites incrementais entre módulos do backend.

## Consequências

- Menor complexidade operacional.
- Desenvolvimento e avaliação local mais simples.
- A arquitetura pode evoluir para `domain`, `application`, `infrastructure`, `interfaces` e `shared` conforme o comportamento crescer.

## Alternativas Consideradas

- Microserviços: rejeitado porque distribuição adicionaria risco operacional sem benefício atual.
- Serverless-first: rejeitado porque não melhora o escopo atual do desafio.

## Impacto de Segurança

Controles de segurança permanecem centralizados na API backend.

## Impacto de Migração

Nenhuma migração de dados necessária.
