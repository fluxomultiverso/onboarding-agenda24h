begin;

create or replace function public.a24_v3_descadastrar_reativacao(
  p_instancia text,
  p_mensagem uuid
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_empresa uuid;
  v_cliente uuid;
  v_ja_descadastrado boolean;
  v_canceladas integer;
begin
  select c.empresa_id, c.id, not c.aceita_reativacao
    into v_empresa, v_cliente, v_ja_descadastrado
  from public.mensagens m
  join public.conversas cv on cv.id = m.conversa_id and cv.empresa_id = m.empresa_id
  join public.clientes c on c.id = cv.cliente_id and c.empresa_id = cv.empresa_id
  join public.empresas e on e.id = c.empresa_id
  where m.id = p_mensagem
    and m.direcao = 'entrada'
    and m.tipo_mensagem = 'texto'
    and c.anonimizado_em is null
    and e.instancia_evolution = p_instancia
  for update of c;

  if not found then
    return jsonb_build_object('sucesso', false, 'codigo', 'MENSAGEM_INVALIDA');
  end if;

  update public.clientes
     set aceita_reativacao = false,
         descadastro_reativacao_em = coalesce(descadastro_reativacao_em, now()),
         motivo_descadastro = 'pedido_whatsapp'
   where id = v_cliente and empresa_id = v_empresa;

  update public.fila_mensagens
     set estado = 'cancelado',
         cancelado_em = now(),
         processando_em = null,
         ultimo_erro = 'DESCADASTRO_REATIVACAO'
   where empresa_id = v_empresa
     and cliente_id = v_cliente
     and tipo = 'reativacao'
     and estado = 'pendente';
  get diagnostics v_canceladas = row_count;

  update public.mensagens
     set estado_processamento = 'processada',
         processada_em = now()
   where id = p_mensagem and empresa_id = v_empresa;

  return jsonb_build_object(
    'sucesso', true,
    'ja_descadastrado', v_ja_descadastrado,
    'mensagens_pendentes_canceladas', v_canceladas
  );
end $$;

revoke all on function public.a24_v3_descadastrar_reativacao(text, uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.a24_v3_descadastrar_reativacao(text, uuid)
  to agenda24h_atendimento;

commit;
