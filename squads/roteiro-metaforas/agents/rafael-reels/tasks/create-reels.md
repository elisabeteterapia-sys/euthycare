---
task: "Criar Roteiro Instagram Reels"
order: 1
input: |
  - selected_angle: O ângulo emocional escolhido pelo usuário (de angles.md)
  - metaphor: A metáfora original
  - context: Para quem é (Euthycare / terapeuta / ambos)
  - tone: Tom de voz recomendado para o ângulo
output: |
  - script: Roteiro completo com timestamps
  - capcut_guide: Guia de edição CapCut passo a passo
  - caption: Legenda completa para o post
  - hashtags: 5-15 hashtags relevantes
  - file: squads/roteiro-metaforas/output/roteiro-reels.md
---

# Criar Roteiro Instagram Reels

Cria o roteiro completo para um Instagram Reel de 45-90 segundos baseado na metáfora e ângulo selecionado, incluindo guia de edição CapCut detalhado.

## Process

1. **Carregar o ângulo selecionado** — identificar hook, driver emocional, mensagem central e CTA do ângulo escolhido
2. **Adaptar ao formato Reel** — estruturar em Hook (0-3s) + Setup (3-10s) + Delivery (10-50s) + CTA (50-60/90s), respeitando o limite de ~130 palavras por minuto de fala
3. **Redigir o roteiro completo** — em linguagem falada, com timestamps marcados a cada seção e a cada corte sugerido
4. **Especificar elementos visuais** — para cada seção: o que aparece na tela (rosto, texto overlay, cena), sugestão de expressão/gesto
5. **Gerar o guia CapCut** — passo a passo numerado com timestamps, ações específicas no app, sugestão de música e configurações de exportação
6. **Redigir caption e hashtags** — 125 primeiros caracteres como hook autônomo, corpo expandido, CTA, hashtags segmentadas

## Output Format

```
=== REEL SCRIPT ===

HOOK (0-3s):
[Visual]: ...
[Audio]: ...
[Text Overlay]: ...

SETUP (3-10s):
[Visual]: ...
[Script]: ...

DELIVERY (10-Xs):
[Visual]: ...
[Script]: ...
[Text Overlays]: ...

CTA (Xs-final):
[Visual]: ...
[Script]: ...
[Text Overlay]: ...

Duração estimada: Xs
Palavras totais: N (ritmo: ~X palavras/min)

=== CAPTION ===
[Hook — 125 caracteres]

[Corpo]

[CTA]

=== HASHTAGS ===
#... (5-15 tags)

=== GUIA CAPCUT ===
Passo 1: ...
Passo 2: ...
...
Passo N: Exportar — 1080p, proporção 9:16
```

## Output Example

```
=== REEL SCRIPT ===
Metáfora: "A ansiedade é como um alarme" | Ângulo: Inspirador | Tom: Tom 3

HOOK (0-3s):
[Visual]: Tela preta. Texto branco bold aparece letra por letra.
[Audio]: Som de alarme cortado bruscamente → silêncio
[Text Overlay]: "Você não precisa destruir o alarme."

SETUP (3-10s):
[Visual]: Criador olhando direto para a câmera, fundo neutro (parede clara ou verde-escuro)
[Script]: "Ansiedade não é o inimigo que você precisa vencer. É um alarme que precisa de recalibração."

DELIVERY (10-50s):
[Visual]: Corte a cada 5-7 segundos. Criador varia levemente a posição — às vezes gesticula.
[Script]: "Pensa comigo. Seu sistema nervoso foi construído pra sobreviver. Ele detecta perigo e dispara o alarme. O problema? Não sabe diferenciar um leão de um e-mail difícil. [CORTE] Mas isso não significa que está quebrado. Significa que está muito bem calibrado pra um mundo que não existe mais. [CORTE] E dá pra ajustar. É isso que o trabalho terapêutico faz — não apaga o alarme, ensina o sistema a distinguir perigo real de percebido."
[Text Overlays]: "leão = e-mail difícil (pros seu cérebro)" aos 20s | "não quebrado — só sensível demais" aos 35s

CTA (50-60s):
[Visual]: Criador levemente inclinado à frente, tom mais próximo
[Script]: "Qual ajuste o seu alarme precisa agora?"
[Text Overlay]: "Comenta aqui 👇"

Duração estimada: 60s
Palavras totais: ~130 (ritmo: 130 palavras/min)

=== CAPTION ===
Você não precisa silenciar a ansiedade. Precisa recalibrá-la.

Seu sistema nervoso foi construído pra sobrevivência — não pra racionalizações. O alarme toca porque aprendeu que era necessário. A questão não é como desligar. É como ensinar que o perigo passou.

Qual ajuste o seu alarme mais precisa agora? Comenta aqui.

=== HASHTAGS ===
#ansiedade #saudemental #terapia #psicologia #euthycare #regulacaoemocional #autoconhecimento #saudeemocional #terapeutas #bem-estar

=== GUIA CAPCUT ===
Passo 1: Abra o CapCut → Novo Projeto → importe o vídeo gravado (vertical 9:16)
Passo 2: CORTE 1 — Selecione os primeiros 3s e separe do restante (essa parte é só texto na tela, sem rosto)
Passo 3: Clique em "Texto" → "Adicionar Texto" → escreva "Você não precisa destruir o alarme." → Fonte: Montserrat Bold → Cor: Branco → Fundo: Preto sólido → posição central
Passo 4: CORTE 2 — Traga o rosto do criador a partir dos 3s, setup até 10s
Passo 5: CORTE 3 — Delivery de 10s a 50s. A cada frase longa, faça um corte (atalho: tesoura no timeline). Mire em cortes a cada 5-7s.
Passo 6: Texto → "Auto Caption" → idioma: Português (BR) → Ativar para todo o vídeo → ajuste fonte se necessário
Passo 7: Texto manual aos 20s: "leão = e-mail difícil (pro seu cérebro)" → fonte menor, posição inferior
Passo 8: Texto manual aos 35s: "não quebrado — só sensível demais" → mesma fonte, posição inferior
Passo 9: Áudio → Sons → busque "lofi calm" ou "soft piano" → volume: 20% → aplique durante todo o vídeo
Passo 10: CORTE 4 — CTA: 50s-60s, rosto levemente mais próximo
Passo 11: Revise a timeline completa em preview
Passo 12: Exportar → 1080p → Proporção 9:16 → Salvar no rolo
```

## Quality Criteria

- [ ] Hook em 0-3s com texto overlay E fala
- [ ] Duração entre 45-90 segundos (ideal: 55-65s)
- [ ] Timestamps especificados em cada seção e em cada corte sugerido
- [ ] Legendas automáticas e textos overlay especificados com conteúdo exato
- [ ] Caption: primeiros 125 caracteres autônomos como hook
- [ ] 5-15 hashtags variando entre nicho e amplo
- [ ] CTA conectado à metáfora, não genérico
- [ ] Guia CapCut com no mínimo 10 passos numerados e acionáveis

## Veto Conditions

Rejeitar e refazer se QUALQUER condição for verdadeira:
1. Hook começa após 3 segundos ou é genérico ("olá pessoal, hoje vamos falar sobre...")
2. Guia CapCut não tem timestamps específicos ou usa instruções vagas como "edite bem"
