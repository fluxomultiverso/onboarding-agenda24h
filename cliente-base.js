// Camada comercial: mantém o mesmo modelo e importador do onboarding principal.
STEPS[4] = 'Atendimento';
STEPS[5] = 'Conferir e enviar';
const renderCommercialBase = renderCurrentStep;
const commercialValidateBase = validar;
validar = function () {
  return commercialValidateBase().filter(e => !['f-codigo', 'f-instancia'].includes(e.campo));
};

async function compartilharCadastro(requireComplete = false) {
  if (requireComplete && validar().length) {
    goToStep(5); notice('Confira as pendências antes de compartilhar o cadastro.'); return false;
  }
  // Cria o anexo com o estado atual, sem ler arquivos de Downloads.
  const file = new File([JSON.stringify(makeDraft(), null, 2)], fileName('cadastro', 'txt'), {type: 'text/plain'});
  try {
    if (!navigator.share || !navigator.canShare || !navigator.canShare({files: [file]})) {
      notice('Este navegador não permite compartilhar arquivos. Abra o site no Chrome do celular e tente novamente. Para guardar o preenchimento, use “Salvar para continuar depois”.');
      return false;
    }
    await navigator.share({files: [file]});
    notice('Cadastro aberto no aplicativo escolhido. Confira o contato e conclua o envio por lá.');
    return true;
  } catch (error) {
    notice(error.name === 'AbortError' ? 'Compartilhamento cancelado. Seu preenchimento continua aqui.' : 'Não foi possível abrir o compartilhamento. Seu preenchimento continua aqui; tente novamente.');
    return false;
  }
}

renderStepRevisao = function (container) {
  const errors = validar();
  const e = state.empresa;
  container.innerHTML = '<h2>Confira o cadastro</h2><p>Toque em Compartilhar cadastro, escolha WhatsApp e selecione o contato do responsável pela implantação. O arquivo deste preenchimento já vai anexado.</p>' +
    '<fieldset class="form-section"><legend>Resumo</legend><p><strong>' + escapeHtml(e.nome_fantasia || 'Empresa sem nome') + '</strong></p><p>Plano: ' + escapeHtml(getPlano(state.plano_codigo)?.nome || 'Não selecionado') + '</p><p>' + state.servicos.filter(s => s.ativo).length + ' serviços · ' + state.profissionais.filter(p => p.ativo).length + ' profissionais</p><p>Responsável: ' + escapeHtml(state.admin.nome) + '</p><p>Observações: ' + escapeHtml(e.observacoes || 'Nenhuma') + '</p></fieldset>' +
    (errors.length ? '<div class="alert alert-danger">Confira as pendências abaixo. Você pode salvar um rascunho a qualquer momento.</div>' + errors.map((err, i) => '<button class="error-link" data-commercial-error="' + i + '">' + escapeHtml(STEPS[err.step] + ': ' + err.msg) + '</button>').join('') : '<div class="alert alert-info">Cadastro pronto para enviar à implantação.</div>') +
    '<button class="btn btn-primary" id="commercial-share" ' + (errors.length ? 'disabled' : '') + '>Compartilhar cadastro</button><p class="form-hint">Você escolhe o aplicativo e o contato. Não precisa procurar o arquivo no celular.</p><button class="btn btn-secondary" id="commercial-save">Salvar para continuar depois</button>';
  container.querySelectorAll('[data-commercial-error]').forEach(btn => btn.onclick = () => focusError(errors[+btn.dataset.commercialError]));
  document.getElementById('commercial-share').onclick = () => compartilharCadastro(true);
  document.getElementById('commercial-save').onclick = () => saveDraft(false);
};

renderCurrentStep = function () {
  renderCommercialBase();
  const area = document.getElementById('steps-container');
  // Remover os controles depois do vínculo preserva os valores dos rascunhos importados.
  area.querySelector('#f-codigo')?.closest('fieldset').remove();
  const labels = {
    'f-obs': 'Observações para implantação',
    'ia-nome': 'Como a assistente deve se chamar?',
    'ia-tom': 'Como ela deve conversar com os clientes?',
    'ia-apres': 'Como você apresentaria a empresa ao cliente?',
    'ia-obj': 'Qual é o principal objetivo do atendimento?',
    'ia-num-hum': 'Qual número deve receber o cliente quando precisar de uma pessoa?',
    'ia-msg-trans': 'O que a assistente deve dizer ao encaminhar o cliente?'
  };
  for (const [id, text] of Object.entries(labels)) {
    const input = document.getElementById(id);
    const label = input?.closest('.form-field')?.querySelector('label');
    if (label) { label.textContent = text; input.setAttribute('aria-label', text); }
  }
  const tone = document.getElementById('ia-tom');
  if (tone) tone.placeholder = 'Ex.: simpática e objetiva, com linguagem simples.';
  area.querySelectorAll('.form-hint').forEach(hint => {
    hint.textContent = hint.textContent.replace('Será incluído no system prompt.', 'Use as palavras do cliente.');
  });
  const guide = document.createElement('p');
  guide.className = 'alert alert-info';
  guide.textContent = ['Preencha os dados da empresa e selecione o plano combinado.', 'Confirme os dias e horários com o cliente. Você pode copiar os horários para vários dias.', 'Cadastre os serviços, preços e duração de cada atendimento.', 'Cadastre o responsável e quem realiza cada serviço.', 'Registre como a empresa quer atender seus clientes.', 'Confira as informações e compartilhe o cadastro pelo aplicativo de sua preferência.'][currentStep];
  area.prepend(guide);
};

const commercialFooterBase = updateFooter;
updateFooter = function () {
  commercialFooterBase();
  const next = document.getElementById('btn-next');
  if (currentStep === 5) {
    next.textContent = 'Compartilhar cadastro';
    next.onclick = () => compartilharCadastro(true);
  } else {
    next.onclick = () => {
      const errors = validar().filter(e => e.step === currentStep);
      if (errors.length) { focusError(errors[0]); notice(errors[0].msg); return; }
      goToStep(currentStep + 1);
    };
  }
};

