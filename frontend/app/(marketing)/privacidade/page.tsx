import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade — EuthyCare',
  description: 'Como recolhemos, usamos e protegemos os seus dados pessoais na plataforma EuthyCare.',
}

const UPDATED = '9 de abril de 2026'
const CONTACT = 'suporte@euthycare.com'

export default function PrivacidadePage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="bg-cream-100 border-b border-cream-200 py-14 text-center">
        <div className="container-app max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-sage-500 mb-3">Legal</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidade</h1>
          <p className="text-sm text-gray-400">Última atualização: {UPDATED}</p>
        </div>
      </section>

      {/* Content */}
      <div className="container-app max-w-2xl py-16 prose prose-gray prose-sm sm:prose-base max-w-none">

        <p className="lead text-gray-600">
          A EuthyCare ("nós", "nosso") respeita a sua privacidade e está comprometida com a proteção
          dos seus dados pessoais. Esta política descreve como recolhemos, usamos e protegemos
          as informações que nos fornece ao utilizar os nossos serviços.
        </p>

        <hr className="my-8 border-cream-200" />

        <h2>1. Responsável pelo tratamento</h2>
        <p>
          EuthyCare, plataforma de saúde mental e gestão terapêutica, contacto:{' '}
          <a href={`mailto:${CONTACT}`} className="text-sage-600 underline">{CONTACT}</a>.
        </p>

        <h2>2. Dados que recolhemos</h2>
        <p>Recolhemos as seguintes categorias de dados pessoais:</p>
        <ul>
          <li><strong>Dados de identificação:</strong> nome e endereço de e-mail, fornecidos ao preencher formulários (lista de espera, contacto, registo).</li>
          <li><strong>Dados de utilização:</strong> páginas visitadas, cliques, tempo de sessão e dispositivo — recolhidos de forma anónima via cookies de analytics.</li>
          <li><strong>Dados de pagamento:</strong> processados diretamente pela Stripe. Não armazenamos números de cartão nem dados bancários nos nossos servidores.</li>
          <li><strong>Dados clínicos (terapeutas):</strong> registos de sessão, notas clínicas e informações de pacientes introduzidas no App Euthy. São considerados dados sensíveis e têm proteção reforçada.</li>
        </ul>

        <h2>3. Finalidade e base legal</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-cream-100">
              <th className="text-left p-3 border border-cream-200">Finalidade</th>
              <th className="text-left p-3 border border-cream-200">Base legal</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Captar interesse na lista de espera', 'Consentimento (Art. 6.º, al. a) RGPD)'],
              ['Prestar o serviço SaaS (App Euthy)', 'Execução de contrato (Art. 6.º, al. b)'],
              ['Processar pagamentos', 'Execução de contrato (Art. 6.º, al. b)'],
              ['Enviar comunicações de serviço', 'Interesse legítimo (Art. 6.º, al. f)'],
              ['Cumprir obrigações legais', 'Obrigação legal (Art. 6.º, al. c)'],
            ].map(([f, b]) => (
              <tr key={f} className="border-b border-cream-200">
                <td className="p-3 border border-cream-200">{f}</td>
                <td className="p-3 border border-cream-200 text-gray-500">{b}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>4. Armazenamento e segurança</h2>
        <p>
          Os dados são armazenados em servidores da Supabase (PostgreSQL) com encriptação em repouso (AES-256)
          e em trânsito (TLS 1.3). O acesso é restrito por autenticação e controlos de autorização por função (RLS).
          Realizamos backups automáticos e mantemos registos de auditoria de acessos.
        </p>
        <p>
          Os dados clínicos introduzidos pelos terapeutas no App Euthy são de propriedade exclusiva
          do terapeuta/clínica e nunca são partilhados com terceiros sem consentimento explícito.
        </p>

        <h2>5. Cookies</h2>
        <p>
          Utilizamos cookies essenciais para o funcionamento do site e cookies de analytics
          (com o seu consentimento) para melhorar a experiência. Pode gerir as suas preferências
          a qualquer momento em{' '}
          <a href="/cookies" className="text-sage-600 underline">Política de Cookies</a>.
        </p>

        <h2>6. Pagamentos e Stripe</h2>
        <p>
          Os pagamentos são processados pela <strong>Stripe, Inc.</strong>, que atua como sub-processador
          de dados. A Stripe é certificada PCI DSS Level 1. Nunca recebemos nem armazenamos dados
          de cartão de crédito — apenas tokens de referência gerados pela Stripe.
          Consulte a{' '}
          <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-sage-600 underline">
            política de privacidade da Stripe
          </a>.
        </p>

        <h2>7. Partilha de dados com terceiros</h2>
        <p>Não vendemos os seus dados. Partilhamos apenas com:</p>
        <ul>
          <li><strong>Stripe</strong> — processamento de pagamentos</li>
          <li><strong>Supabase</strong> — infraestrutura de base de dados</li>
          <li><strong>Serviços de e-mail transacional</strong> — envio de confirmações e notificações</li>
        </ul>
        <p>Todos os sub-processadores operam sob acordos de processamento de dados (DPA) conformes com o RGPD.</p>

        <h2>8. Os seus direitos</h2>
        <p>Nos termos do RGPD e legislação aplicável, tem direito a:</p>
        <ul>
          <li><strong>Acesso</strong> — solicitar cópia dos seus dados pessoais</li>
          <li><strong>Retificação</strong> — corrigir dados incorretos ou incompletos</li>
          <li><strong>Apagamento</strong> — solicitar a eliminação dos seus dados ("direito ao esquecimento")</li>
          <li><strong>Portabilidade</strong> — receber os seus dados em formato estruturado</li>
          <li><strong>Oposição</strong> — opor-se ao tratamento para fins de marketing</li>
          <li><strong>Limitação</strong> — restringir o tratamento em certas circunstâncias</li>
          <li><strong>Retirar consentimento</strong> — a qualquer momento, sem prejuízo do tratamento anterior</li>
        </ul>
        <p>
          Para exercer qualquer direito, contacte:{' '}
          <a href={`mailto:${CONTACT}`} className="text-sage-600 underline">{CONTACT}</a>.
          Respondemos em até 30 dias.
        </p>

        <h2>9. Retenção de dados</h2>
        <p>
          Dados da lista de espera: mantidos até ao lançamento da plataforma ou até solicitar remoção.
          Dados de conta e clínicos: mantidos enquanto a conta estiver ativa e por 5 anos após encerramento
          (obrigação legal). Dados de pagamento: conforme exigido pela legislação fiscal (10 anos).
        </p>

        <h2>10. Alterações a esta política</h2>
        <p>
          Podemos atualizar esta política periodicamente. Notificamos alterações significativas
          por e-mail ou aviso no site. A versão em vigor é sempre a publicada nesta página.
        </p>

        <h2>11. Contacto</h2>
        <p>
          Dúvidas, pedidos ou reclamações relacionadas com privacidade:{' '}
          <a href={`mailto:${CONTACT}`} className="text-sage-600 underline">{CONTACT}</a>
          <br />
          Tem também o direito de apresentar reclamação junto da CNPD (Portugal) ou da autoridade
          de supervisão do seu país.
        </p>
      </div>
    </div>
  )
}
