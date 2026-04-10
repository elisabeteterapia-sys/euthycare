---
task: "Create Instagram Feed"
order: 2
input: |
  - angle: Ângulo selecionado pelo usuário (lido de output/angle-selection.md)
  - tone: Tom de voz selecionado (de tone-of-voice.md)
  - format_rules: Regras da plataforma Instagram Feed (injetadas pelo Pipeline Runner)
output: |
  - carousel: Carrossel completo com todos os slides, legenda e hashtags no formato padrão
---

# Create Instagram Feed

Produz carrossel completo para o Instagram feed da Euthycare a partir do ângulo e tom aprovados. Inclui todos os slides com hierarquia visual, legenda otimizada e hashtags calibradas.

## Process

1. **Ler o angle-selection.md** — absorver o ângulo aprovado, hook e premissa
2. **Verificar tone-of-voice.md** — confirmar o tom selecionado pelo usuário
3. **Escolher o formato de carrossel** mais adequado ao ângulo:
   - Medo/Urgência → Problema → Solução ou Mito vs Realidade
   - Oportunidade → Editorial/Tese ou Antes e Depois
   - Educacional → Listicle ou Tutorial Passo-a-Passo
   - Contrário → Mito vs Realidade ou Editorial/Tese
   - Inspiracional → Storytelling ou Antes e Depois
4. **Criar cover slide** com título ≤20 palavras, provocativo, sem resposta prematura
5. **Redigir 6-8 slides de conteúdo** — cada slide: headline bold (insight principal) + texto de apoio (40-80 palavras totais), fundo alternando claro/escuro/accent
6. **Criar CTA slide** com fonte da notícia e ação específica (não genérica)
7. **Escrever legenda** — hook nos 125 primeiros chars, corpo com expansão do argumento, pergunta aberta ou CTA no final
8. **Selecionar 5-15 hashtags** em mix de niche (<50K posts), mid-range (50K-500K) e broad (>500K)

## Output Format

```
=== FORMATO ===
[Nome do formato escolhido]

=== SLIDES ===

Slide 1 (Cover):
  Title: [Título provocativo — máx 20 palavras]
  Photo: [Descrição da foto ideal]
  Background: [foto com overlay / cor sólida]

Slide 2 ([Papel do slide]):
  Headline: [Texto grande, bold — insight principal]
  Photo: [Descrição se aplicável]
  Supporting text: [Texto menor — contexto, dado, elaboração | 40-80 palavras totais]
  Accent keywords: [Palavras a destacar em cor de acento]
  Background: [light / dark / accent]

[Slides 3 a N seguindo o mesmo padrão]

Slide N (CTA):
  Photo: [Imagem de fechamento]
  Source: [Artigo, estudo ou resolução que originou o conteúdo]
  CTA: [Ação específica e rastreável]

=== CAPTION ===
[Hook — primeiros 125 chars que funcionam como standalone]

[Corpo — expansão do argumento com quebras de linha]

[Fechamento — pergunta aberta ou CTA que incentiva comentário]

=== HASHTAGS ===
#hashtag1 #hashtag2 [5-15 hashtags com mix niche/mid/broad]
```

## Output Example

