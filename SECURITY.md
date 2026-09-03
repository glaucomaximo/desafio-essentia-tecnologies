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

O escopo atual implementa cadastro, login, JWT e isolamento server-side das tarefas por usuário. Proteções avançadas de conta, como MFA, recuperação de senha, bloqueio adaptativo e revogação centralizada de tokens, permanecem fora do escopo demonstrativo e devem ser tratadas como P1 antes de uso produtivo real.
