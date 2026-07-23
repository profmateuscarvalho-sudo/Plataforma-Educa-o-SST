migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('agent_knowledge_base')

    var entries = [
      {
        title: 'NR-6 - Equipamento de Protecao Individual (EPI)',
        content:
          '<p>A NR-6 estabelece que o empregador deve fornecer aos empregados, gratuitamente, EPI adequado ao risco e em perfeito estado de conservacao e funcionamento. O EPI deve ter Certificado de Aprovacao (CA) emitido pelo Ministerio do Trabalho. Sao responsabilidades do empregador: adquirir o EPI adequado, exigir seu uso, fornecer apenas EPI com CA, orientar e treinar o trabalhador sobre uso, guardar e conservacao, substituir imediatamente quando danificado, registrar o fornecimento. O trabalhador tem obrigacao de usar, guardar e comunicar qualquer defeito. O EPI nao elimina o risco, mas protege o trabalhador. A nao fornecimento do EPI pode resultar em embargos, multas e responsabilidade civil e criminal. Tipos de EPI: protetores auditivos, respiradores, luvas, calcados, capacetes, cintos de seguranca, vestimentas.</p>',
        tags: JSON.stringify(['NR-6', 'EPI', 'Equipamentos de Protecao']),
        source: 'NR-6',
        active: true,
      },
      {
        title: 'NR-12 - Seguranca no Trabalho em Maquinas e Equipamentos',
        content:
          '<p>A NR-12 define referencias tecnicas, principios fundamentais e medidas de protecao para garantir a saude e integridade fisica dos trabalhadores. Estabelece requisitos para prevencao de acidentes em maquinas e equipamentos em todas as fases de uso. A NR-12 exige a implantacao de protecoes coletivas antes de EPI. Maquinas devem ter dispositos de parada de emergencia, protecoes contra partes moveis, sistemas de bloqueio. A avaliacao de conformidade deve ser documentada. Manutencao preventiva e obrigatoria. O empregador deve manter manual de operacao e procedimentos de seguranca. Treinamento especifico e necessario para operadores. Maquinas fabricadas antes de 2016 devem ter adequacao gradual conforme cronograma.</p>',
        tags: JSON.stringify(['NR-12', 'Maquinas', 'Equipamentos']),
        source: 'NR-12',
        active: true,
      },
      {
        title: 'NR-17 - Ergonomia',
        content:
          '<p>A NR-17 visa estabelecer parametros que permitam a adaptacao das condicoes de trabalho as caracteristicas psicofisiologicas dos trabalhadores. Busca proporcionar conforto, seguranca e desempenho eficiente. A NR-17 aborda: levantamento, transporte e descarga de peso, mobiliario dos postos de trabalho, equipamentos, ambiente organizacional. O limite de peso para levantamento manual varia conforme a frequencia e a postura. Para homens, o peso maximo recomendado e de 60kg em condicoes ideais; para mulheres, 20kg. Trabalho sentado deve ter cadeira ajustavel, suporte para os pes, altura adequada da bancada. Trabalho em pe deve ter assento para descanso proximo. Avaliacao ergonomica deve ser feita periodicamente. Jornadas excessivas e ritmo acelerado sao fatores de risco.</p>',
        tags: JSON.stringify(['NR-17', 'Ergonomia', 'Conforto']),
        source: 'NR-17',
        active: true,
      },
      {
        title: 'NR-33 - Seguranca e Saude no Trabalho em Espacos Confinados',
        content:
          '<p>A NR-33 estabelece requisitos para identificacao de espacos confinados e reconhecimento, avaliacao, monitoramento e controle dos riscos. Espaco confinado e qualquer area nao projetada para ocupacao continua, com meios limitados de entrada e saida, com ventilacao insuficiente. Exemplos: silos, tanques, galerias, esgotamentos. O responsavel tecnico deve emitir documento de classificacao do espaco. Antes de entrar, e obrigatorio: teste de atmosfera (oxigenio, gases toxicos, inflamaveis), isolamento de fontes de energia, ventilacao. O vigia deve permanecer fora do espaco durante toda a operacao. O resgatista deve estar prontamente disponivel. Permissao de entrada deve ser assinada. Risco de morte por asfixia e alto. NUNCA entre em espaco confinado sem certificacao e autorizacao.</p>',
        tags: JSON.stringify(['NR-33', 'Espaco Confinado', 'Riscos Graves']),
        source: 'NR-33',
        active: true,
      },
      {
        title: 'NR-35 - Trabalho em Altura',
        content:
          '<p>A NR-35 estabelece requisitos para protecao dos trabalhadores em altura, considerada qualquer atividade executada acima de 2 metros do nivel inferior. O empregador deve: avaliar o risco, implementar medidas de controle coletivo, fornecer EPI adequado (cinto tipo paraquedista, talabarte duplo), garantir treinamento. O trabalhador em altura deve ter capacitacao, exame medico especifico e autorizacao. Ancoragem deve suportar carga minima de 15kN. Trabalhos em telhados requerem protecao contra quedas. Escadas portateis nao devem ser usadas como posto de trabalho permanente. Condicoes climaticas (vento, chuva) devem ser avaliadas. Treinamento deve ser renovado bienal ou apos acidente. O supervisor de entrada deve verificar condicoes antes do inicio.</p>',
        tags: JSON.stringify(['NR-35', 'Trabalho em Altura', 'Riscos Graves']),
        source: 'NR-35',
        active: true,
      },
      {
        title: 'NR-18 - Condicoes de Trabalho na Industria da Construcao',
        content:
          '<p>A NR-18 estabelece diretrizes para administracao, organizacao e seguranca no canteiro de obras. Exige PCMAT (Programa de Condicoes e Meio Ambiente de Trabalho na Industria da Construcao). O canteiro deve ter instalacoes sanitarias, vestiario, local de refeicoes, alojamento (se aplicavel). Protecoes contra quedas: guardas, rodapes em plataformas. Andaimes devem ser dimensionados e montados por pessoa qualificada. Escadas de mao com maximo 7 metros. Movimentacao de cargas deve ter projeto. Sinalizacao de seguranca em todo o canteiro. EPI obrigatorios: capacete, calcado de seguranca. Demolicoes requerem projeto especifico. Escavacoes com profundidade superior a 1,25m requerem contencao.</p>',
        tags: JSON.stringify(['NR-18', 'Construcao Civil', 'Canteiro de Obras']),
        source: 'NR-18',
        active: true,
      },
      {
        title: 'NR-20 - Seguranca e Saude no Trabalho com Eletricidade',
        content:
          '<p>A NR-20 estabelece requisitos para seguranca em instalacoes eletricas. Abrange todas as fases de producao, transmissao, distribuicao e consumo de energia. O empregador deve manter Prontuario de Instalacoes Eletricas, realizar analise de risco antes de intervencao. Trabalhadores devem ter curso de seguranca com eletricidade (BS, CS, CE). Medidas de controle: desenergizacao (10 passos), bloqueio e etiquetagem, aterramento temporario, sinalizacao. NUNCA trabalhe em equipamento energizado sem justificativa tecnica e autorizacao. EPI especifico: luvas isolantes, mangotes, calcados dieletricos. Risco de arco eletrico requer vestimenta resistente a chama. Manutencao preventiva deve ser documentada. Emergencias: nao toque na vitima sem desenergizar.</p>',
        tags: JSON.stringify(['NR-20', 'Eletricidade', 'Riscos Graves']),
        source: 'NR-20',
        active: true,
      },
      {
        title: 'FAQ: Qual o prazo para fazer o exame admissional?',
        content:
          '<p>O exame medico admissional deve ser realizado ANTES de o trabalhador iniciar suas atividades. conforme a NR-7 (Programa de Controle Medico de Saude Ocupacional - PCMSO), o exame admissional e obrigatorio e deve avaliar a aptidao do trabalhador para a funcao. O empregador nao pode permitir que o trabalhador inicie o trabalho sem ter realizado o exame. O ASO (Atestado de Saude Ocupacional) deve ser emitido em duas vias: uma para o empregador e outra para o trabalhador.</p>',
        tags: JSON.stringify(['FAQ', 'NR-7', 'PCMSO', 'Exames']),
        source: 'FAQ Educacao SST',
        active: true,
      },
      {
        title: 'FAQ: O que fazer em caso de acidente de trabalho?',
        content:
          '<p>Em caso de acidente de trabalho: 1) Prestar primeiros socorros e acionar o SAMU (192) se necessario. 2) Isolar a area para evitar novos acidentes. 3) Comunicar imediatamente o responsavel pela SST. 4) Registrar no CAT (Comunicacao de Acidente de Trabalho) em ate 1 dia util apos o acidente. O CAT deve ser emitido pela empresa, pelo medico ou pelo proprio acidentado. 5) Investigar as causas do acidente. 6) Implementar medidas corretivas. O nao registro do CAT pode gerar multas. Acidentes sem afastamento tambem devem ser registrados. O INSS pode ser acionado para beneficios se houver afastamento superior a 15 dias.</p>',
        tags: JSON.stringify(['FAQ', 'Acidente', 'CAT', 'NR-7']),
        source: 'FAQ Educacao SST',
        active: true,
      },
      {
        title: 'FAQ: Quem e responsavel pelo fornecimento de EPI?',
        content:
          '<p>O empregador e o responsavel legal pelo fornecimento gratuito do EPI adequado ao risco, conforme a NR-6. O empregador deve: adquirir o EPI adequado, exigir seu uso, fornecer treinamento, substituir quando necessario, e responsabilizar-se pela higienizacao e manutencao. O trabalhador tem a obrigacao de usar corretamente, guardar e comunicar danos. O nao fornecimento de EPI pelo empregador configura falta grave e pode resultar em multas, embargos, e ate responsabilidade criminal em caso de acidente. O EPI deve ter Certificado de Aprovacao (CA) emitido pelo Ministerio do Trabalho.</p>',
        tags: JSON.stringify(['FAQ', 'NR-6', 'EPI']),
        source: 'FAQ Educacao SST',
        active: true,
      },
      {
        title: 'FAQ: Qual a jornada maxima permitida por lei?',
        content:
          '<p>A jornada de trabalho no Brasil e limitada pela Constituicao Federal a 8 horas diarias e 44 horas semanais. Horas extras sao limitadas a 2 horas por dia, com acrescimo de 50% (minimo). Trabalho noturno (22h as 5h) tem jornada reduzida para 7 horas. Em atividades insalubres ou perigosas, a jornada pode ser ainda mais restrita conforme NR especifica. Intervalo minimo de 1 hora para refeicao em jornadas acima de 6 horas. Trabalhadores em espacos confinados (NR-33) e em altura (NR-35) devem ter jornada controlada para evitar fadiga que comprometa a seguranca.</p>',
        tags: JSON.stringify(['FAQ', 'Jornada', 'Legislacao']),
        source: 'FAQ Educacao SST',
        active: true,
      },
      {
        title: 'Revista Educacao SST - Edicao 12: Cultura de Seguranca',
        content:
          '<p>A cultura de seguranca nas organizacoes vai alem do cumprimento de normas. Envolve o comprometimento da lideranca, a participacao dos trabalhadores e a integracao da seguranca nos processos. Empresas com cultura madura de SST apresentam menor indice de acidentes e maior produtividade. A lideranca deve dar o exemplo, investir em treinamento e nao priorizar producao em detrimento da seguranca. O conceito de "zero acidente" deve ser perseguido com acoes praticas: dialogos diarios de seguranca, observacoes comportamentais, reporte de quase-acidentes. A educacao continuada e fundamental para manter viva a cultura de seguranca.</p>',
        tags: JSON.stringify(['Revista', 'Cultura de Seguranca', 'Gestao']),
        source: 'Revista Educacao SST Ed. 12',
        active: true,
      },
      {
        title: 'Revista Educacao SST - Edicao 11: Gestao de Riscos Ocupacionais',
        content:
          '<p>O PGR (Programa de Gerenciamento de Riscos Ocupacionais), estabelecido pela NR-1, substituiu o PPRA e o PGR do eSocial. O PGR deve contemplar: antecipacao e reconhecimento dos riscos, estabelecimento de prioridades e metas, avaliacao dos riscos, implementacao de medidas de controle, monitoramento. A matriz de risco (probabilidade x severidade) e ferramenta essencial. Medidas de controle seguem hierarquia: eliminacao, substituicao, controle de engenharia, controle administrativo, EPI. A participacao dos trabalhadores na elaboracao do PGR e obrigatoria. O documento deve ser revisado periodicamente ou apos mudancas significativas no processo.</p>',
        tags: JSON.stringify(['Revista', 'PGR', 'NR-1', 'Gestao de Riscos']),
        source: 'Revista Educacao SST Ed. 11',
        active: true,
      },
    ]

    for (var i = 0; i < entries.length; i++) {
      var e = entries[i]
      try {
        app.findFirstRecordByData('agent_knowledge_base', 'title', e.title)
      } catch (_) {
        var record = new Record(col)
        record.set('title', e.title)
        record.set('content', e.content)
        record.set('tags', e.tags)
        record.set('source', e.source)
        record.set('active', e.active)
        app.saveNoValidate(record)
      }
    }
  },
  (app) => {
    try {
      app.truncateCollection(app.findCollectionByNameOrId('agent_knowledge_base'))
    } catch (_) {}
  },
)
