import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Cookies — EuthyCare',
  description: 'Como utilizamos cookies e como pode gerir as suas preferências no site EuthyCare.',
}

const UPDATED = '9 de abril de 2026'

const cookieTypes = [
  {
    tipo: 'Essenciais',
    cor: 'bg-sage-100 text-sage-700',
    obrigatorio: true,
    descricao: 'Necessários para o funcionamento básico do site. Não podem ser desativados.',
    exemplos: [
      { nome: 'cookie_consent', finalidade: 'Guarda a sua preferência de cookies', duracao: '1 ano' },
      { nome: 'session', finalidade: 'Mantém a sessão autenticada no App Euthy', duracao: 'Sessão' },
      { nome: '__Host-next-auth', finalidade: 'Autenticação segura', duracao: 'Sessão' },
    ],
  },
  {
    tipo: 'Analytics',
    cor: 'bg-lilac-100 text-lilac-700',
    obrigatorio: false,
    descricao: 'Ajudam-nos a perceber como os utilizadores interagem com o site. Todos os dados são anónimos.',
    exemplos: [
      { nome: '_ga', finalidade: 'Google Analytics — identificação de sessão anónima', duracao: '2 anos' },
      { nome: '_ga_*', finalidade: 'Google Analytics — estado da sessão', duracao: '1 ano' },
    ],
  },
  {
    tipo: 'Funcionalidade',
    cor: 'bg-cream-300 text-gray-700',
    obrigatorio: false,
    descricao: 'Permitem funcionalidades melhoradas como preferências de idioma e personalização.',
    exemplos: [
      { nome: 'pref_currency', finalidade: 'Moeda preferida (EUR/USD/BRL)', duracao: '6 meses' },
      { nome: 'pref_lang', finalidade: 'Idioma preferido', duracao: '6 meses' },
    ],
  },
]

export default function CookiesPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="bg-cream-100 border-b border-cream-200 py-14 text-center">
        <div className="container-app max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-sage-500 mb-3">Legal</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Cookies</h1>
          <p className="text-sm text-gray-400">Última atualização: {UPDATED}</p>
        </div>
      </section>

      {/* Content */}
      <div className="container-app max-w-2xl py-16 space-y-10">

        <div className="prose prose-gray prose-sm sm:prose-base max-w-none">
          <p className="lead text-gray-600">
            O site EuthyCare utiliza cookies e tecnologias semelhantes para garantir o seu funcionamento,
            melhorar a sua experiência e analisar a utilização. Esta página explica o que são, para que
            servem e como pode gerir as suas preferências.
          </p>

          <h2>O que são cookies?</h2>
          <p>
            Cookies são pequenos ficheiros de texto guardados no seu dispositivo quando visita um site.
            Permitem ao site lembrar as suas preferências, manter a sua sessão ativa e recolher
            informações de utilização de forma anónima.
          </p>
        </div>

        {/* Cookie type cards */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Tipos de cookies que utilizamos</h2>

          {cookieTypes.map((group) => (
            <div key={group.tipo} className="rounded-2xl border border-cream-200 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 bg-cream-50 border-b border-cream-200">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${group.cor}`}>
                    {group.tipo}
                  </span>
                  <p className="text-sm text-gray-600">{group.descricao}</p>
                </div>
                <span className={`text-xs font-medium ml-4 flex-shrink-0 ${group.obrigatorio ? 'text-sage-500' : 'text-gray-400'}`}>
                  {group.obrigatorio ? 'Sempre ativo' : 'Opcional'}
                </span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-white border-b border-cream-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">Nome</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">Finalidade</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">Duração</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100">
                  {group.exemplos.map((c) => (
                    <tr key={c.nome} className="bg-white">
                      <td className="px-6 py-3 font-mono text-xs text-gray-700">{c.nome}</td>
                      <td className="px-6 py-3 text-gray-500">{c.finalidade}</td>
                      <td className="px-6 py-3 text-gray-400 whitespace-nowrap">{c.duracao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <div className="prose prose-gray prose-sm sm:prose-base max-w-none">
          <h2>Como gerir as suas preferências</h2>
          <p>
            Pode gerir o seu consentimento a qualquer momento:
          </p>
          <ul>
            <li>
              <strong>No banner de cookies</strong> — apresentado na primeira visita ao site,
              permite aceitar todos ou apenas os essenciais.
            </li>
            <li>
              <strong>No browser</strong> — a maioria dos browsers permite bloquear ou apagar
              cookies nas definições. Note que desativar cookies essenciais pode afetar o funcionamento do site.
            </li>
            <li>
              <strong>Google Analytics opt-out</strong> — pode instalar o{' '}
              <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-sage-600 underline">
                add-on de opt-out do Google Analytics
              </a>.
            </li>
          </ul>

          <h2>Cookies de terceiros</h2>
          <p>
            O nosso processador de pagamentos, Stripe, pode definir os seus próprios cookies
            durante o checkout. Consulte a{' '}
            <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-sage-600 underline">
              política de privacidade da Stripe
            </a>.
          </p>

          <h2>Alterações a esta política</h2>
          <p>
            Podemos atualizar esta política periodicamente. A data de última atualização
            é sempre indicada no topo desta página.
          </p>

          <h2>Contacto</h2>
          <p>
            Dúvidas sobre cookies ou privacidade:{' '}
            <a href="mailto:suporte@euthycare.com" className="text-sage-600 underline">
              suporte@euthycare.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
