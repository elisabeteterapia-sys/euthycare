import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Calendar, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

// ── Article data ──────────────────────────────────────────────

const articles: Record<string, {
  slug: string
  title: string
  excerpt: string
  category: string
  readTime: string
  date: string
  author: string
  content: string[]
}> = {
  'tcc-ansiedade-guia-pratico': {
    slug: 'tcc-ansiedade-guia-pratico',
    title: 'TCC para ansiedade: guia prático para terapeutas',
    excerpt: 'Um panorama das principais técnicas cognitivo-comportamentais e como aplicá-las de forma eficaz no contexto clínico.',
    category: 'TCC',
    readTime: '8 min',
    date: '5 de abril, 2026',
    author: 'Equipe Euthycare',
    content: [
      'A Terapia Cognitivo-Comportamental (TCC) é uma das abordagens mais estudadas e validadas para o tratamento dos transtornos de ansiedade. Desde os trabalhos pioneiros de Aaron Beck e Albert Ellis, ela evoluiu consideravelmente — e hoje integra técnicas de terceira geração como ACT e mindfulness-based CBT.',
      '## Princípios fundamentais da TCC na ansiedade',
      'A TCC parte do pressuposto de que os pensamentos automáticos negativos mantêm e amplificam a resposta de ansiedade. O trabalho terapêutico envolve três eixos centrais: identificação dos pensamentos disfuncionais, reestruturação cognitiva e exposição gradual aos estímulos ansiogênicos.',
      'No contexto clínico, é fundamental não apenas ensinar as técnicas, mas ajudar o paciente a compreender o modelo cognitivo — como a interpretação dos eventos, e não os eventos em si, gera sofrimento.',
      '## Técnicas essenciais na prática',
      'O **registro de pensamentos** é a ferramenta base. Peça ao paciente que anote a situação, o pensamento automático, a emoção sentida (em percentagem de intensidade) e a resposta alternativa. Com o tempo, esse processo torna-se internamente automático.',
      'A **exposição gradual** é insubstituível para fobias e transtorno de pânico. Construa uma hierarquia de situações ansiogênicas com o paciente — do menor ao maior gatilho — e avance progressivamente, garantindo que cada etapa seja consolidada antes de ir à seguinte.',
      'A **técnica do termômetro de ansiedade** (SUDS — Subjective Units of Distress Scale) ajuda a monitorar a intensidade durante as sessões de exposição e a demonstrar ao paciente que a ansiedade, naturalmente, diminui se não for evitada.',
      '## Adaptando para diferentes apresentações',
      'No transtorno de ansiedade generalizada (TAG), o foco recai sobre a intolerância à incerteza e as preocupações crónicas. Técnicas como a área de preocupação delimitada, o adiamento de preocupações e a resolução de problemas estruturada são particularmente eficazes.',
      'Já no transtorno de pânico, a psicoeducação sobre a resposta de luta-ou-fuga é o primeiro passo. Muitos pacientes interpretam os sintomas físicos do pânico como sinais de doença grave — desfazer essa leitura catastrófica é central para o progresso.',
      '## Integração com ferramentas digitais',
      'Plataformas como o Euthy permitem ao terapeuta acompanhar os registros de humor e pensamentos do paciente entre sessões, tornando a TCC mais contínua e menos dependente dos 50 minutos semanais. O registro sistemático fora do consultório potencializa os resultados.',
    ],
  },
  'mindfulness-sessoes': {
    slug: 'mindfulness-sessoes',
    title: 'Como integrar mindfulness nas sessões clínicas',
    excerpt: 'Práticas contemplativas validadas pela ciência que pode introduzir na sua prática terapêutica de forma gradual e eficaz.',
    category: 'Mindfulness',
    readTime: '5 min',
    date: '1 abr 2026',
    author: 'Equipe Euthycare',
    content: [
      'Mindfulness — atenção plena ao momento presente, sem julgamento — deixou de ser um conceito espiritual para se tornar uma intervenção clínica com ampla base empírica. Protocolos como MBSR (Mindfulness-Based Stress Reduction) e MBCT (Mindfulness-Based Cognitive Therapy) têm ensaios clínicos robustos por trás.',
      '## Por onde começar nas sessões',
      'Não é necessário ser um praticante avançado para introduzir mindfulness na sua prática. Comece com pequenas âncoras: um minuto de atenção à respiração no início da sessão, uma pausa de escaneamento corporal a meio, ou um momento de gratidão antes de encerrar.',
      'Esses microintervalos ajudam o paciente a sair do modo automático e a entrar em contacto com o que está sentindo agora — não o que imagina que sentirá amanhã.',
      '## Exercícios práticos para diferentes perfis',
      'Para pacientes ansiosos com tendência à ruminação, a **prática dos 5 sentidos** (notar 5 coisas que vê, 4 que sente, 3 que ouve, 2 que cheira, 1 que prova) é uma âncora sensorial eficaz para interromper o loop de preocupações.',
      'Para pacientes com dificuldade de acesso emocional, o **escaneamento corporal guiado** — percorrer lentamente cada região do corpo e notar sensações — cria um canal de comunicação entre corpo e mente que muitas vezes as abordagens exclusivamente verbais não alcançam.',
      '## Cuidados éticos e contraindicações',
      'Mindfulness não é indicado sem adaptações para pacientes em fase aguda de trauma ou dissociação. Praticar atenção plena ao corpo pode ser retraumatizante nesse contexto. Prefira abordagens orientadas para a estabilidade antes de introduzir práticas contemplativas.',
    ],
  },
  'prontuario-digital-lgpd': {
    slug: 'prontuario-digital-lgpd',
    title: 'Prontuários digitais e LGPD: o que você precisa saber',
    excerpt: 'Um guia claro sobre as obrigações legais do terapeuta ao armazenar dados clínicos em formato digital.',
    category: 'Jurídico',
    readTime: '6 min',
    date: '28 mar 2026',
    author: 'Equipe Euthycare',
    content: [
      'A Lei Geral de Proteção de Dados (LGPD) entrou em vigor no Brasil em 2020 e trouxe obrigações concretas para todos que tratam dados pessoais — incluindo terapeutas independentes e clínicas. Dados de saúde são considerados **dados sensíveis** e têm proteção reforçada.',
      '## O que são dados sensíveis na LGPD',
      'Segundo o Art. 5º da LGPD, dados sensíveis incluem informações sobre saúde, vida sexual, origem racial, convicção religiosa e opinião política. Todo o conteúdo dos prontuários clínicos se enquadra nessa categoria — o que implica exigências adicionais de segurança e consentimento.',
      '## Obrigações práticas do terapeuta',
      'O terapeuta é considerado **controlador de dados** quando decide como e por que coleta informações dos pacientes. As principais obrigações incluem: obter consentimento explícito e informado, garantir meios de acesso e correção dos dados pelo titular, e notificar incidentes de segurança.',
      'O prontuário digital deve estar em ambiente com encriptação em repouso e em trânsito, acesso restrito por autenticação e backup regular. Plataformas como o Euthy já implementam esses requisitos por design.',
      '## Tempo de guarda e descarte',
      'O Conselho Federal de Psicologia (CFP) estabelece que prontuários devem ser guardados por no mínimo **5 anos** após o encerramento do acompanhamento. Para menores, o prazo é de 5 anos após a maioridade. O descarte deve ser seguro — não basta apagar o ficheiro.',
      '## Quando o CFP e a LGPD coincidem',
      'A resolução CFP 01/2009 já previa sigilo e segurança dos dados clínicos antes da LGPD. As duas normas se complementam: o CFP define a ética profissional, a LGPD define o tratamento legal dos dados. O terapeuta precisa cumprir ambas.',
    ],
  },
  'criancas-emocoes': {
    slug: 'criancas-emocoes',
    title: 'Trabalhando regulação emocional com crianças',
    excerpt: 'Técnicas adaptadas ao desenvolvimento infantil para ajudar crianças a identificar e gerir as suas emoções.',
    category: 'Infância',
    readTime: '7 min',
    date: '22 mar 2026',
    author: 'Equipe Euthycare',
    content: [
      'A capacidade de regular emoções não é inata — desenvolve-se ao longo da infância e adolescência, com a ajuda de figuras de vinculação e contextos seguros. O terapeuta infantil tem um papel único nesse processo: modelar, nomear e normalizar o mundo emocional da criança.',
      '## O vocabulário emocional como ponto de partida',
      'Muitas crianças chegam ao consultório com um vocabulário emocional restrito: "bem", "mal", "com raiva". Ampliar esse repertório é o primeiro passo. Ferramentas como o **Jogo das Emoções** (cartas com expressões faciais), o **Roda das Emoções de Plutchik** adaptada para crianças, ou a linguagem dos filmes de animação (as personagens de *Divertida Mente* são um recurso psicoedcuativo poderoso) funcionam muito bem.',
      '## Técnicas de regulação por faixa etária',
      'Para **pré-escolares (3-6 anos)**, a regulação é essencialmente co-regulação: a criança precisa de um adulto calmo ao lado. Técnicas como respiração barriga/balão, a imagem do "semáforo das emoções" e jogos sensoriais de base são mais eficazes que intervenções verbais.',
      'Para **crianças em idade escolar (7-12 anos)**, já é possível trabalhar com psicoeducação mais estruturada. O mapa corporal das emoções — onde cada emoção "fica" no corpo — e as estratégias de afastamento cognitivo (imaginar a emoção como uma onda que passa) ganham aderência.',
      '## O papel da família no processo',
      'A regulação emocional não se generaliza do consultório para casa sozinha. Investir em sessões de orientação parental — ensinando os cuidadores a nomear, validar e co-regular sem minimizar ou amplificar — é tão importante quanto o trabalho direto com a criança.',
    ],
  },
  'renda-extra-terapeutas': {
    slug: 'renda-extra-terapeutas',
    title: 'Como gerar renda extra vendendo recursos digitais',
    excerpt: 'Guias, planilhas e PDFs terapêuticos como fonte de receita passiva para terapeutas.',
    category: 'Carreira',
    readTime: '4 min',
    date: '15 mar 2026',
    author: 'Equipe Euthycare',
    content: [
      'O conhecimento clínico que acumula ao longo dos anos tem valor além das sessões presenciais ou online. Terapeutas em todo o mundo estão a descobrir que recursos digitais — PDFs, planilhas, guias de exercícios, protocolos simplificados — são uma forma de gerar receita passiva enquanto ampliam o seu impacto.',
      '## O que vende bem na área da saúde mental',
      'Os produtos digitais mais procurados por outros terapeutas e pelo público geral incluem: diários terapêuticos (de humor, de gratidão, de autocuidado), guias de psicoeducação sobre ansiedade e depressão, fichas de trabalho para TCC, kits de exercícios de mindfulness e planilhas de gestão do consultório.',
      'Para o público leigo, materiais acessíveis sobre temas como autoestima, limites saudáveis e comunicação não-violenta têm grande procura.',
      '## Como começar sem complicar',
      'Comece com o que já produz para os seus pacientes. Aquela ficha de registro de pensamentos que criou, o guia de relaxamento que envia por e-mail, o protocolo de psicoeducação que usa nas primeiras sessões — com pequenas adaptações, esses materiais podem ser vendidos digitalmente.',
      'Ferramentas como Canva facilitam o design profissional sem precisar de um designer. A distribuição pode ser feita pela Loja Euthy, por Hotmart, Gumroad ou diretamente via link com pagamento Stripe.',
      '## Considerações éticas',
      'Garanta que os materiais não substituem atendimento clínico — deixe isso claro na descrição. Evite promessas terapêuticas que possam ser interpretadas como diagnóstico ou tratamento. Consulte o código de ética do CFP ou da OP (Ordem dos Psicólogos) conforme o seu país.',
    ],
  },
  'gestao-consultorio': {
    slug: 'gestao-consultorio',
    title: '5 erros de gestão que afetam terapeutas independentes',
    excerpt: 'Os erros mais comuns na gestão de um consultório privado e como evitá-los sem perder tempo clínico.',
    category: 'Gestão',
    readTime: '5 min',
    date: '10 mar 2026',
    author: 'Equipe Euthycare',
    content: [
      'Gerir um consultório independente exige habilidades que nenhuma formação clínica ensina formalmente: precificação, agenda, fluxo de caixa, cancelamentos. A maioria dos terapeutas aprende na prática — e frequentemente, da forma mais difícil.',
      '## Erro 1: não ter política de cancelamento clara',
      'Cancelamentos de última hora são a principal fonte de perda de receita para terapeutas independentes. Sem uma política escrita e comunicada antecipadamente, fica difícil cobrar a sessão ou encontrar substituto para o horário. Defina com antecedência: quantas horas de aviso são necessárias, e o que acontece se o prazo não for respeitado.',
      '## Erro 2: subprecificar por culpa',
      'A síndrome do impostor leva muitos terapeutas a cobrar abaixo do mercado por sentirem que "não merecem" o valor que praticam. Precifique considerando: formação, supervisão, custos fixos (espaço, plataforma, material), tempo de preparo e gestão — não apenas a hora da sessão.',
      '## Erro 3: não separar finanças pessoais e profissionais',
      'Misturar contas é a forma mais eficaz de não saber se o consultório é lucrativo. Abra uma conta separada para receber pagamentos, pague um pró-labore fixo para si mesmo e trate o restante como reserva do negócio.',
      '## Erro 4: agenda reativa em vez de proativa',
      'Deixar os pacientes marcarem conforme querem resulta em horários dispersos, deslocamentos ineficientes e dificuldade de bloquear tempo para supervisão e desenvolvimento. Reserve blocos fixos e comunique a sua disponibilidade real.',
      '## Erro 5: não usar tecnologia para automatizar o operacional',
      'Confirmações manuais, cobranças por WhatsApp, prontuários em papel — cada um desses processos consome tempo que poderia ser clínico ou de descanso. Plataformas como o Euthy automatizam lembretes, organizam prontuários e centralizam cobranças.',
    ],
  },
  'trauma-abordagens': {
    slug: 'trauma-abordagens',
    title: 'Abordagens contemporâneas no tratamento do trauma',
    excerpt: 'De EMDR a Somatic Experiencing: um panorama das intervenções baseadas em evidência para trauma complexo.',
    category: 'Clínica',
    readTime: '9 min',
    date: '3 mar 2026',
    author: 'Equipe Euthycare',
    content: [
      'O campo do tratamento do trauma transformou-se profundamente nas últimas três décadas. A compreensão de que o trauma não é apenas um evento, mas uma experiência que se inscreve no sistema nervoso e na memória implícita, abriu caminho para abordagens que vão além da narrativa verbal.',
      '## EMDR: o que a evidência diz',
      'A Dessensibilização e Reprocessamento por Movimentos Oculares (EMDR) é reconhecida pela OMS como tratamento de primeira linha para PTSD. O protocolo de oito fases de Francine Shapiro integra estimulação bilateral (ocular, auditiva ou tátil) com processamento de memórias traumáticas, facilitando a reconsolidação adaptativa.',
      'Para terapeutas em formação em EMDR: o investimento em supervisão é indispensável. Aplicar EMDR sem formação adequada pode retraumatizar o paciente.',
      '## Somatic Experiencing e o papel do corpo',
      'Desenvolvida por Peter Levine a partir da observação de animais selvagens, a Somatic Experiencing (SE) parte do princípio de que o trauma é uma resposta de sobrevivência incompleta — uma energia que ficou "presa" no sistema nervoso. A abordagem trabalha com as sensações corporais, não com a narrativa do evento.',
      'A SE é particularmente indicada para trauma pré-verbal, trauma de desenvolvimento e casos em que a abordagem verbal reactiva sintomas dissociativos.',
      '## Trauma complexo e CPTSD',
      'O DSM-5 ainda não reconhece formalmente o CPTSD (Transtorno de Estresse Pós-Traumático Complexo), mas a ICD-11 já o inclui. Caracteriza-se por perturbações na regulação afetiva, na identidade e nas relações interpessoais — resultado de trauma prolongado e repetido, frequentemente na infância.',
      'O tratamento do trauma complexo é fásico: primeiro estabilização e segurança, depois processamento das memórias traumáticas, finalmente integração. Pular fases por pressão de tempo ou por pedido do paciente é um dos erros mais comuns — e potencialmente prejudiciais.',
      '## Integração de abordagens na prática',
      'Nenhuma abordagem é universalmente superior. O terapeuta que conhece mais de um modelo pode adaptar a intervenção ao perfil do paciente: um cliente altamente verbal e com boa capacidade de observação do self pode beneficiar-se de TCC focada no trauma; um cliente com muita somatização pode responder melhor à SE; um cliente com memórias encapsuladas e dissociação controlada é bom candidato ao EMDR.',
    ],
  },
}

