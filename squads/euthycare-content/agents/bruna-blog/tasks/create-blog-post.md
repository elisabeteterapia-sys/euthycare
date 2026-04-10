---
task: "Create Blog Post"
order: 1
input: |
  - angle: Ângulo selecionado (lido de output/angle-selection.md)
  - tone: Tom de voz confirmado (de tone-of-voice.md)
  - format_rules: Regras da plataforma Blog Post (injetadas pelo Pipeline Runner)
output: |
  - blog_post: Artigo completo com título, meta description, intro, corpo com H2/H3, conclusão e CTA
---

# Create Blog Post

Produz artigo de 1.500-2.500 palavras para o blog da Euthycare a partir do ângulo aprovado. Inclui estrutura SEO completa, links internos e externos, e CTA específico na conclusão.

## Process

1. **Ler angle-selection.md** — absorver o ângulo, hook e premissa aprovados
2. **Escolher o formato do artigo** mais adequado ao ângulo:
   - Educacional → How-to guide ou Listicle
   - Medo/Urgência → Problema/Solução
   - Oportunidade → Lições aprendidas ou Comparação
   - Contrário → Problema/Solução ou Lições
3. **Estruturar o outline** com 4-6 seções H2, cada uma cobrindo um ponto principal (200-300 palavras cada)
4. **Redigir intro** — hook nas primeiras 2-3 frases (dado, afirmação ou cenário), depois a promessa do artigo
5. **Escrever o corpo** seção por seção — cada H2 começa com o ponto principal, sustenta com evidência/exemplo/dado, fecha com transição
6. **Incluir 3+ links internos** e **2+ links externos** tecidos contextualmente (não em lista no final)
7. **Escrever conclusão** com resumo de 1-2 frases + CTA específico
8. **Redigir título** (≤70 chars, keyword frontal) e **meta description** (150-160 chars) por último

## Output Format

```
=== TÍTULO ===
[≤70 chars, keyword frontal, promessa clara]

=== META DESCRIPTION ===
[150-160 chars — segundo headline, promessa de valor]

=== INTRO ===
[Hook — dado, afirmação ousada ou cenário específico. 1-2 frases.]

[Promessa — o que o leitor vai aprender ou ganhar. 1 frase.]

=== BODY ===

## [H2 — Subheading descritivo, scannable como standalone]
[200-300 palavras — ponto principal + evidência + transição]

### [H3 — Subdivisão se necessário]
[100-150 palavras]

## [H2 — Próxima seção]
[200-300 palavras]

[Continuar para 4-6 seções H2 totais]

=== CONCLUSÃO ===
[Resumo dos pontos principais — 1-2 frases]

[CTA específico — verbo + objeto + benefício]

=== POST NOTES ===
Contagem de palavras: [número]
Links internos: [3+ com texto âncora sugerido e URL]
Links externos: [2+ com fonte e URL]
Quebras visuais sugeridas: [lista de onde inserir imagem/callout/lista]
```

## Output Example

```
=== TÍTULO ===
Resolução CFP 001/2026: guia para adequar seu consultório online

=== META DESCRIPTION ===
Entenda as 5 mudanças da resolução CFP 001/2026 e siga o checklist para adequar seu atendimento online antes do prazo de julho.

=== INTRO ===
Em março de 2026, o Conselho Federal de Psicologia publicou a resolução que mais impacta terapeutas que atuam online desde a pandemia. E ao contrário do que circula nas redes, ela não é punitiva — é uma oportunidade de organização.

Neste guia, você vai entender exatamente o que mudou, o que precisa ser adequado no seu consultório, e como fazer isso antes do prazo de outubro sem precisar contratar um advogado.

=== BODY ===

## O que a resolução CFP 001/2026 realmente determina
A resolução publicada em março de 2026 atualiza as normas para o atendimento psicológico telepresencial, estabelecendo critérios técnicos para plataformas, prontuários e documentação. Em linguagem simples: se você atende online, precisa verificar se a sua ferramenta e os seus processos atendem a quatro critérios específicos.

O documento completo está disponível no [site do CFP](https://cfp.org.br) e tem 12 artigos. Para o terapeuta que atende online de forma autônoma, três deles têm impacto direto na rotina.

Uma coisa importante antes de entrar nos detalhes: a resolução não proíbe atendimento online. Ela regulamenta. Isso é uma diferença fundamental que muitos resumos que circulam nas redes estão ignorando.

## As 5 mudanças que afetam o seu dia a dia

### 1. Plataforma certificada é obrigatória
A partir de julho de 2026, sessões telepresenciais só podem ser conduzidas em plataformas que atendem a três critérios: criptografia de ponta a ponta, controle de acesso auditável, e conformidade com a LGPD. Ferramentas de videochamada generalistas — como versões gratuitas de Zoom ou Google Meet sem contrato corporativo — não atendem automaticamente esses critérios.

Isso não significa que você precisa trocar de plataforma amanhã. Significa que você precisa verificar se a plataforma que usa tem documentação de conformidade. A maioria das plataformas especializadas em atendimento clínico já atende esses critérios — [confira nossa lista de plataformas certificadas](#).

### 2. Prontuário eletrônico exige backup em nuvem
...

## Checklist de adequação: o que fazer esta semana
...

## Perguntas frequentes sobre a resolução
...

## Recursos e referências oficiais
...

=== CONCLUSÃO ===
A adequação à resolução 001/2026 não precisa ser complexa. Com os quatro pontos deste guia, a maioria dos terapeutas consegue se adequar em uma tarde — especialmente se já usa uma plataforma especializada.

Se quiser fazer a transição com segurança, o Euthycare já está totalmente adequado aos novos critérios. [Teste grátis por 14 dias](https://euthycare.com/cadastro) — sem precisar mudar toda a sua rotina de uma vez.

=== POST NOTES ===
Contagem de palavras: ~1.800
Links internos: [lista de plataformas certificadas], [artigo sobre prontuário eletrônico], [artigo sobre LGPD para psicólogos]
Links externos: [CFP.org.br — texto da resolução], [CFP — FAQ sobre teleatendimento]
Quebras visuais: imagem após intro (terapeuta em consultório), callout box no checklist, tabela no FAQ
```

## Quality Criteria

- [ ] Título ≤70 caracteres com keyword frontal
- [ ] Meta description 150-160 caracteres, funciona como segundo headline independente
- [ ] Intro abre com dado, afirmação ou cenário (não com definição ou background genérico)
- [ ] 4-6 seções H2 com subheadings descritivos e scannáveis
- [ ] Total entre 1.500-2.500 palavras
- [ ] 3+ links internos com texto âncora contextual
- [ ] 2+ links externos a fontes confiáveis com texto âncora contextual
- [ ] Mínimo 1 quebra visual (lista, callout, blockquote) a cada 300 palavras
- [ ] Parágrafos com máximo 4 linhas
- [ ] Conclusão com CTA específico (verbo + objeto + benefício)
- [ ] Título e meta description escritos por último (após o corpo)

## Veto Conditions

Reject and redo if ANY are true:
1. Artigo abre com definição de dicionário ou frase genérica de contextualização ("No mundo de hoje...", "A saúde mental é...")
2. Total de palavras abaixo de 1.200 ou acima de 2.800
3. Nenhum link interno ou externo incluído no corpo do texto
