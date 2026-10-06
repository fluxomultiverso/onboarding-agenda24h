# Reativação por serviço

Na etapa **Serviços**, cada serviço tem:

- Prazo inteiro e positivo, em **dias** ou **meses de calendário**.
- Convite para **manutenção do serviço realizado** ou **agendamento de um novo serviço**.

Os valores aparecem na revisão, no resumo HTML e no JSON de provisionamento. O rascunho preserva as escolhas. Rascunhos antigos continuam abrindo; serviços sem prazo precisam ser preenchidos antes do provisionamento. O onboarding habilita a reativação automática da empresa ao provisionar serviços com prazo definido.

## Ativação no ambiente

1. Aplicar `reativacao-por-servico.sql` no Supabase. A atualização é transacional e preserva as funções instaladas. Se a definição instalada divergir do formato esperado, a atualização aborta sem alterações.
2. Atualizar o workflow de provisionamento com `workflow-provisionamento-reativacao.json`, preservando as credenciais configuradas e o endereço do webhook V13. Substituir o workflow existente; não ativar dois webhooks com o mesmo endereço.
3. Substituir o consumidor de reativação pós-atendimento V2 pelo `workflow-reativacao-por-servico-v3.json`, configurando as credenciais existentes. O arquivo é entregue desativado. Não executar V2 e V3 em paralelo para a mesma fila.
4. Publicar `index.html` e `onboarding-agenda24h.html` juntos.

O prazo conta a partir do atendimento concluído, no fuso da empresa. Um mês depois de 31 de janeiro cai no último dia de fevereiro. Serviços antigos em dias continuam com seus prazos; o convite padrão é manutenção. As regras existentes de consentimento, empresa ativa, janela de envio, ausência de próxima reserva e idempotência foram preservadas no workflow V3. “Novo serviço” usa um convite aberto; não inventa uma indicação específica do catálogo.

## Verificação local

`node testar-reativacao.mjs` verifica exportação, rascunhos, validação, resumo e os dois convites. A gravação e o cálculo de meses foram testados separadamente em PostgreSQL isolado, sem acesso ao banco de produção.
