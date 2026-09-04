# Política de Segurança

Autor: Glauco Maximo <glaucomaximo@gmail.com>

## Versão Suportada

A versão suportada da aplicação é rastreada em `VERSION`. Este repositório atualmente tem como alvo a linha `1.2.x`.

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
- Senhas devem ser armazenadas somente com hash forte e sal por credencial.
- JWT deve usar segredo externo, emissor, audiência e expiração configuráveis.
- Rotas de tarefas devem negar acesso quando o usuário autenticado não for o proprietário.

## Escopo Atual

O escopo atual implementa cadastro, login, JWT com identificador `jti`, isolamento server-side das tarefas por usuário, MFA TOTP, recuperação de senha por token de uso único, bloqueio adaptativo por falhas repetidas e revogação centralizada de sessões. Em produção, o envio de tokens de recuperação deve ocorrer por canal externo seguro e auditável.