const categoryVariants: Record<string, 'sage' | 'lilac' | 'cream' | 'amber'> = {
  TCC: 'sage', Mindfulness: 'lilac', Jurídico: 'cream',
  Infância: 'lilac', Carreira: 'amber', Gestão: 'cream', Clínica: 'sage',
}

// ── Helpers ───────────────────────────────────────────────────

function renderContent(paragraphs: string[]) {
  return paragraphs.map((p, i) => {
    if (p.startsWith('## ')) {
      return (
        <h2 key={i} className="text-xl font-bold text-gray-900 mt-10 mb-4">
          {p.replace('## ', '')}
        </h2>
      )
    }
    // inline bold via **text**
    const parts = p.split(/\*\*(.*?)\*\*/g)
    return (
      <p key={i} className="text-gray-600 leading-relaxed mb-5">
        {parts.map((part, j) =>
          j % 2 === 1 ? <strong key={j} className="text-gray-800">{part}</strong> : part
        )}
      </p>
    )
  })
}

// ── Metadata ──────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const article = articles[slug]
  if (!article) return { title: 'Artigo não encontrado — EuthyCare' }
  return {
    title: `${article.title} — Blog EuthyCare`,
    description: article.excerpt,
  }
}

// ── Page ──────────────────────────────────────────────────────

