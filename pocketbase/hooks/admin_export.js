// ---------------------------------------------------------------------------
// ADMIN — EXPORTAÇÕES CSV COMPLETAS (server-side)
//
// Rotas:
//   GET /backend/v1/admin/export/leads?search=&from=&to=
//   GET /backend/v1/admin/export/students?search=
//   GET /backend/v1/admin/export/payments?status=&from=&to=
//
// Todas devolvem o CSV da BASE INTEIRA aplicando os filtros de busca ativos
// (query params), paginando no servidor em lotes de 500 — o navegador nunca
// baixa listas para montar CSV no cliente. Somente admin.
//
// Autenticação: $apis.requireAuth() trava ANTES do handler nesta plataforma,
// e o gate de papel (role === 'admin') é checado DENTRO do handler.
//
// CONVENÇÃO JSVM: toda a lógica fica INLINE dentro do callback — declarações
// top-level no mesmo arquivo causam "Hook scoping error"; sem imports.
// ---------------------------------------------------------------------------
routerAdd(
  'GET',
  '/backend/v1/admin/export/{tipo}',
  (e) => {
    // ---- Gate de admin DENTRO do handler (requireAuth não checa papel) ----
    var isAdmin = false
    var isSuperuser = false
    try {
      if (e.auth && e.auth.id && e.auth.getString('role') === 'admin') isAdmin = true
    } catch (_) {}
    try {
      if (e.hasSuperuserAuth && e.hasSuperuserAuth()) isSuperuser = true
    } catch (_) {}
    if (!isAdmin && !isSuperuser) {
      return e.json(403, { error: 'Acesso restrito a administradores' })
    }

    var tipo = String(e.request.pathValue('tipo') || '').trim()
    if (tipo !== 'leads' && tipo !== 'students' && tipo !== 'payments') {
      return e.json(404, { error: 'Exportação desconhecida' })
    }

    // ---- Filtros de busca ativos (mesmos critérios usados nas telas) ----
    var search = ''
    var statusF = ''
    var de = ''
    var ate = ''
    try {
      var q = e.requestInfo().query || {}
      search = String(q.search || '')
        .trim()
        .replace(/["\\]/g, '')
      statusF = String(q.status || '')
        .trim()
        .replace(/["\\]/g, '')
      de = String(q.from || '').trim() // AAAA-MM-DD (data SP)
      ate = String(q.to || '').trim() // AAAA-MM-DD (data SP)
    } catch (_) {}

    // Converte data SP (AAAA-MM-DD) para janela ISO UTC (SP = UTC-3):
    // from 00:00 SP ⇒ 03:00 UTC do mesmo dia; to 23:59:59 SP ⇒ 02:59:59 UTC do dia seguinte.
    function janelaIso(dateStr, fimDoDia) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return ''
      var p = dateStr.split('-')
      var y = Number(p[0])
      var m = Number(p[1]) - 1
      var d = Number(p[2])
      if (fimDoDia) {
        return new Date(Date.UTC(y, m, d + 1, 2, 59, 59)).toISOString()
      }
      return new Date(Date.UTC(y, m, d, 3, 0, 0)).toISOString()
    }

    var deIso = janelaIso(de, false)
    var ateIso = janelaIso(ate, true)

    // ---- CSV helpers (inline no callback) ----
    function csvCell(v) {
      if (v === null || v === undefined) return ''
      var s = String(v)
      // Escape de fórmulas (=,+,-,@) evita CSV injection em planilhas
      if (/^[=+\-@\t]/.test(s)) s = "'" + s
      if (/[",;\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"'
      return s
    }
    function csvRow(cells) {
      var out = []
      for (var i = 0; i < cells.length; i++) out.push(csvCell(cells[i]))
      return out.join(';')
    }
    function dataBR(iso) {
      if (!iso) return ''
      var ms = Date.parse(iso)
      if (isNaN(ms)) return ''
      var sp = new Date(ms + 3 * 3600 * 1000) // relógio SP
      return sp.toISOString().slice(0, 10) + ' ' + sp.toISOString().slice(11, 19)
    }
    function brl(n) {
      var v = Number(n || 0)
      return v.toFixed(2).replace('.', ',')
    }

    function montaResposta(csvBody, nomeArquivo) {
      // BOM UTF-8 para o Excel abrir acentuação corretamente; ; como separador (pt-BR)
      var csv = '\uFEFF' + csvBody
      e.response.header().set('Content-Type', 'text/csv; charset=utf-8')
      e.response.header().set('Content-Disposition', 'attachment; filename="' + nomeArquivo + '"')
      e.response.header().set('Cache-Control', 'no-store')
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="' + nomeArquivo + '"',
          'Cache-Control': 'no-store',
        },
      })
    }

    var LOTE = 500
    var MAX_REGISTROS = 100000
    var linhas = []

    try {
      // =============== LEADS ===============
      if (tipo === 'leads') {
        var filtroL = ''
        if (search !== '') {
          filtroL =
            '(name ~ "' + search + '" || email ~ "' + search + '" || phone ~ "' + search + '")'
        }
        linhas.push(csvRow(['Nome', 'E-mail', 'Telefone', 'Mensagem', 'Data de Criação']))
        var offsetL = 0
        var totalL = 0
        for (;;) {
          var paginaL = $app.findRecordsByFilter('leads', filtroL, '-created', LOTE, offsetL)
          for (var i = 0; i < paginaL.length; i++) {
            var r = paginaL[i]
            linhas.push(
              csvRow([
                r.getString('name'),
                r.getString('email'),
                r.getString('phone'),
                r.getString('message'),
                dataBR(r.getString('created')),
              ]),
            )
          }
          totalL += paginaL.length
          if (paginaL.length < LOTE || totalL >= MAX_REGISTROS) break
          offsetL += LOTE
        }
        return montaResposta(
          linhas.join('\n'),
          'leads_export_' + new Date().toISOString().slice(0, 10) + '.csv',
        )
      }

      // =============== ALUNOS (users role != admin) ===============
      if (tipo === 'students') {
        var partesS = ["role != 'admin'"]
        if (search !== '') {
          partesS.push(
            '(name ~ "' + search + '" || email ~ "' + search + '" || phone ~ "' + search + '")',
          )
        }
        var filtroS = partesS.join(' && ')
        linhas.push(
          csvRow([
            'Nome',
            'E-mail',
            'Telefone',
            'Cidade',
            'UF',
            'Perfis Profissionais',
            'Plano',
            'Status',
            'Cadastro',
            'Validade do Contrato',
          ]),
        )
        var offsetS = 0
        var totalS = 0
        for (;;) {
          var paginaS = $app.findRecordsByFilter('users', filtroS, '-created', LOTE, offsetS)
          for (var j = 0; j < paginaS.length; j++) {
            var u = paginaS[j]
            var tags = u.get('professional_tags') || []
            var tagsStr = Array.isArray(tags) ? tags.join(', ') : String(tags || '')
            var contractEnd = u.getString('contract_end_date')
            var ativo = false
            try {
              if (contractEnd) {
                ativo = Date.parse(contractEnd) > Date.now()
              }
            } catch (_) {}
            linhas.push(
              csvRow([
                u.getString('name'),
                u.getString('email'),
                u.getString('phone'),
                u.getString('city'),
                u.getString('state'),
                tagsStr || u.getString('professional_profile'),
                u.getString('plan_tier') || 'free',
                ativo ? 'Ativo' : 'Inativo',
                dataBR(u.getString('created')),
                contractEnd ? contractEnd.slice(0, 10) : '',
              ]),
            )
          }
          totalS += paginaS.length
          if (paginaS.length < LOTE || totalS >= MAX_REGISTROS) break
          offsetS += LOTE
        }
        return montaResposta(
          linhas.join('\n'),
          'alunos_export_' + new Date().toISOString().slice(0, 10) + '.csv',
        )
      }

      // =============== PAGAMENTOS ===============
      if (tipo === 'payments') {
        var partesP = []
        if (statusF === 'paid' || statusF === 'pending' || statusF === 'failed') {
          partesP.push("status = '" + statusF + "'")
        }
        if (deIso !== '') partesP.push("created >= '" + deIso + "'")
        if (ateIso !== '') partesP.push("created <= '" + ateIso + "'")
        var filtroP = partesP.join(' && ')

        // resolve nome do usuário com um único mapa (lote de users por id)
        var nomePorId = {}
        function nomeUsuario(id) {
          if (!id) return ''
          if (nomePorId[id]) return nomePorId[id]
          var nome = ''
          try {
            var ur = $app.findRecordById('users', id)
            nome = ur.getString('name') || ur.getString('email')
          } catch (_) {
            nome = ''
          }
          nomePorId[id] = nome
          return nome
        }

        linhas.push(
          csvRow([
            'Data',
            'Usuário',
            'E-mail',
            'Produto',
            'Valor (R$)',
            'Status',
            'Parcelas',
            'IPag ID',
          ]),
        )
        var offsetP = 0
        var totalP = 0
        for (;;) {
          var paginaP = $app.findRecordsByFilter('payments', filtroP, '-created', LOTE, offsetP)
          for (var k = 0; k < paginaP.length; k++) {
            var pay = paginaP[k]
            var userId = ''
            try {
              userId = String(pay.get('user') || '')
            } catch (_) {}
            linhas.push(
              csvRow([
                dataBR(pay.getString('created')),
                nomeUsuario(userId),
                (function () {
                  try {
                    var ur2 = $app.findRecordById('users', userId)
                    return ur2.getString('email')
                  } catch (_) {
                    return ''
                  }
                })(),
                pay.getString('product_type'),
                brl(pay.get('amount')),
                pay.getString('status'),
                pay.get('installments') ? String(pay.get('installments')) : '1',
                pay.getString('ipag_id'),
              ]),
            )
          }
          totalP += paginaP.length
          if (paginaP.length < LOTE || totalP >= MAX_REGISTROS) break
          offsetP += LOTE
        }
        return montaResposta(
          linhas.join('\n'),
          'pagamentos_export_' + new Date().toISOString().slice(0, 10) + '.csv',
        )
      }

      return e.json(404, { error: 'Exportação desconhecida' })
    } catch (err) {
      console.log('[admin_export] erro ' + tipo + ': ' + err)
      return e.json(500, { error: 'Erro ao gerar exportação' })
    }
  },
  $apis.requireAuth(),
)
