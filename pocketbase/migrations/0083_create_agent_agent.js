migrate(
  (app) => {
    $ai.agents.define(app, {
      slug: 'agente-ia-educacao-sst',
      name: 'Agente IA Educacao SST',
      description:
        'Assistente especializado em Seguranca e Saude no Trabalho que responde duvidas tecnicas sobre NRs, EPIs, ergonomia e riscos ocupacionais.',
      systemPrompt:
        'Voce e o Agente IA Educacao SST, um profissional experiente em Seguranca e Saude no Trabalho (SST), treinado por Mateus de Carvalho. Siga o lema "menos informacao e mais direcao" - responda com autoridade tecnica, de forma concisa e direta.\n\nDIRETRIZES:\n1. Sempre cite a NR relevante (ex: "conforme a NR-6") quando aplicar.\n2. Nunca invente dados, normas ou legislacao.\n3. Se o tema envolver cenarios de alto risco (espaco confinado, trabalho em altura, energia eletrica, colapso estrutural), inclua: "Esta e uma orientacao geral. Para o seu caso especifico, recomendo consultar um profissional habilitado in loco - nao substitui um laudo tecnico ou a visita de um engenheiro de seguranca."\n4. Se a pergunta for fora do escopo de SST, responda: "Sou especializado em Seguranca e Saude no Trabalho. Posso ajudar com duvidas sobre NRs, EPIs, ergonomia, riscos ocupacionais e temas relacionados."\n5. Se nao houver informacao suficiente na base de conhecimento, diga: "Nao tenho informacoes suficientes na minha base de conhecimento para responder essa pergunta com seguranca."\n6. Use a ferramenta de busca na base de conhecimento para encontrar informacoes relevantes antes de responder.\n7. Seja conciso e pratico, evitando prolixidade.',
      tier: 'reasoning',
      tools: [
        { collection: 'agent_knowledge_base', perms: { read: true, list: true }, actAs: 'admin' },
      ],
      memory: [
        {
          type: 'faq',
          payload: {
            qa: [
              {
                question: 'Qual o prazo para fazer o exame admissional?',
                answer:
                  'O exame admissional deve ser realizado ANTES de o trabalhador iniciar suas atividades, conforme a NR-7.',
              },
              {
                question: 'O que fazer em caso de acidente de trabalho?',
                answer:
                  'Prestar socorros, isolar a area, comunicar o responsavel por SST e registrar o CAT em ate 1 dia util.',
              },
              {
                question: 'Quem e responsavel pelo fornecimento de EPI?',
                answer: 'O empregador deve fornecer o EPI gratuitamente, conforme a NR-6.',
              },
              {
                question: 'Qual a altura minima que caracteriza trabalho em altura?',
                answer:
                  'Trabalho em altura e toda atividade executada acima de 2 metros do nivel inferior, conforme a NR-35.',
              },
              {
                question: 'O que e um espaco confinado?',
                answer:
                  'Qualquer area nao projetada para ocupacao continua, com meios limitados de entrada e saida, conforme a NR-33.',
              },
            ],
          },
        },
        {
          type: 'text',
          payload: {
            text: 'Resumo das principais NRs:\n\nNR-1: Estabelece o PGR (Programa de Gerenciamento de Riscos Ocupacionais).\nNR-6: Define EPI e responsabilidades do empregador e trabalhador.\nNR-7: PCMSO - Programa de Controle Medico de Saude Ocupacional.\nNR-9: Avaliacao e controle das exposicoes a riscos ambientais.\nNR-12: Seguranca em maquinas e equipamentos.\nNR-15: Atividades e operacoes insalubres.\nNR-16: Atividades e operacoes perigosas.\nNR-17: Ergonomia.\nNR-18: Construcao civil.\nNR-20: Seguranca com eletricidade.\nNR-33: Espacos confinados.\nNR-35: Trabalho em altura.',
          },
        },
      ],
    })
  },
  (app) => {
    $ai.agents.delete(app, 'agente-ia-educacao-sst')
  },
)
