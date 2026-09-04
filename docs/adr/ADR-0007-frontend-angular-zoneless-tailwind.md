# ADR-0007 - Frontend Angular Zoneless, Signals e Tailwind CSS

Estado: Aceita

Autor: Glauco Maximo <glaucomaximo@gmail.com>

## Contexto

O frontend já estava em Angular 22, mas ainda mantinha `zone.js`, polyfill de zonas, templates com `*ngIf`/`*ngFor`, acesso direto a APIs de navegador e CSS local concentrado no componente raiz. A referência visual estudada do Easy Health reforça um padrão de SaaS de saúde com módulos integrados, segurança/LGPD, dados em nuvem e uso multi-dispositivo.

TypeScript 7.0.2 está publicado no npm, mas `@angular/compiler-cli@22.1.5` declara suporte oficial apenas para TypeScript `>=6.0 <6.1`.

## Decisão

Migrar o frontend para execução zoneless com `provideZonelessChangeDetection`, remover `zone.js` do runtime Angular, usar Signals como fonte de estado da interface e manter RxJS restrito às chamadas HTTP. Os dados de tarefas expostos ao template passam por `toSignal`.

Separar a interface em componentes standalone com `input()` e `output()`, substituir diretivas estruturais legadas por `@if`, `@for`, `@switch` e usar `@defer` para carregar a lista de tarefas em chunk lazy. Integrar Tailwind CSS 4.3.3 ao build por PostCSS.

Manter TypeScript 6.0.3 até existir suporte oficial do Angular a TypeScript 7.

## Consequências

- Reduz acoplamento ao mecanismo antigo de detecção de mudanças.
- Melhora previsibilidade de renderização e prepara o frontend para SSR/hydration segura.
- Reduz CSS local específico e aproxima a UI de um padrão operacional de SaaS.
- Introduz Tailwind como dependência de desenvolvimento do frontend.
- TypeScript 7 fica registrado como decisão bloqueada por compatibilidade oficial, não por preferência.

## Alternativas Consideradas

- Manter `zone.js`: rejeitado porque o objetivo desta rodada exige aplicação zoneless.
- Instalar TypeScript 7 imediatamente: rejeitado porque quebraria o contrato de peer dependency do Angular 22.1.5.
- Fazer uma reescrita total da UI: rejeitado porque o escopo é modernização incremental e o CRUD atual deve permanecer estável.

## Impacto de Segurança

O storage de sessão foi tornado seguro para SSR por `isPlatformBrowser`, removendo acesso direto a `window`. A UI mantém autenticação JWT existente e não introduz novos segredos ou chamadas externas.

## Impacto de Migração

Não há mudança incompatível de API ou regra de negócio. O build e os testes de fumaça devem ser reexecutados porque a renderização agora não depende de zonas e a lista de tarefas é carregada por chunk lazy.
