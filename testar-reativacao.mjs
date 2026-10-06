import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import vm from 'node:vm';

let checks = 0;
const check = (name, fn) => { fn(); checks++; console.log('OK ' + name); };
const pages = ['index.html', 'onboarding-agenda24h.html'];
const offlinePage = '../onboarding/onboarding-agenda24h.html';
if (existsSync(new URL(offlinePage, import.meta.url))) pages.push(offlinePage);
for (const file of pages) {
  const html = readFileSync(new URL(file, import.meta.url), 'utf8');
  const script = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
  const ctx = vm.createContext({document: {addEventListener() {}, getElementById() {return {src:'logo-agenda24h.png'};}}, console});
  vm.runInContext(script, ctx);
  const run = code => vm.runInContext(code, ctx);
  run(`state = createEmptyState();
    state.servicos = [
      {chave:'corte',nome:'Corte',descricao:'',duracao_min:30,preco_raw:'50',preco_cents:5000,ativo:true,prazo_reativacao_quantidade:15,prazo_reativacao_unidade:'dias',reativacao_objetivo:'manutencao'},
      {chave:'tratamento',nome:'Tratamento',descricao:'',duracao_min:60,preco_raw:'100',preco_cents:10000,ativo:true,prazo_reativacao_quantidade:3,prazo_reativacao_unidade:'meses',reativacao_objetivo:'novo_servico'}
    ]; state.plano_codigo='solo';`);
  check(file + ': prazos independentes em dias e meses no JSON', () => {
    const payload = JSON.parse(run('JSON.stringify(buildRawJSONFinal().provisionamento)'));
    assert.equal(payload.servicos[0].prazo_reativacao_dias, 15);
    assert.equal(payload.servicos[0].prazo_reativacao_meses, null);
    assert.equal(payload.servicos[1].prazo_reativacao_dias, null);
    assert.equal(payload.servicos[1].prazo_reativacao_meses, 3);
    assert.equal(payload.servicos[0].reativacao_objetivo, 'manutencao');
    assert.equal(payload.servicos[1].reativacao_objetivo, 'novo_servico');
    assert.equal(payload.configuracoes.reativacao_automatica, true);
  });
  check(file + ': rascunho preserva unidade, prazo e convite', () => {
    const draft = run('JSON.stringify(makeDraft())');
    ctx.draftText = draft;
    const restored = JSON.parse(run('JSON.stringify(parseDraft(draftText).servicos)'));
    assert.equal(restored[0].prazo_reativacao_quantidade,15);
    assert.equal(restored[1].prazo_reativacao_quantidade,3);
    assert.equal(restored[1].prazo_reativacao_unidade,'meses');
    assert.equal(restored[1].reativacao_objetivo,'novo_servico');
  });
  check(file + ': rascunho antigo abre com prazo pendente, sem inventar prazo', () => {
    const legacy = JSON.parse(run('JSON.stringify(makeDraft())'));
    for (const s of legacy.dados.servicos) {
      delete s.prazo_reativacao_quantidade; delete s.prazo_reativacao_unidade; delete s.reativacao_objetivo;
    }
    ctx.draftText=JSON.stringify(legacy);
    assert.equal(run('parseDraft(draftText).servicos[0].prazo_reativacao_quantidade'),null);
    run('state=parseDraft(draftText)');
    assert.ok(run("validar().some(e=>e.campo==='svc-0-reativacao')"));
  });
  check(file + ': valores inválidos bloqueiam exportação e importação', () => {
    for (const v of [null,0,-1,1.5,32768]) {
      ctx.testValue=v;
      run("state.servicos[0].prazo_reativacao_quantidade=testValue");
      assert.ok(run("validar().some(e=>e.campo==='svc-0-reativacao')"));
      assert.throws(() => run('gerarJSONFinal()'), /Corrija/);
    }
    run("state.servicos[0].prazo_reativacao_quantidade=1201;state.servicos[0].prazo_reativacao_unidade='meses'");
    assert.equal(run('validPrazoReativacao(state.servicos[0])'),false);
    ctx.draftText=run('JSON.stringify(makeDraft())');
    assert.throws(() => run('parseDraft(draftText)'), /reativação inválido/);
    run("state.servicos[0].prazo_reativacao_quantidade=3;state.servicos[0].reativacao_objetivo='outro'");
    assert.ok(run("validar().some(e=>e.campo==='svc-0-reativacao-objetivo')"));
  });
  check(file + ': resumo exibe meses e finalidade', () => {
    run("state.servicos[0].reativacao_objetivo='manutencao';state.servicos[1].reativacao_objetivo='novo_servico'");
    const summary=run('gerarResumoHTML()');
    assert.match(summary,/Reativação: 3 meses/);
    assert.match(summary,/Novo serviço/);
    assert.match(summary,/Manutenção/);
  });
}
const wf=JSON.parse(readFileSync(new URL('workflow-reativacao-por-servico-v3.json',import.meta.url),'utf8'));
const message=wf.nodes.find(n=>n.parameters.jsCode?.includes('const convite')).parameters.jsCode;
check('mensagens distinguem manutenção e novo serviço',()=>{
  const input={nome_cliente:'Cliente teste',nome_servico:'Corte',nome_fantasia:'Empresa teste'};
  const invoke=objetivo=>new Function('$json',message)({...input,reativacao_objetivo:objetivo}).json.mensagem;
  assert.match(invoke('manutencao'),/manutenção de Corte/);
  assert.match(invoke('novo_servico'),/agendar um novo serviço/);
  assert.equal(wf.active,false);
});
console.log(`${checks} verificações passaram.`);