```
=== FORMATO ===
Listicle / Lista (8 slides)

=== SLIDES ===

Slide 1 (Cover):
  Title: "5 mudanças da resolução CFP que todo terapeuta online precisa saber"
  Photo: terapeuta em consultório moderno com laptop, expressão focada
  Background: foto com overlay escuro e texto branco bold

Slide 2 (Item 1):
  Headline: "1. Plataforma certificada é obrigatória"
  Photo: ícone de cadeado sobre fundo escuro
  Supporting text: "A partir de julho, sessões online só podem ser conduzidas em plataformas com criptografia de ponta a ponta e registro de acesso auditável. Ferramentas de videochamada generalistas — sem certificação específica — ficam fora dos critérios."
  Accent keywords: "criptografia de ponta a ponta"
  Background: dark

Slide 3 (Item 2):
  Headline: "2. Prontuário eletrônico exige backup em nuvem"
  Supporting text: "A resolução determina que prontuários digitais tenham backup automático com redundância e possibilidade de exportação a qualquer momento. Arquivos salvos apenas localmente no computador não atendem os novos critérios."
  Accent keywords: "backup automático"
  Background: light

Slide 4 (Item 3):
  Headline: "3. Consentimento digital tem validade jurídica"
  Supporting text: "Boa notícia para quem já usa sistemas digitais: o CFP reconhece o consentimento assinado digitalmente como equivalente ao físico, desde que o sistema registre data, hora e identificação do signatário. Adeus à impressão de documentos."
  Accent keywords: "consentimento assinado digitalmente"
  Background: accent

Slide 5 (Item 4):
  Headline: "4. Gravação de sessão exige autorização renovável"
  Supporting text: "Se você grava sessões para supervisão ou estudo clínico, precisa de autorização escrita — física ou digital — do paciente, renovável a cada 6 meses. Gravação sem consentimento atualizado configura infração ética."
  Accent keywords: "autorização renovável"
  Background: dark

Slide 6 (Item 5):
  Headline: "5. Prazo de adequação: 90 dias após julho de 2026"
  Supporting text: "O CFP estabeleceu janela de adaptação de 90 dias a partir da entrada em vigor, prevista para julho de 2026. Terapeutas que não se adequarem nesse período ficam sujeitos a processo ético no CRP de sua região."
  Accent keywords: "90 dias"
  Background: light

Slide 7 (Síntese):
  Headline: "O que fazer esta semana"
  Supporting text: "1. Verifique se sua plataforma tem certificação CFP-compatível. 2. Ative o backup automático dos prontuários. 3. Atualize o termo de consentimento digital. 4. Documente as autorizações de gravação. 5. Coloque julho no calendário."
  Background: dark

Slide 8 (CTA):
  Photo: logo Euthycare sobre fundo claro
  Source: Resolução CFP 001/2026 — cfp.org.br/resolucoes
  CTA: "Comenta RESOLUÇÃO e eu te mando o checklist completo de adequação no seu DM"

=== CAPTION ===
A nova resolução do CFP mudou as regras para quem atende online — e o prazo de adequação começa a contar em julho.

Se você ainda usa ferramentas não certificadas ou não tem backup automático dos prontuários, o momento de agir é agora.

Desliza até o final para ver os 5 pontos que mudam na sua rotina — e o checklist de adequação no último slide.

Sua plataforma já está dentro dos novos critérios? Conta nos comentários.

=== HASHTAGS ===
#terapeutas #psicologia #CFP #teleatendimento #resolucaoCFP #prontuarioeletronico #psicologiadigital #consultorioonline #saúdementaldigital #gestaodesaude #psicologos
```

## Quality Criteria

- [ ] Formato de carrossel explicitamente nomeado e compatível com o ângulo
- [ ] Cover com título ≤20 palavras que para o scroll
- [ ] Cada slide tem headline + texto de apoio com mínimo 40 palavras totais
- [ ] Cada slide tem máximo 80 palavras totais
- [ ] Fundos alternam entre light/dark/accent ao longo dos slides
- [ ] Legenda tem hook nos primeiros 125 caracteres
- [ ] Legenda termina com pergunta aberta ou CTA rastreável
- [ ] 5-15 hashtags com mix de niche/mid-range/broad
- [ ] Nenhum link clicável na legenda
- [ ] CTA do último slide é específico (não "siga o perfil")

## Veto Conditions

Reject and redo if ANY are true:
1. Qualquer slide tem menos de 40 palavras totais (headline + texto de apoio)
2. A legenda começa com um clichê ("Em um mundo cada vez mais digital", "Você sabia que", "Hoje vamos falar sobre")
3. O CTA do último slide é genérico ("siga para mais conteúdo", "curta e compartilhe")