export default async function BlogPostPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const article = articles[slug]
  if (!article) notFound()

  const related = Object.values(articles)
    .filter((a) => a.slug !== slug)
    .slice(0, 3)

  return (
    <>
      {/* Back */}
      <div className="border-b border-cream-200 bg-white">
        <div className="container-app py-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-sage-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Blog
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="py-14 bg-gradient-to-b from-cream-100 to-white">
        <div className="container-app max-w-3xl text-center">
          <Badge variant={categoryVariants[article.category] ?? 'sage'} className="mb-5">
            {article.category}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-6">
            {article.title}
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed mb-8">{article.excerpt}</p>
          <div className="flex flex-wrap justify-center gap-5 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />{article.readTime} de leitura
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />{article.date}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />{article.author}
            </span>
          </div>
        </div>
      </section>

      {/* Cover placeholder */}
      <div className="container-app max-w-3xl mb-12">
        <div className="rounded-3xl bg-gradient-to-br from-sage-200 to-lilac-200 h-64 w-full" />
      </div>

      {/* Content */}
      <article className="container-app max-w-2xl pb-20">
        {renderContent(article.content)}
      </article>

      {/* CTA */}
      <section className="bg-sage-50 border-y border-sage-100 py-14">
        <div className="container-app max-w-2xl text-center">
          <p className="text-sm font-medium text-sage-600 mb-2">Euthy para terapeutas</p>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Organize a sua prática com o Euthy
          </h2>
          <p className="text-gray-500 mb-6 text-sm">
            Prontuários digitais, agenda, cobrança e IA de apoio clínico — tudo num só lugar.
          </p>
          <Link href="/euthy-lancamento">
            <Button className="gap-2">
              Entrar na lista de espera
            </Button>
          </Link>
        </div>
      </section>

      {/* Related posts */}
      <section className="page-section">
        <div className="container-app max-w-4xl">
          <h2 className="text-xl font-bold text-gray-900 mb-8">Outros artigos</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {related.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                <div className="rounded-2xl bg-gradient-to-br from-cream-200 to-lilac-100 h-24 mb-3 group-hover:opacity-90 transition-opacity" />
                <Badge variant={categoryVariants[post.category] ?? 'cream'} className="mb-2 text-xs">
                  {post.category}
                </Badge>
                <h3 className="text-sm font-semibold text-gray-800 leading-snug group-hover:text-sage-600 transition-colors">
                  {post.title}
                </h3>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />{post.readTime}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
