# ADR-0002 - Container OCI First

Status: Aceita

Autor: Glauco Maximo <glaucomaximo@gmail.com>

## Contexto

O desafio exige um ambiente fullstack reprodutível com MySQL, backend e frontend. O projeto deve executar de forma consistente para avaliadores sem depender de configuração específica do host.

## Decisão

Usar Docker Compose para orquestração local e Dockerfiles compatíveis com OCI, com builds multiestágio, usuários de runtime sem root quando possível, configuração externa e healthchecks.

## Consequências

- Avaliadores podem executar a stack com um comando quando Docker estiver instalado.
- Imagens de runtime evitam dependências de desenvolvimento.
- Estado persistente permanece em volume de banco de dados, não nos containers da aplicação.

## Alternativas Consideradas

- Setup apenas no host: mantido como modo secundário de desenvolvimento, mas não como padrão.
- Kubernetes: rejeitado como desnecessário para o tamanho do projeto.

## Impacto de Segurança

Imagens evitam segredos embutidos e reduzem privilégios de runtime.

## Impacto de Migração

Nenhuma migração de dados da aplicação necessária.
