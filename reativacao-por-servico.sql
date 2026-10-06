-- Prazo em dias ou meses de calendário e finalidade do convite por serviço.
-- Preserva serviços e regras existentes; aplica tudo na mesma transação.
begin;

alter table public.servicos
  add column if not exists prazo_reativacao_meses smallint,
  add column if not exists reativacao_objetivo text not null default 'manutencao';

alter table public.servicos
  add constraint servicos_reativacao_meses_check
    check (prazo_reativacao_meses between 1 and 1200),
  add constraint servicos_reativacao_unidade_check
    check (prazo_reativacao_dias is null or prazo_reativacao_meses is null),
  add constraint servicos_reativacao_objetivo_check
    check (reativacao_objetivo in ('manutencao', 'novo_servico'));

create or replace function public.calcular_data_reativacao(
  p_concluido_em timestamptz, p_dias integer, p_meses integer, p_fuso text
) returns timestamptz
language sql stable set search_path = public
as $$
  select case
    when p_meses > 0 then
      ((p_concluido_em at time zone p_fuso) + make_interval(months => p_meses)) at time zone p_fuso
    when p_dias > 0 then
      ((p_concluido_em at time zone p_fuso) + make_interval(days => p_dias)) at time zone p_fuso
    else null
  end;
$$;

-- Altera somente os campos de serviços da função instalada.
do $provisionamento$
declare v_sql text;
begin
  select pg_get_functiondef('public.provisionar_empresa_v2(jsonb)'::regprocedure) into v_sql;
  if position('prazo_reativacao_meses' in v_sql) = 0 then
    if position('prazo_reativacao_dias, requer_avaliacao' in v_sql) = 0
       or position('nullif(v_item->>''prazo_reativacao_dias'', '''')::smallint,' in v_sql) = 0 then
      raise exception 'Provisionamento diferente do esperado; nenhuma alteração aplicada';
    end if;
    v_sql := replace(v_sql, 'prazo_reativacao_dias, requer_avaliacao',
      'prazo_reativacao_dias, prazo_reativacao_meses, reativacao_objetivo, requer_avaliacao');
    v_sql := replace(v_sql, 'nullif(v_item->>''prazo_reativacao_dias'', '''')::smallint,',
      'nullif(v_item->>''prazo_reativacao_dias'', '''')::smallint,
      nullif(v_item->>''prazo_reativacao_meses'', '''')::smallint,
      coalesce(nullif(v_item->>''reativacao_objetivo'', ''''), ''manutencao''),');
    execute v_sql;
  end if;
end;
$provisionamento$;

-- Mantém os filtros da função instalada e substitui somente o cálculo do prazo.
do $fila$
declare v_sql text;
begin
  select pg_get_functiondef('public.gerar_reativacoes_pendentes(integer)'::regprocedure) into v_sql;
  if position('calcular_data_reativacao' in v_sql) = 0 then
    if position('a.concluido_em <= now() - make_interval(days => s.prazo_reativacao_dias)' in v_sql) = 0
       or position('s.prazo_reativacao_dias is not null' in v_sql) = 0 then
      raise exception 'Gerador de reativação diferente do esperado; nenhuma alteração aplicada';
    end if;
    v_sql := replace(v_sql,
      'a.concluido_em <= now() - make_interval(days => s.prazo_reativacao_dias)',
      'public.calcular_data_reativacao(a.concluido_em, s.prazo_reativacao_dias, s.prazo_reativacao_meses, e.fuso_horario) <= now()');
    v_sql := replace(v_sql, 's.prazo_reativacao_dias is not null',
      '(s.prazo_reativacao_dias is not null or s.prazo_reativacao_meses is not null)');
    execute v_sql;
  end if;
end;
$fila$;

commit;
