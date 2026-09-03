# ADR-0005 - Linha de Base de CI e Cadeia de Suprimentos

Status: Aceita

Autor: Glauco Maximo <glaucomaximo@gmail.com>

## Contexto

O repositório não possuía CI/CD automatizado nem controles de qualidade para cadeia de suprimentos. O projeto deve ser reprodutível e auditável sem adicionar infraestrutura de release pesada.

## Decisão

Adicionar GitHub Actions para:

- instalação determinística com `npm ci`;
- formatação, lint, typecheck, testes e auditoria de dependências de produção;
- build de imagens Docker para backend e frontend;
- análise estática com CodeQL;
- revisão de dependências em pull requests;
- geração de SBOM CycloneDX a partir do lockfile.

## Consequências

- Pull requests recebem feedback automatizado de qualidade e segurança.
- SBOM é gerado como artefato de CI, em vez de ser versionado como saída gerada mutável.
- Assinatura de imagens, attestation de provenance e promoção para registry permanecem como trabalho futuro porque dependem de política do repositório e do registry.

## Alternativas Consideradas

- Checks apenas manuais: rejeitado porque regressões seriam fáceis de perder.
- Pipeline completo de implantação: adiado porque não há registry ou ambiente de destino definido.
- Implantação nativa em Kubernetes: rejeitada como desnecessária para este escopo.

## Impacto de Segurança

Positivo. Adiciona SAST, revisão de dependências, auditoria de produção e artefato SBOM.

## Impacto de Migração

Baixo. Não há mudanças de comportamento em runtime. Mantenedores do repositório devem habilitar branch protection para exigir os checks de CI.
