# Política de Segurança

Autor: Glauco Maximo <glaucomaximo@gmail.com>

## Versão Suportada

A versão suportada da aplicação é rastreada em `VERSION`. Este repositório atualmente tem como alvo a linha `1.0.x`.

## Reporte de Vulnerabilidade

Reporte vulnerabilidades de forma privada para Glauco Maximo em glaucomaximo@gmail.com. Inclua:

- componente ou endpoint afetado;
- passos de reprodução;
- impacto esperado e observado;
- logs ou exemplos de requisição com segredos removidos.

## Linha de Base de Segurança

- A configuração deve vir de variáveis de ambiente ou de um gerenciador externo de segredos.
- O repositório não deve conter segredos reais.
- Containers devem executar sem usuário root.
- Vulnerabilidades HIGH ou CRITICAL em dependências de produção devem bloquear release, salvo exceção documentada.
- Erros da API não devem expor stack traces ou segredos.
- Logs devem redigir chaves contendo password, secret, token, authorization, cookie ou API key.

## Escopo Atual

Autenticação e autorização eram opcionais no desafio original e não foram implementadas neste escopo demonstrativo. Se o projeto se tornar multiusuário ou exposto externamente, autorização server-side, autenticação, proteções de conta e isolamento entre usuários passam a ser trabalho P1.
