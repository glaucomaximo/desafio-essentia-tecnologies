# ADR-0003 - Atualização de Ambiente de Execução e Dependências

Estado: Aceita

Autor: Glauco Maximo <glaucomaximo@gmail.com>

## Contexto

`npm audit` reportou vulnerabilidades altas em pacotes Angular 18 de produção e vulnerabilidades moderadas em dependências transitivas do Express 4. Angular 22 requer ambiente Node.js mais novo e TypeScript 6.0.x.

## Decisão

Atualizar Angular e Express em uma etapa controlada, alinhar Node.js para 24.15.0 ou ambiente compatível mais novo, atualizar TypeScript para a faixa compatível 6.0.x e validar com compilação, typecheck, testes e auditoria.

## Consequências

- Reduz vulnerabilidades conhecidas de dependências.
- Aumenta a versão mínima do Node.
- Exige alinhamento de imagens de container e `.nvmrc` com o novo ambiente de execução.

## Alternativas Consideradas

- Permanecer em Angular 18 e documentar exceções: rejeitado porque vulnerabilidades de produção são evitáveis neste projeto pequeno.
- Atualizar TypeScript para 7.x: rejeitado temporariamente porque Angular 22.1.5 exige TypeScript `>=6.0 <6.1`.

## Impacto de Segurança

Reduz exposição a advisories conhecidos de XSS, DoS e cadeia de suprimentos.

## Impacto de Migração

Impacto funcional esperado baixo pela pequena superfície do frontend, mas compilação e comportamento da interface devem ser revalidados.
