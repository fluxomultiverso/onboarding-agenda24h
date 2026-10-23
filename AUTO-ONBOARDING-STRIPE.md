# Auto-onboarding do cliente — integração Stripe

## Objetivo
Depois de concluir checkout no Stripe, direcionar o contratante a uma página de auto-onboarding configurada automaticamente com o plano realmente contratado, na branch `auto-onboarding-cliente`.

## Preços ativos — identificadores verificados em 22/10/2026
| Plano | Mensal (price ID) | Anual (price ID) |
|---|---|---|
| Solo | price_1UTModF1t7IwHRiggWU8tdcU | price_1UTMtCF1t7IwHRigwBLiYuwU |
| Equipe | price_1UTMogF1t7IwHRigAKQyftgS | price_1UTMtFF1t7IwHRig7QtzrqMS |
| Empresa | price_1UTMoiF1t7IwHRigEeScSg3G | price_1UTMtHF1t7IwHRig3vkbE2YP |

## Regras por plano
- Solo: 1 profissional, 1 administrador, 0 recepcionistas
- Equipe: até 5 profissionais, 1 administrador, 1 recepcionista
- Empresa: até 15 profissionais, 1 administrador, 2 recepcionistas

## Fluxo obrigatório
1. Cliente seleciona plano/periodicidade na landing page.
2. Stripe processa o checkout.
3. O Payment Link usa `after_completion.type=redirect` com URL do auto-onboarding incluindo `{CHECKOUT_SESSION_ID}`, por exemplo `https://onboarding.multiverso360.com.br/auto-onboarding.html?session_id={CHECKOUT_SESSION_ID}`.
4. Um endpoint servidor recebe `session_id`, consulta Stripe usando chave **secreta no servidor**, verifica status de pagamento/assinatura e confere o price ID efetivamente comprado.
5. Endpoint retorna **apenas** informações autorizadas: plano, periodicidade, limites e um contexto de onboarding com validade controlada. Nunca confiar em plano ou preço de query string, nunca expor chave secreta no browser.
6. Formulário bloqueia entradas acima dos limites contratados e faz validação no servidor novamente no envio.
7. Persistir vínculo inequívoco entre checkout session, customer/subscription, empresa e rascunho/provisionamento. Impedir reaproveitamento indevido e envios duplicados.

## Pendências antes de ativar redirecionamentos nos seis links de produção
- Implementar endpoint seguro de verificação Stripe e consulta aos itens da sessão.
- Decidir armazenamento da sessão/autorização e regra de recuperação do cadastro interrompido.
- Criar `auto-onboarding.html` e adaptar coleta de dados sem ferramentas internas, sem exposição de chaves e sem provisionamento direto pelo navegador.
- Testar pagamentos em ambiente de teste, sessão inválida, não paga, cancelada e plano adulterado.
- Somente depois trocar `after_completion` nos seis Payment Links ativos.

## Proteção operacional
Apenas redirecionar após checkout não prova sozinho o recebimento definitivo. Confirmar pagamento e eventos de assinatura por webhook com verificação de assinatura antes de provisionar. Não modificar `main`, `teste` nem os links de produção até o fluxo completo estar testado.
