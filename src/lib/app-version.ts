/**
 * Versão do build da aplicação.
 *
 * A plataforma Skip incrementa o campo `version` do package.json a cada
 * publicação (build) e copia o package.json para dist/ (e dev-dist/).
 * Importá-lo daqui garante que a MESMA constante alimenta:
 *  - a versão de cache do service worker (via ?v= no registro do sw.js);
 *  - o rodapé do painel admin ("v0.0.390");
 *  - o name do manifest.json do PWA.
 *
 * Cada novo build muda a versão ⇒ o sw.js registrado é outro arquivo ⇒
 * o navegador reinstala o worker e o activate() limpa os caches antigos.
 */
import pkg from '../../package.json'

const raw = String((pkg as { version?: string })?.version || '0.0.0').trim()

/** Versão legível, ex.: "0.0.389". */
export const APP_VERSION = raw || '0.0.0'

/** Rótulo exibido no rodapé do admin, ex.: "v0.0.389". */
export const APP_VERSION_LABEL = `v${APP_VERSION}`

/** Chave de cache do service worker derivada da versão do build. */
export const APP_CACHE_VERSION = `edu-sst-${APP_VERSION}`
