// ---------------------------------------------------------------------------
// E-MAILS TRANSACIONAIS — PARTE 1: template base (lib compartilhada).
//
// Compatibilidade alvo: Outlook desktop (Word engine), Outlook web, Gmail e
// clientes mobile. Regras aplicadas:
//   - Largura máxima 600px (tabela, não div);
//   - TODOS os estilos inline (Gmail corta <style> em alguns contextos);
//   - Fontes seguras: Arial/Helvetica/sans-serif (sem webfonts);
//   - Sem flex/grid/background-image sem fallback; espaçamento via padding
//     de td e não via margin em blocos;
//   - Botão "bulletproof": tabela com td de fundo colorido + fallback VML
//     para Outlook desktop;
//   - Logo em URL pública absoluta https com alt + texto "Educação SST"
//     abaixo (legível mesmo com imagens bloqueadas).
//
// Padrão do projeto (pricing_lib.js / magazine_lib.js): global var + IIFE,
// SEM import/require (a JSVM não aceita) e sem uso de $app no boot.
// Consumo (dentro de um callback de hook):
//   var html = emailTemplateLib.emailShell({ badgeText: '...', ... })
// ---------------------------------------------------------------------------

// LOGO: URL pública estável do ícone 192px hospedado no site de produção
// (PNG validado em https://www.educacaosst.com.br/icon-192.png).
// Pendência registrada no DOCS.md: conferir se o logo oficial horizontal
// substitui o ícone quadrado.
var emailTemplateLib = (function () {
  var LOGO_URL = 'https://www.educacaosst.com.br/icon-192.png'
  var SITE_URL = 'https://www.educacaosst.com.br'
  var PRIVACY_URL = SITE_URL + '/privacidade'
  var CONTACT_EMAIL = 'assinante@educacaosst.com.br'
  var FONT = 'Arial,Helvetica,sans-serif'
  var BG_COLOR = '#f1f5f9'
  var TEXT_COLOR = '#334155'
  var MUTED_COLOR = '#64748b'
  var BORDER_COLOR = '#e2e8f0'

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  // Cabeçalho: logo (img com width/height em atributo, não só CSS) + texto
  // da marca logo abaixo para o caso de imagens bloqueadas.
  function logoHeaderHtml() {
    return (
      '<img src="' +
      LOGO_URL +
      '" alt="Educação SST" width="48" height="48" ' +
      'style="display:block;margin:0 auto 10px;border:0;outline:none;text-decoration:none;" />' +
      '<p style="margin:0;font-family:' +
      FONT +
      ';font-size:16px;font-weight:bold;color:#0f172a;letter-spacing:.4px;">Educação SST</p>' +
      '<p style="margin:4px 0 0;font-family:' +
      FONT +
      ';font-size:11px;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;">Segurança e Saúde no Trabalho</p>'
    )
  }

  // Botão bulletproof: VML (roundrect) para Outlook desktop + tabela/td
  // colorido com o link dentro para todos os outros clientes.
  function bulletproofButton(href, label, bgColor, textColor) {
    var bg = bgColor || '#facc15'
    var tc = textColor || '#0f172a'
    var safeHref = escapeHtml(href || SITE_URL)
    var safeLabel = escapeHtml(label || 'Acessar')
    var vml =
      '<!--[if mso]>' +
      '<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="' +
      safeHref +
      '" style="height:52px;v-text-anchor:middle;width:280px;" arcsize="19%" stroke="f" fillcolor="' +
      bg +
      '">' +
      '<w:anchorlock />' +
      '<center style="color:' +
      tc +
      ';font-family:Arial,sans-serif;font-size:17px;font-weight:bold;">' +
      safeLabel +
      '</center>' +
      '</v:roundrect>' +
      '<![endif]-->'
    var html =
      '<!--[if !mso]><!-->' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;">' +
      '<tr><td align="center" bgcolor="' +
      bg +
      '" style="background-color:' +
      bg +
      ';border-radius:10px;">' +
      '<a href="' +
      safeHref +
      '" target="_blank" style="display:inline-block;padding:16px 40px;font-family:' +
      FONT +
      ';font-size:17px;font-weight:bold;color:' +
      tc +
      ';text-decoration:none;border-radius:10px;mso-padding-alt:0;">' +
      safeLabel +
      '</a>' +
      '</td></tr></table>' +
      '<!--<![endif]-->'
    return vml + html
  }

  // Quadro-resumo: linhas { label, value } em tabela com fundo suave.
  function summaryTableHtml(rows) {
    var list = rows || []
    var body = ''
    for (var i = 0; i < list.length; i++) {
      var borderBottom = i === list.length - 1 ? 'none' : '1px solid ' + BORDER_COLOR
      body +=
        '<tr>' +
        '<td style="padding:10px 16px;font-family:' +
        FONT +
        ';font-size:14px;color:' +
        TEXT_COLOR +
        ';border-bottom:' +
        borderBottom +
        ';text-align:left;">' +
        escapeHtml(list[i].label) +
        '</td>' +
        '<td align="right" style="padding:10px 16px;font-family:' +
        FONT +
        ';font-size:14px;font-weight:bold;color:#0f172a;border-bottom:' +
        borderBottom +
        ';text-align:right;">' +
        escapeHtml(list[i].value) +
        '</td>' +
        '</tr>'
    }
    return (
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;border:1px solid ' +
      BORDER_COLOR +
      ';border-radius:12px;border-collapse:separate;">' +
      body +
      '</table>'
    )
  }

  // Rodapé padrão: razão social/CNPJ, contato do assinante e política de
  // privacidade. Obrigatório em todos os e-mails transacionais.
  function footerHtml() {
    var year = new Date().getFullYear()
    return (
      '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:#f8fafc;border-radius:12px;margin-top:16px;">' +
      '<tr><td align="center" style="padding:28px 40px;font-family:' +
      FONT +
      ';">' +
      '<p style="margin:0 0 8px;font-size:12px;color:' +
      MUTED_COLOR +
      ';line-height:18px;">Educação SST LTDA — CNPJ 56.009.540/0001-90</p>' +
      '<p style="margin:0 0 8px;font-size:12px;color:' +
      MUTED_COLOR +
      ';line-height:18px;">Dúvidas? Fale com a gente: <a href="mailto:' +
      CONTACT_EMAIL +
      '" style="color:' +
      TEXT_COLOR +
      ';text-decoration:underline;">' +
      CONTACT_EMAIL +
      '</a></p>' +
      '<p style="margin:0 0 8px;font-size:12px;color:' +
      MUTED_COLOR +
      ';line-height:18px;"><a href="' +
      PRIVACY_URL +
      '" style="color:' +
      TEXT_COLOR +
      ';text-decoration:underline;">Política de Privacidade</a></p>' +
      '<p style="margin:0;font-size:11px;color:#94a3b8;">© ' +
      year +
      ' Educação SST — Todos os direitos reservados.</p>' +
      '</td></tr></table>'
    )
  }

  // E-mail completo. Opções:
  //   accentColor, badgeText, badgeBg, badgeColor, iconChar, heading,
  //   userName, messageHtml (HTML já confiável, montado pelo chamador),
  //   summaryRows ([{label, value}]), ctaHref, ctaLabel, ctaBg, footerNote.
  function emailShell(opts) {
    opts = opts || {}
    var accent = opts.accentColor || '#2E9E6D'
    var badgeBg = opts.badgeBg || '#D1FAE5'
    var badgeColor = opts.badgeColor || '#065F46'
    var iconChar = opts.iconChar || '✓'
    var summary =
      opts.summaryRows && opts.summaryRows.length ? summaryTableHtml(opts.summaryRows) : ''

    var html =
      '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">' +
      '<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">' +
      '<head>' +
      '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />' +
      '<meta name="viewport" content="width=device-width,initial-scale=1.0" />' +
      '<title>Educação SST</title>' +
      '</head>' +
      '<body style="margin:0;padding:0;background-color:' +
      BG_COLOR +
      ';">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:' +
      BG_COLOR +
      ';"><tr><td align="center" style="padding:32px 12px;">' +
      '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;">' +
      // barra de destaque superior
      '<tr><td style="height:6px;background-color:' +
      accent +
      ';font-size:0;line-height:0;">&nbsp;</td></tr>' +
      // cabeçalho com logo
      '<tr><td align="center" style="padding:32px 40px 8px;">' +
      logoHeaderHtml() +
      '</td></tr>' +
      // badge
      '<tr><td align="center" style="padding:16px 40px 0;">' +
      '<span style="display:inline-block;padding:8px 24px;background-color:' +
      badgeBg +
      ';border-radius:50px;font-family:' +
      FONT +
      ';font-size:13px;font-weight:bold;color:' +
      badgeColor +
      ';letter-spacing:1px;">' +
      escapeHtml(opts.badgeText || '') +
      '</span>' +
      '</td></tr>' +
      // ícone em círculo (tabela, sem flex)
      '<tr><td align="center" style="padding:24px 40px 0;">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>' +
      '<td align="center" width="72" height="72" bgcolor="' +
      badgeBg +
      '" style="width:72px;height:72px;border-radius:36px;font-size:34px;font-family:' +
      FONT +
      ';text-align:center;">' +
      iconChar +
      '</td>' +
      '</tr></table></td></tr>' +
      // título
      '<tr><td align="center" style="padding:24px 40px 0;font-family:' +
      FONT +
      ';">' +
      '<h2 style="margin:0;font-size:26px;line-height:32px;color:#1e293b;font-weight:bold;">' +
      escapeHtml(opts.heading || '') +
      '</h2>' +
      '</td></tr>' +
      // corpo
      '<tr><td style="padding:20px 40px 0;font-family:' +
      FONT +
      ';font-size:16px;line-height:26px;color:' +
      TEXT_COLOR +
      ';">' +
      '<p style="margin:0 0 16px;">Olá <strong>' +
      escapeHtml(opts.userName || '') +
      '</strong>,</p>' +
      (opts.messageHtml || '') +
      '</td></tr>' +
      // quadro-resumo
      (summary ? '<tr><td style="padding:24px 40px 0;">' + summary + '</td></tr>' : '') +
      // botão bulletproof
      (opts.ctaHref
        ? '<tr><td align="center" style="padding:32px 40px 8px;">' +
          bulletproofButton(opts.ctaHref, opts.ctaLabel || 'Acessar Plataforma', opts.ctaBg) +
          '</td></tr>'
        : '') +
      // nota de rodapé do card
      (opts.footerNote
        ? '<tr><td style="padding:16px 40px 32px;font-family:' +
          FONT +
          ';font-size:14px;line-height:22px;color:' +
          MUTED_COLOR +
          ';border-top:1px solid ' +
          BORDER_COLOR +
          ';">' +
          '<p style="margin:16px 0 0;">' +
          escapeHtml(opts.footerNote) +
          '</p></td></tr>'
        : '<tr><td style="padding:16px 40px 32px;font-size:0;line-height:0;">&nbsp;</td></tr>') +
      '</table>' +
      // rodapé padrão (fora do card branco)
      footerHtml() +
      '</td></tr></table></body></html>'
    return html
  }

  return {
    escapeHtml: escapeHtml,
    logoHeaderHtml: logoHeaderHtml,
    bulletproofButton: bulletproofButton,
    summaryTableHtml: summaryTableHtml,
    footerHtml: footerHtml,
    emailShell: emailShell,
    LOGO_URL: LOGO_URL,
    SITE_URL: SITE_URL,
    CONTACT_EMAIL: CONTACT_EMAIL,
  }
})()
