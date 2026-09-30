/* Geração local de minuta PDF. Assinatura e registro de aceite são etapas posteriores. */
(function () {
  const { PDFDocument, StandardFonts, rgb } = PDFLib;
  // Papel ofício brasileiro: 216 x 330 mm.
  const PAGE_WIDTH = 612.28;
  const PAGE_HEIGHT = 935.43;
  const MARGIN = 48;
  const GREEN = rgb(0.14, 0.28, 0.21);
  const LIGHT = rgb(0.92, 0.96, 0.92);
  const INK = rgb(0.16, 0.20, 0.17);

  function printable(value) {
    return String(value ?? '')
      .replace(/\*\*/g, '')
      .replace(/[—–]/g, ' - ')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/\u00a0/g, ' ');
  }

  function localDate() {
    return new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo',
    }).format(new Date());
  }

  function fillTemplate(template, state, plan) {
    const e = state.empresa;
    const c = state.contrato;
    const city = [e.cidade, e.uf].filter(Boolean).join('/');
    const address = [e.endereco, e.complemento, e.bairro, city, e.cep ? `CEP ${e.cep}` : '']
      .map(x => String(x || '').trim()).filter(Boolean).join(', ');
    const representative = `${c.signatario_nome.trim()}, CPF ${c.signatario_cpf.replace(/\D/g, '')}, ${c.signatario_cargo.trim()}`;
    const replacements = [
      ['[NOME OU RAZÃO SOCIAL]', e.razao_social.trim()],
      ['[CPF_CNPJ]', e.documento.replace(/\D/g, '')],
      ['[ENDEREÇO]', address],
      ['[REPRESENTANTE]', representative],
      ['[EMAIL_CLIENTE]', c.signatario_email.trim()],
      ['[Solo / Equipe / Empresa]', plan.nome],
      ['[Mensal / Anual]', c.modalidade === 'anual' ? 'Anual' : 'Mensal'],
      ['[NÚMERO]', e.whatsapp],
      ['[DATA E HORA]', 'A registrar após o teste de ativação'],
      ['[DATA]', localDate()],
      ['[MEIO]', c.meio_pagamento.trim()],
      ['[E-MAIL OU OUTRO CANAL ELETRÔNICO]', c.canal_suporte.trim()],
      ['[LOCAL]', city],
      ['[NOME E ASSINATURA]', c.signatario_nome.trim()],
      ['[ASSINATURA]', ''],
    ];
    let result = template;
    for (const [key, value] of replacements) result = result.replaceAll(key, value);
    const missing = result.match(/\[[^\]\n]+\]/g);
    if (missing) throw new Error(`O contrato contém campos sem preencher: ${missing.join(', ')}`);
    return result;
  }

  function wrapText(text, font, size, maxWidth) {
    const lines = [];
    let line = '';
    for (const word of printable(text).split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) { line = next; continue; }
      if (line) lines.push(line);
      if (font.widthOfTextAtSize(word, size) <= maxWidth) { line = word; continue; }
      let piece = '';
      for (const char of word) {
        if (font.widthOfTextAtSize(piece + char, size) > maxWidth && piece) {
          lines.push(piece); piece = char;
        } else piece += char;
      }
      line = piece;
    }
    if (line) lines.push(line);
    return lines;
  }

  async function render(template, logoSrc) {
    const pdf = await PDFDocument.create();
    pdf.setTitle('Contrato Agenda 24h - para assinatura');
    pdf.setSubject('Minuta gerada pelo onboarding, sem registro de assinatura ou aceite');
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    let logo = null;
    try {
      const imageResponse = await fetch(logoSrc);
      if (!imageResponse.ok) throw new Error('Logotipo indisponível');
      logo = await pdf.embedPng(await imageResponse.arrayBuffer());
    } catch { /* Texto e identidade visual permanecem legíveis. */ }
    let page, y;
    const newPage = () => { page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]); y = PAGE_HEIGHT - MARGIN; };
    const ensure = height => { if (y - height < MARGIN + 14) newPage(); };
    const drawLines = (value, options = {}) => {
      const size = options.size || 12;
      const leading = options.leading || 17;
      const font = options.bold ? bold : regular;
      const indent = options.indent || 0;
      const lines = wrapText(value, font, size, PAGE_WIDTH - 2*MARGIN - indent);
      ensure(lines.length * leading + (options.after || 0));
      for (const line of lines) {
        page.drawText(line, { x: MARGIN + indent, y, font, size, color: options.color || INK });
        y -= leading;
      }
      y -= options.after || 0;
    };
    const drawSignature = (value, label) => {
      ensure(122);
      drawLines(value, { bold: true, after: 0 });
      y -= 58;
      page.drawLine({ start: { x: MARGIN, y }, end: { x: MARGIN + 265, y }, thickness: 0.7, color: INK });
      y -= 17;
      drawLines(label, { size: 10, after: 16 });
    };
    newPage();
    if (logo) {
      const width = 90;
      page.drawImage(logo, { x: (PAGE_WIDTH - width)/2, y: y-width, width, height: width });
      y -= width + 18;
    }
    drawLines('CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TECNOLOGIA E AUTOMAÇÃO - AGENDA 24H',
      { size: 14, leading: 19, bold: true, color: GREEN, after: 12 });
    page.drawText('MINUTA PARA ASSINATURA - SEM REGISTRO DE ACEITE',
      { x: MARGIN, y, font: bold, size: 10, color: GREEN });
    y -= 20;

    const lines = template.split(/\r?\n/);
    for (let i=0; i<lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('# ')) continue;
      if (line.startsWith('|')) {
        const rows = [];
        while (i<lines.length && lines[i].trim().startsWith('|')) {
          const row = lines[i].trim().slice(1,-1).split('|').map(x=>x.trim());
          if (!row.every(x=>/^:?-+:?$/.test(x))) rows.push(row);
          i++;
        }
        i--;
        if (rows[0].length === 2) {
          for (const [label, value] of rows.slice(1)) {
            const text = `${label}: ${value}`;
            const height = wrapText(text, regular, 12, PAGE_WIDTH-2*MARGIN-20).length*17+11;
            ensure(height);
            page.drawRectangle({x:MARGIN,y:y-height+8,width:PAGE_WIDTH-2*MARGIN,height, color:LIGHT});
            y -= 6;
            drawLines(text,{indent:9,after:5});
          }
        } else {
          for (const [name, limit, month, setup, year, annualSetup] of rows.slice(1)) {
            const cardLines = [
              `PLANO ${name.toUpperCase()} - ${limit}`,
              `Mensal: ${month}; implantação ${setup}`,
              `Anual: ${year}; implantação ${annualSetup.toLowerCase()}`,
            ];
            const height = cardLines.length*17+14;
            ensure(height);
            page.drawRectangle({x:MARGIN,y:y-height+5,width:PAGE_WIDTH-2*MARGIN,height,color:LIGHT});
            y -= 6;
            for (const item of cardLines) drawLines(item,{indent:9,bold:item.startsWith('PLANO'),after:0});
            y -= 8;
          }
        }
        y -= 8;
        continue;
      }
      if (line.startsWith('## ')) {
        const heading = line.slice(3);
        if (heading.startsWith('CLÁUSULA 1 ')) newPage();
        ensure(55);
        y -= 12;
        drawLines(heading,{bold:true,color:GREEN,after:6});
        continue;
      }
      if (line.startsWith('**CONTRATANTE:**') && !line.includes('doravante')) {
        drawSignature(line, 'Assinatura da CONTRATANTE');
        continue;
      }
      if (line.startsWith('**CONTRATADA:**') && !line.includes('doravante')) {
        drawSignature(line, 'Assinatura da CONTRATADA');
        continue;
      }
      drawLines(line,{after:8});
    }
    const pages = pdf.getPages();
    pages.forEach((item,index) => {
      item.drawLine({start:{x:MARGIN,y:32},end:{x:PAGE_WIDTH-MARGIN,y:32},thickness:0.5,color:GREEN});
      item.drawText('AGENDA 24H  |  CONTRATO PARA ASSINATURA',
        {x:MARGIN,y:20,font:regular,size:9,color:GREEN});
      item.drawText(`Página ${index+1} de ${pages.length}`,
        {x:PAGE_WIDTH-MARGIN-62,y:20,font:regular,size:9,color:GREEN});
    });
    return new Blob([await pdf.save()],{type:'application/pdf'});
  }

  window.gerarContratoPdf = async (state, plan, logoSrc) => {
    if (!plan) throw new Error('Selecione um plano antes de gerar o contrato.');
    const response = await fetch(new URL('contrato-template.md', document.baseURI), { cache: 'no-store' });
    if (!response.ok) throw new Error('O modelo do contrato não está disponível nesta página.');
    const template = fillTemplate(await response.text(), state, plan);
    return render(template, logoSrc);
  };
})();
