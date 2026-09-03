# Guia de Contribuição

Autor: Glauco Maximo <glaucomaximo@gmail.com>

## Linha de Base de Engenharia

Este projeto segue uma abordagem pragmática de monólito modular. Mantenha mudanças pequenas, testadas e reversíveis. Não introduza arquitetura distribuída, nova infraestrutura ou novas dependências sem reduzir um risco concreto ou atender a um requisito explícito.

## Fluxo Local

1. Use Node.js `24.15.0` e npm `11+`.
2. Instale dependências com `npm ci`.
3. Execute `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` antes de abrir um pull request.
4. Execute `npm audit --omit=dev` para checagens de dependências de produção.
5. Use `npm run sbom` ao preparar um artefato de release.

## Estilo de Commit

Prefira Conventional Commits em português quando for prático:

- `build:`
- `chore:`
- `ci:`
- `docs:`
- `feat:`
- `fix:`
- `refactor:`
- `security:`
- `test:`

Exemplo:

```text
feat: entrega aplicação fullstack modernizada
```

## Regras de Segurança

- Nunca versione credenciais reais, tokens, chaves privadas ou strings de conexão de produção.
- Mantenha segredos fora das imagens e do controle de versão.
- Não reduza validação, limite de requisições, tratamento de erros ou cabeçalhos de segurança para facilitar o desenvolvimento.
- Trate credenciais hardcoded suspeitas como comprometidas e faça rotação no sistema proprietário.

## Decisões Arquiteturais

Registre decisões relevantes em `docs/adr/` usando o formato existente. Não crie ADRs para edições triviais.
