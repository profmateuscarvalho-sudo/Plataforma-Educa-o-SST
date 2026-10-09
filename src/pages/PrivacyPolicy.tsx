import { useEffect } from 'react'
import { Shield } from 'lucide-react'

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = 'Política de Privacidade — Educação SST'
  }, [])

  const email = 'contato@educacaosst.com.br'

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 pt-[72px] pb-[56px] text-left max-w-4xl">
          <div className="space-y-4">
            <span className="label-overline">Termos e Conformidade</span>
            <h1 className="title-h2-fluid font-serif font-semibold text-foreground tracking-tight">
              Política de Privacidade
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Diretrizes de proteção e tratamento de dados em conformidade com a LGPD (Lei nº
              13.709/2018).
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose prose-slate max-w-none prose-headings:font-serif prose-headings:text-foreground prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-p:leading-relaxed prose-li:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
          <p>
            A Educação SST valoriza a privacidade dos usuários de suas plataformas, incluindo o Hub
            de Estudos e o Agente de Inteligência Artificial disponibilizado via WhatsApp e via
            widget no Hub de Estudos ("Agente IA Educação SST"). Esta Política de Privacidade
            descreve como coletamos, usamos, armazenamos e protegemos os dados pessoais no contexto
            desses serviços, em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº
            13.709/2018 — LGPD).
          </p>

          <h2>1. Dados coletados</h2>
          <p>Ao utilizar o Agente IA Educação SST, podemos coletar:</p>
          <ul>
            <li>Número de telefone (quando o contato ocorre via WhatsApp)</li>
            <li>Conteúdo das mensagens trocadas com o agente (perguntas e respostas)</li>
            <li>
              Dados de conta do Hub de Estudos (quando o uso ocorre pelo widget do Hub), incluindo
              plano de assinatura e histórico de uso
            </li>
            <li>Data e horário das interações</li>
          </ul>
          <p>
            Não coletamos dados sensíveis (como dados de saúde, biometria ou orientação pessoal)
            além do necessário para responder às dúvidas técnicas de Segurança e Saúde no Trabalho
            apresentadas pelo usuário.
          </p>

          <h2>2. Finalidade do uso dos dados</h2>
          <p>Os dados coletados são utilizados para:</p>
          <ul>
            <li>Responder às perguntas do usuário sobre Segurança e Saúde no Trabalho</li>
            <li>Manter o histórico de conversa, permitindo continuidade no atendimento</li>
            <li>
              Auditoria interna de qualidade das respostas do agente, com o objetivo de identificar
              lacunas na base de conhecimento e melhorar continuamente a precisão das orientações
              fornecidas
            </li>
            <li>
              Controle de uso conforme o plano de assinatura do usuário (no caso do Hub de Estudos)
            </li>
          </ul>

          <h2>3. Compartilhamento de dados</h2>
          <p>
            Para funcionar, o Agente IA Educação SST utiliza serviços de infraestrutura de terceiros
            para processamento de linguagem natural e hospedagem (incluindo provedores de tecnologia
            de inteligência artificial e de nuvem). Esses provedores processam os dados estritamente
            para viabilizar o funcionamento do serviço, sob os respectivos termos de proteção de
            dados de cada provedor.
          </p>
          <p>
            Não vendemos nem compartilhamos os dados dos usuários com terceiros para fins de
            marketing ou publicidade.
          </p>

          <h2>4. Armazenamento e retenção</h2>
          <p>
            Os dados são armazenados em ambiente seguro, pelo tempo necessário para cumprir as
            finalidades descritas nesta política, ou conforme exigido por obrigação legal aplicável.
          </p>

          <h2>5. Direitos do usuário (LGPD)</h2>
          <p>O usuário pode, a qualquer momento, solicitar:</p>
          <ul>
            <li>Confirmação da existência de tratamento de seus dados</li>
            <li>Acesso aos dados pessoais armazenados</li>
            <li>Correção de dados incompletos, inexatos ou desatualizados</li>
            <li>
              Eliminação dos dados pessoais tratados, ressalvadas as hipóteses de guarda obrigatória
              por lei
            </li>
            <li>Informação sobre com quem os dados foram compartilhados</li>
          </ul>
          <p>
            Solicitações podem ser feitas pelo e-mail: <a href={`mailto:${email}`}>{email}</a>
          </p>

          <h2>6. Segurança</h2>
          <p>
            Adotamos medidas técnicas e administrativas razoáveis para proteger os dados pessoais
            contra acessos não autorizados e situações de destruição, perda, alteração, comunicação
            ou difusão indevida.
          </p>

          <h2>7. Alterações nesta política</h2>
          <p>
            Esta Política de Privacidade pode ser atualizada periodicamente. A versão vigente estará
            sempre disponível nesta página, com a data da última atualização indicada no topo.
          </p>

          <h2>8. Contato</h2>
          <p>
            Em caso de dúvidas sobre esta política ou sobre o tratamento de seus dados pessoais,
            entre em contato pelo e-mail: <a href={`mailto:${email}`}>{email}</a>
          </p>
        </div>
      </div>
    </div>
  )
}
