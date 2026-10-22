// Primeira etapa do cadastro online: nenhuma chamada de provisionamento ou pagamento.
const CLIENT_PROGRESS_KEY = 'agenda24h-cliente-progresso-v1';
try {
  const saved = localStorage.getItem(CLIENT_PROGRESS_KEY);
  if (saved) { state = parseDraft(saved); currentStep = state.etapa_atual; }
} catch { /* O formulário continua disponível sem armazenamento local. */ }

async function compartilharCliente() {
  if (validar().length) { goToStep(5); notice('Confira as pendências antes de enviar.'); return false; }
  const file = new File([JSON.stringify(makeDraft(), null, 2)], fileName('cadastro', 'txt'), {type:'text/plain'});
  try {
    if (!navigator.share || !navigator.canShare || !navigator.canShare({files:[file]})) {
      notice('O compartilhamento de arquivos não está disponível neste navegador. Abra esta página no Safari do iPhone ou no Chrome do Android.');
      return false;
    }
    await navigator.share({files:[file]});
    notice('Conclua o envio no WhatsApp. O recebimento será mostrado pelo próprio aplicativo.');
    return true;
  } catch (error) {
    notice(error.name === 'AbortError' ? 'Envio cancelado. Seu preenchimento continua aqui.' : 'Não foi possível compartilhar. Seu preenchimento continua aqui; tente novamente.');
    return false;
  }
}

renderStepRevisao = function(container) {
  const errors = validar();
  const esc = escapeHtml;
  container.innerHTML = '<h2>Confira e envie seu cadastro</h2><p>Escolha uma das opções abaixo. Nossa equipe revisará os dados e preparará seu atendimento.</p>' +
    '<fieldset class="form-section"><legend>Sua empresa</legend><p><strong>' + esc(state.empresa.nome_fantasia || 'Nome não informado') + '</strong></p><p>Plano: ' + esc(getPlano(state.plano_codigo)?.nome || 'Não informado') + '</p><p>Responsável: ' + esc(state.admin.nome) + '</p><p>WhatsApp: ' + esc(state.empresa.whatsapp) + '</p></fieldset>' +
    '<fieldset class="form-section"><legend>Serviços e equipe</legend>' + state.servicos.filter(s=>s.ativo).map(s=>'<p>' + esc(s.nome) + ' · ' + esc(String(s.duracao_min)) + ' minutos · ' + esc(s.preco_raw) + '</p>').join('') + '<p>Profissionais: ' + esc(state.profissionais.filter(p=>p.ativo).map(p=>p.nome).join(', ')) + '</p></fieldset>' +
    (errors.length ? '<div class="alert alert-danger">Revise os itens abaixo antes de enviar.</div>' + errors.map((e,i)=>'<button class="error-link" data-client-error="' + i + '">' + esc(STEPS[e.step] + ': ' + e.msg) + '</button>').join('') : '<div class="alert alert-info">Tudo pronto. Escolha apenas uma forma de envio.</div>') +
    '<div class="actions"><button class="btn btn-primary" id="client-whatsapp" ' + (errors.length ? 'disabled' : '') + '>Enviar por WhatsApp</button><button class="btn btn-secondary" id="client-email" disabled aria-describedby="client-email-hint">Enviar por e-mail</button></div><p class="form-hint" id="client-email-hint">O envio por e-mail estará disponível em breve. Por enquanto, envie pelo WhatsApp.</p><p>Ao compartilhar, escolha WhatsApp e o contato Agenda 24h: +55 21 96934-6296. O arquivo deste cadastro já estará anexado.</p>';
  container.querySelectorAll('[data-client-error]').forEach(button=>button.onclick=()=>focusError(errors[+button.dataset.clientError]));
  document.getElementById('client-whatsapp').onclick=compartilharCliente;
};

const clientRenderBase = renderCurrentStep;
renderCurrentStep = function() {
  clientRenderBase();
  const area = document.getElementById('steps-container');
  if (currentStep === 0) {
    const hint=area.querySelector('.alert-info');
    if(hint) hint.textContent='Conte sobre sua empresa e confira o plano. Na próxima etapa, informe seus horários de funcionamento.';
  }
  if (currentStep === 5) area.querySelector('.alert-info')?.remove();
};
const clientFooterBase = updateFooter;
updateFooter = function() {
  clientFooterBase();
  // Na conclusão, as únicas ações de envio ficam no corpo da página.
  document.getElementById('btn-next').hidden=currentStep===5;
};

document.addEventListener('DOMContentLoaded',()=>{
  document.querySelector('.header-actions').remove();
  document.getElementById('file-input-draft').remove();
  document.querySelector('.header-title').textContent='Vamos configurar sua empresa';
  document.querySelector('.brand p').textContent='Agenda 24h · Cadastro online';
  document.getElementById('offline-banner').textContent='Você está sem conexão. Continue preenchendo; para enviar, conecte-se à internet.';
  const persist=()=>{
    try { localStorage.setItem(CLIENT_PROGRESS_KEY,JSON.stringify(makeDraft())); }
    catch { notice('Não foi possível guardar o progresso neste navegador. Mantenha a página aberta até concluir.'); }
  };
  // Após os eventos de edição, guarda o estado atualizado, inclusive inclusões e remoções.
  for(const event of ['input','change','click']) document.addEventListener(event,()=>queueMicrotask(persist));
  window.addEventListener('pagehide',persist);
  notice('Seu progresso é guardado automaticamente neste navegador. Ao terminar, confira e envie seu cadastro.');
});
