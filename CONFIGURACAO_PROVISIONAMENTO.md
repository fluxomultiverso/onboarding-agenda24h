# Provisionamento pelo onboarding (branch `teste`)

1. Importe `workflow-provisionamento-webhook.json` como um novo workflow no n8n.
2. No primeiro node, crie ou selecione uma credencial **Header Auth** com nome `X-Agenda24h-Provisionamento-Key` e um valor secreto. Configure também as credenciais Supabase dos nodes HTTP.
3. Permita, no proxy do n8n, o preflight `OPTIONS` vindo de `https://onboarding.multiverso360.com.br`, com os cabeçalhos `Content-Type` e `X-Agenda24h-Provisionamento-Key`. O campo **Allowed Origins** do node Webhook cobre a resposta ao POST, mas não substitui essa configuração de preflight.
4. Ative o novo workflow e copie a URL **Production** do primeiro node. Na etapa **Revisão e saída** do onboarding, informe essa URL e a chave, confira o cadastro e toque em **Provisionar**.

O botão envia somente o objeto `provisionamento` em JSON. O primeiro node recebe esse objeto em `body`; `Validar JSON V2` continua validando os campos antes das chamadas ao Supabase. A chave não é gravada no repositório nem no rascunho. O workflow importado permanece desativado até a configuração no n8n.
