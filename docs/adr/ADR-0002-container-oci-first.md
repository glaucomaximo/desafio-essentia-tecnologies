# ADR-0002 - Container/OCI como Padrão

Estado: Aceita

Autor: Glauco Maximo <glaucomaximo@gmail.com>

## Contexto

O desafio exige um ambiente fullstack reprodutível com MySQL, backend e frontend. O projeto deve executar de forma consistente para avaliadores sem depender de configuração específica do host.

## Decisão

Usar Docker Compose para orquestração local e Dockerfiles compatíveis com OCI, com compilações multiestágio, usuários de execução sem root quando possível, configuração externa e verificações de saúde.

## Consequências

- Avaliadores podem executar a stack com um comando quando Docker estiver instalado.
- Imagens de execução evitam dependências de desenvolvimento.
- Estado persistente permanece em volume de banco de dados, não nos containers da aplicação.

## Alternativas Consideradas

- Configuração apenas no host: mantida como modo secundário de desenvolvimento, mas não como padrão.
- Kubernetes: rejeitado como desnecessário para o tamanho do projeto.

## Impacto de Segurança

Imagens evitam segredos embutidos e reduzem privilégios de execução.

## Impacto de Migração

Nenhuma migração de dados da aplicação necessária.
