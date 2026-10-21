# Agenda 24h — Onboarding

Formulário para coletar presencialmente os dados de empresas que contratam a Agenda 24h: plano, serviços, horários, equipe e preferências de atendimento da assistente.

## Duas versões

| Página | Quem usa | Finalidade |
| --- | --- | --- |
| `index.html` e `onboarding-agenda24h.html` | Responsável pela implantação | Cadastro completo, revisão, contrato PDF, arquivos técnicos e provisionamento |
| `vendedora.html` | Colaboradora comercial | Coleta guiada dos dados, revisão e entrega de um arquivo para implantação |

Endereço principal: https://onboarding.multiverso360.com.br/

A versão comercial fica em https://onboarding.multiverso360.com.br/vendedora.html após a atualização do GitHub Pages.

## Fluxo comercial

1. Abra `vendedora.html` e preencha empresa e plano, horários, serviços, pessoas e atendimento.
2. Use **Salvar rascunho** para guardar um preenchimento incompleto ou **Importar preenchimento** para continuar um cadastro salvo.
3. Na etapa **Conferir e enviar**, corrija as pendências e use **Baixar cadastro para enviar**.
4. Envie o arquivo ao responsável pela implantação.
5. Na versão completa, use **Abrir rascunho**, revise os dados e conclua contrato e provisionamento.

O arquivo comercial usa o mesmo formato `agenda24h-rascunho`, versão `2.0.0`, aceito pelo importador principal. A extensão TXT contém dados estruturados em JSON. O salvamento de rascunhos permite arquivos incompletos; o botão final exige corrigir as pendências do cadastro.

## Alterações da versão comercial — 21/10/2026

- Página comercial separada, preservando a versão completa.
- Identificação técnica retirada da interface comercial; os dados continuam no formato compartilhado para revisão pelo responsável.
- Revisão comercial própria, sem contrato, webhook, provisionamento ou exportações de workflow e prompt.
- Perguntas de atendimento com linguagem mais simples e orientações por etapa.
- Validação antes de avançar e lista de pendências na revisão.
- Salvamento, compartilhamento e importação de rascunhos mantidos.
- Recuperação do último preenchimento no armazenamento local do navegador, mediante confirmação. Esse recurso não substitui o arquivo salvo e pode ser perdido ao limpar os dados do navegador.
- Novo logotipo horizontal no cabeçalho das duas versões, símbolo do robô como favicon e ícone para dispositivos Apple. Selo circular disponível como imagem adicional.

## Recursos já presentes na base

- Planos Solo, Equipe e Empresa, com limites de profissionais e recepção.
- Cadastro de administrador, profissionais, recepcionistas e vínculos com serviços.
- Horários da empresa e individuais, com cópia de horários para vários dias.
- Serviços com preço, duração, vínculo com profissionais e configuração de reativação com mensagem personalizada.
- Configuração da assistente, contatos de encaminhamento, regras e perguntas frequentes.
- Validação de dados, importação de rascunhos e resumo HTML.
- Na versão completa: contrato PDF, geração de provisionamento, workflow, FAQ e system prompt.
- Provisionamento por webhook com chave informada no momento do envio. Confira `CONFIGURACAO_PROVISIONAMENTO.md` para detalhes.

O GitHub Pages deste projeto publica a branch `teste`, na raiz. Esta atualização preserva o comportamento da versão completa dessa branch, incluindo as mensagens de reativação por serviço. Outros workflows e alterações existentes em cópias locais não foram incluídos.

## Arquivos principais

- `vendedora.js`: adapta a interface comercial e mantém o modelo compartilhado.
- `logo-agenda24h.png`: logotipo horizontal fornecido pelo proprietário.
- `favicon.png`: símbolo usado no ícone da página.
- `logo-selo-agenda24h.png`: selo circular fornecido pelo proprietário.
- `contrato-pdf.js`, `contrato-template.md` e `pdf-lib.min.js`: geração de contrato da versão completa.
- `CNAME`: domínio personalizado do site.

## Manutenção e verificação

O projeto usa HTML, CSS e JavaScript, sem etapa de compilação. Para manter o uso offline, preserve os arquivos auxiliares ao lado das páginas. A versão comercial não é uma barreira de autorização: o acesso a operações do sistema precisa continuar protegido no servidor.

`scripts/gerar-onboarding-vendedora.mjs` gera a página comercial a partir de `index.html`, evitando atualizar manualmente duas cópias da lógica de cadastro. Execute `node scripts/gerar-onboarding-vendedora.mjs` após modificar a base. Esse script também adiciona a identidade visual às páginas completas.

O teste `scripts/testar-onboarding-vendedora.mjs` verifica navegação, download, compatibilidade de rascunhos, recuperação e layout. Requer Node.js, Playwright e Microsoft Edge instalado. Execute `node scripts/testar-onboarding-vendedora.mjs`. Para usar uma instalação de Playwright fora do projeto, informe o caminho do pacote na variável `A24_PLAYWRIGHT_PATH`.

Verificação realizada em 21/10/2026: teste da página comercial aprovado no navegador, incluindo importação nos dois sentidos com a versão completa da branch de publicação, download real, recuperação e navegação das seis etapas sem erros. Não foram enviados cadastros nem chamadas de provisionamento durante esses testes.

Publicar exige enviar os arquivos novos e atualizados ao repositório usado pelo GitHub Pages. Salvar os arquivos localmente não atualiza o site público.
