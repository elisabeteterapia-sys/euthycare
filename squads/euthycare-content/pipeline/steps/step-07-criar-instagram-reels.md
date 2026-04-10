---
execution: subagent
agent: vilma-viral
format: instagram-reels
inputFile: squads/euthycare-content/output/angle-selection.md
outputFile: squads/euthycare-content/output/instagram-reels.md
model_tier: powerful
---

# Step 07: Criar Instagram Reels

## Context Loading

Load these files before executing:
- `squads/euthycare-content/output/angle-selection.md` — ângulo aprovado, hook e tom selecionado
- `squads/euthycare-content/output/news-brief.md` — dados e contexto da notícia base
- `squads/euthycare-content/pipeline/data/tone-of-voice.md` — guia de tom de voz
- `squads/euthycare-content/pipeline/data/anti-patterns.md` — erros a evitar
- `squads/euthycare-content/_memory/company.md` — perfil da Euthycare

## Instructions

### Process

1. Ler angle-selection.md — absorver o ângulo aprovado e adaptar para o formato vídeo 9:16 de 15-30s
2. Escrever HOOK (0-2s): text overlay que cria tensão ou promessa, máx 10 palavras, sem logo/apresentação
3. Escrever SETUP (2-5s): contexto mínimo em 1-2 frases
4. Criar DELIVERY (5-25s) em 3-5 beats com corte/mudança visual a cada beat, script + text overlay por beat
5. Formatar CTA (últimos 3-5s): ação específica; projetar o frame final para loop
6. Escrever legenda e especificar direção de áudio com justificativa

## Output Format

```
=== REEL SCRIPT ===

HOOK (0-2s):
[Visual]: [cena/texto na tela]
[Audio]: [áudio/silêncio]
[Text Overlay]: [texto exato — máx 10 palavras]

SETUP (2-5s):
[Visual]: [contexto]
[Script]: [1-2 frases]
[Text Overlay]: [se necessário]

DELIVERY (5-25s):
Beat 1 (5-Xs):
[Visual]: [shot]
[Script]: [fala]
[Text Overlay]: [ponto-chave na tela]

[Beat 2, 3, 4, 5 conforme necessário]

CTA (últimos 3-5s):
[Visual]: [frame final para loop]
[Script]: [CTA falado]
[Text Overlay]: [CTA em texto]

=== CAPTION ===
[Hook ≤125 chars]
[Expansão 2-3 linhas]
[CTA ou pergunta]

=== HASHTAGS ===
#tag1 [5-15 tags]

=== AUDIO NOTE ===
[Tipo de áudio e justificativa]
```

## Output Example

*(Ver output-examples.md — seção Instagram Reels)*

## Veto Conditions

Reject and redo if ANY of these are true:
1. Reel começa com logo, apresentação ou qualquer não-hook nos primeiros 2 segundos
2. Nenhum beat do delivery tem text overlay — Reel funciona sem som

## Quality Criteria

- [ ] Hook em ≤2s com text overlay ≤10 palavras
- [ ] Duração total 15-30s
- [ ] Text overlays em cada beat do delivery
- [ ] Cortes/mudanças a cada 3-5s
- [ ] Frame final projetado para loop
- [ ] CTA específico nos últimos 3-5s
- [ ] Direção de áudio com justificativa
