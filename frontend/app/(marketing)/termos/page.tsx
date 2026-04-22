import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Uso — EuthyCare',
  description: 'Termos e condições de utilização da plataforma EuthyCare e do App Euthy.',
}

const UPDATED = '9 de abril de 2026'
const CONTACT = 'suporte@euthycare.com'

export default function TermosPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="bg-cream-100 border-b border-cream-200 py-14 text-center">
        <div className="container-app max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-sage-500 mb-3">Legal</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Termos de Uso</h1>
          <p className="text-sm text-gray-400">Última atualização: {UPDATED}</p>
        </div>
      </section>

      {/* Content */}
      <div className="container-app max-w-2xl py-16 prose prose-gray prose-sm sm:prose-base max-w-none">

        <p className="lead text-gray-600">
          Ao aceder ou utilizar o site EuthyCare ou o App Euthy, concorda com os presentes
          Termos de Uso. Se não concordar, por favor não utilize os nossos serviços.
        </p>

        <hr className="my-8 border-cream-200" />

        <h2>1. Definições</h2>
        <ul>
          <li><strong>"Plataforma"</strong> — site euthycare.com e todos os seus subdomínios</li>
          <li><strong>"App Euthy"</strong> — software SaaS de gestão terapêutica</li>
          <li><strong>"Terapeuta"</strong> — utilizador com conta profissional no App Euthy</li>
          <li><strong>"Utilizador"</strong> — qualquer pessoa que aceda à Plataforma</li>
          <li><strong>"Conteúdo Digital"</strong> — PDFs e recursos vendidos na Loja EuthyCare</li>
        </ul>

        <h2>2. Utilização do site</h2>
        <p>O utilizador compromete-se a:</p>
        <ul>
          <li>Utilizar o site apenas para fins lícitos e de acordo com estes Termos</li>
          <li>Não tentar aceder a áreas restritas ou sistemas sem autorização</li>
          <li>Não introduzir conteúdo malicioso, spam ou dados falsos</li>
          <li>Não usar meios automatizados para recolher dados da Plataforma sem autorização</li>
        </ul>

        <h2>3. App Euthy — SaaS para terapeutas</h2>
        <h3>3.1 Acesso e conta</h3>
        <p>
          O acesso ao App Euthy requer registo e subscrição de um plano pago. As credenciais
          de acesso são pessoais e intransferíveis. O terapeuta é responsável por manter a
          confidencialidade da sua palavra-passe e por todas as atividades realizadas na conta.
        </p>
        <h3>3.2 Responsabilidade clínica</h3>
        <p>
          O App Euthy é uma ferramenta de apoio à gestão terapêutica. <strong>Não substitui
          formação clínica, supervisão profissional nem o julgamento do terapeuta.</strong>
          A EuthyCare não se responsabiliza por decisões clínicas tomadas com base em informações
          geradas pela plataforma, incluindo sugestões de IA.
        </p>
        <h3>3.3 Dados dos pacientes</h3>
        <p>
          O terapeuta é o responsável pelo tratamento dos dados dos seus pacientes (controlador de dados),
          nos termos do RGPD. A EuthyCare atua como sub-processador. O terapeuta garante que obtém
          o consentimento necessário dos seus pacientes para o registo e tratamento de dados clínicos.
        </p>

        <h2>4. Loja — Conteúdo Digital (PDFs)</h2>
        <h3>4.1 Natureza do produto</h3>
        <p>
          Os PDFs e recursos digitais vendidos na Loja EuthyCare são produtos de informação.
          Não constituem consulta clínica, diagnóstico nem prescrição terapêutica.
        </p>
        <h3>4.2 Licença de uso</h3>
        <p>
          Ao adquirir um produto digital, o utilizador recebe uma licença pessoal, não exclusiva
          e intransferível para uso próprio. É proibido redistribuir, revender, partilhar publicamente
          ou reproduzir o conteúdo sem autorização escrita da EuthyCare.
        </p>
        <h3>4.3 Download</h3>
        <p>
          O download é disponibilizado imediatamente após confirmação de pagamento, através de um
          link seguro e temporário. O utilizador pode efetuar até 10 downloads por compra.
          Recomendamos guardar o ficheiro localmente após a transferência.
        </p>

        <h2>5. Pagamentos e faturação</h2>
        <p>
          Os pagamentos são processados pela Stripe, Inc., em euros (EUR). Ao subscrever o App Euthy,
          autoriza a cobrança recorrente (mensal ou anual) no método de pagamento registado.
          O terapeuta recebe recibo por e-mail após cada cobrança.
        </p>
        <p>
          O período de trial (30 dias gratuitos, quando aplicável) não requer cartão. Após o trial,
          a subscrição converte-se automaticamente para o plano escolhido salvo cancelamento antes do fim do período.
        </p>

        <h2>6. Cancelamentos e reembolsos</h2>
        <h3>6.1 Subscrição SaaS</h3>
        <p>
          O cancelamento da subscrição pode ser realizado a qualquer momento na área de conta.
          O acesso mantém-se até ao final do período faturado. Não são emitidos reembolsos
          proporcionais por período não utilizado, exceto quando exigido por lei.
        </p>
        <h3>6.2 Conteúdo digital (PDFs)</h3>
        <p>
          Por se tratarem de produtos digitais com acesso imediato, as vendas de PDFs não são
          reembolsáveis após o download. Exceptuam-se casos de produto defeituoso ou diferente
          do descrito, que serão analisados individualmente no prazo de 7 dias após a compra.
        </p>

        <h2>7. Propriedade intelectual</h2>
        <p>
          Todo o conteúdo da Plataforma — textos, design, logótipos, código, PDFs e materiais
          da Loja — é propriedade da EuthyCare ou dos seus licenciadores, protegido por direitos
          de autor e legislação aplicável. É proibida qualquer reprodução sem autorização prévia.
        </p>

        <h2>8. Limitação de responsabilidade</h2>
        <p>
          A EuthyCare não garante disponibilidade ininterrupta do serviço. Em caso de interrupção
          por manutenção ou falha técnica, envidaremos esforços razoáveis para restabelecer o
          serviço no menor tempo possível.
        </p>
        <p>
          Salvo dolo ou negligência grave, a responsabilidade total da EuthyCare perante o
          utilizador está limitada ao valor pago nos 12 meses anteriores ao evento que originou
          o dano.
        </p>

        <h2>9. Lei aplicável e foro</h2>
        <p>
          Estes Termos são regidos pela lei portuguesa. Para resolução de litígios, as partes
          submetem-se à jurisdição dos tribunais competentes em Portugal, sem prejuízo do direito
          do consumidor de recorrer a entidades de resolução alternativa de litígios (RAL).
        </p>

        <h2>10. Alterações aos Termos</h2>
        <p>
          Podemos atualizar estes Termos. Notificamos alterações materiais com 30 dias de
          antecedência por e-mail. A utilização continuada dos serviços após esse prazo constitui
          aceitação dos novos Termos.
        </p>

        <h2>11. Contacto</h2>
        <p>
          Para questões legais ou contratuais:{' '}
          <a href={`mailto:${CONTACT}`} className="text-sage-600 underline">{CONTACT}</a>
        </p>
      </div>
    </div>
  )
}
