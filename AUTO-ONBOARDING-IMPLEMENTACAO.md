# Implementação — auto-onboarding após Stripe

**Status (22/10/2026): página inicial criada, integração de backend pendente.** A branch não altera o site público nem os Payment Links de produção.

## Página
- Arquivo: `auto-onboarding.html`.
- URL pretendida, **não publicada nem validada**: `https://onboarding.multiverso360.com.br/auto-onboarding.html?session_id={CHECKOUT_SESSION_ID}`.
- O cliente não seleciona plano; a página aguarda confirmação da API.
- Possui empresa, administrador, equipe, serviços em texto, expediente básico, FAQ, rascunho local e exportação JSON.
- Ainda faltam etapas completas de horários por dia/profissional, vínculo profissionais × serviços, contratos e integração do envio/provisionamento. O rascunho desta versão **não equivale** ao importador completo anterior.

## Contrato de API necessário
Endpoint GET `/api/stripe/validate-session?session_id=cs_...`

O frontend espera, para **sessão comprovadamente paga**:
```json
{
  "verified": true,
  "payment_status": "paid",
  "price_id": "price_1UTModF1t7IwHRiggWU8tdcU"
}
```
Quando inválida, incompleta, sem pagamento ou cancelada, responder HTTP 400/403/409 (não responder `verified:true`).

### Requisitos para o backend
1. Usar a chave secreta Stripe somente no servidor (n8n/backend); nunca no HTML/GitHub.
2. Consultar a Checkout Session usando a API Stripe autenticada; conferir `livemode`, `mode=subscription`, `payment_status=paid`, `subscription` e os line_items com price ID. Verificar se a assinatura permanece ativa, se aplicável.
3. Comparar price ID com lista permitida de seis preços atuais e derivar plano/periodicidade só do resultado Stripe.
4. Ter proteção anti-abuso, rate limiting, política de reuso da sessão e autenticação de retomada; **o session_id sozinho não deve garantir acesso indefinido**.
5. Persistir `checkout_session_id`, `customer_id`, `subscription_id`, identidade validada do contratante, plano e estado de onboarding no backend.
6. Validar limites novamente no backend quando receber o cadastro, sem confiar no JavaScript.
7. Receber webhook Stripe com verificação de assinatura, processar de forma idempotente e não provisionar antes da confirmação definitiva.
8. Atenção a dados pessoais em armazenamento local: rascunhos locais são apenas um recurso temporário; em produção, considerar rascunho autenticado no servidor com consentimento e proteção adequada.
9. Se o site estiver hospedado somente no GitHub Pages, `/api/stripe/validate-session` **não existirá automaticamente**. Publicar um backend real sob o mesmo domínio por reverse proxy ou alterar explicitamente a URL da API, considerando CORS seguro.
10. Os valores dos planos e seus limites na página são uma camada de apresentação; as decisões e permissões devem vir do backend.

## Critérios antes de ativar os 6 links
- Testes reais com Checkout em modo teste, conta com plano Solo/Equipe/Empresa, mensal/anual.
- Testes de sessão inexistente, outro produto, sessão não paga, cancelamento/reembolso e manipulação de URL.
- Verificar retomada, privacidade e envio do formulário até provisionamento.
- Configurar `after_completion: { type: "redirect", redirect: { url: "<URL-PUBLICA>?session_id={CHECKOUT_SESSION_ID}" } }` apenas quando domínio, API e fluxo forem publicados e validados.

Nenhum redirecionamento de produção foi alterado.
