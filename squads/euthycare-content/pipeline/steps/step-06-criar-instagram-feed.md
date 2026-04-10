---
execution: subagent
agent: fabio-feed
format: instagram-feed
inputFile: squads/euthycare-content/output/angle-selection.md
outputFile: squads/euthycare-content/output/instagram-feed.md
model_tier: powerful
---

# Step 06: Criar Instagram Feed (Carrossel)

## Context Loading

Load these files before executing:
- `squads/euthycare-content/output/angle-selection.md` — ângulo aprovado, hook, premissa e tom selecionado
- `squads/euthycare-content/output/news-brief.md` — notícia base com dados, fonte e URL
- `squads/euthycare-content/pipeline/data/tone-of-voice.md` — guia de tom de voz
- `squads/euthycare-content/pipeline/data/anti-patterns.md` — erros a evitar
- `squads/euthycare-content/_memory/company.md` — perfil da Euthycare
- `squads/euthycare-content/_memory/memories.md` — aprendizados de ciclos anteriores

## Instructions

### Process

1. Ler angle-selection.md — absorver ângulo, hook, premissa e tom
2. Escolher o formato de carrossel mais adequado ao ângulo (Listicle, Editorial, Problema→Solução, Mito vs Realidade, etc.)
3. Criar cover slide: título ≤20 palavras provocativo sem antecipar a resposta
4. Redigir 6-8 slides de conteúdo: headline bold + texto de apoio 40-80 palavras totais por slide, fundo alternando light/dark/accent
5. Criar CTA slide com fonte verificável e ação rastreável
6. Escrever legenda: hook nos 125 primeiros chars, corpo, pergunta de fechamento
7. Selecionar 5-15 hashtags com mix niche/mid/broad

## Output Format

```
=== FORMATO ===
[Nome do formato]

=== SLIDES ===
Slide 1 (Cover):
  Title: [≤20 palavras]
  Photo: [descrição]
  Background: [foto/sólido]

Slide 2 ([papel]):
  Headline: [headline bold]
  Photo: [se aplicável]
  Supporting text: [40-80 palavras totais]
  Accent keywords: [palavras destacadas]
  Background: [light/dark/accent]

[Slides 3 a N]

Slide N (CTA):
  Photo: [imagem de fechamento]
  Source: [fonte da notícia]
  CTA: [ação específica e rastreável]

=== CAPTION ===
[Hook 125 chars standalone]

[Corpo com quebras de linha]

[Pergunta aberta ou CTA]

=== HASHTAGS ===
#tag1 #tag2 [5-15 tags]
```

## Output Example

*(Ver output-examples.md — Exemplo 1: Instagram Feed)*

## Veto Conditions

Reject and redo if ANY of these are true:
1. Qualquer slide tem menos de 40 palavras totais (headline + texto de apoio)
2. Legenda abre com clichê ("Em um mundo digital...", "Você sabia que...", "Hoje vamos falar...")
3. CTA do último slide é genérico ("curta e compartilhe", "siga para mais conteúdo")

## Quality Criteria

- [ ] Formato de carrossel nomeado e compatível com o ângulo
- [ ] Cover com título ≤20 palavras
- [ ] Cada slide: 40-80 palavras totais
- [ ] Fundos alternando light/dark/accent
- [ ] Legenda: hook nos 125 primeiros chars
- [ ] 5-15 hashtags sem links na legenda
- [ ] CTA final específico e rastreável
