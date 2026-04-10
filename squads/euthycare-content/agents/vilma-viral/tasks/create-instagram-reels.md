---
task: "Create Instagram Reels"
order: 1
input: |
  - angle: Ângulo selecionado (lido de output/angle-selection.md)
  - tone: Tom de voz confirmado (de tone-of-voice.md)
  - format_rules: Regras da plataforma Instagram Reels (injetadas pelo Pipeline Runner)
output: |
  - reel_script: Script completo do Reel com hook, setup, delivery, CTA, legenda e direção de áudio
---

# Create Instagram Reels

Produz script completo de Reel (15-30 segundos) a partir do ângulo aprovado. Inclui breakdown shot-by-shot, text overlays, script falado, CTA, legenda e direção de áudio.

## Process

1. **Ler angle-selection.md** — identificar o ângulo, hook e premissa aprovados
2. **Adaptar o ângulo para o formato vertical Reel** — o que funciona em carrossel não é idêntico ao que funciona em vídeo: priorizar movimento, cortes e texto na tela
3. **Redigir HOOK (0-2s):** text overlay que cria tensão ou promete revelação. Máximo 10 palavras. Sem logo, sem apresentação.
4. **Escrever SETUP (2-5s):** contexto mínimo — 1-2 frases que justificam por que o espectador deve continuar
5. **Criar DELIVERY (5-25s):** conteúdo principal em 3-5 beats com corte ou mudança visual a cada beat. Script falado + text overlay para cada beat.
6. **Formatar CTA (últimos 3-5s):** ação específica e rastreável. Projetar o visual para loop.
7. **Escrever legenda** (hook 125 chars + expansão + CTA)
8. **Especificar direção de áudio** com justificativa

## Output Format

```
=== REEL SCRIPT ===

HOOK (0-2s):
[Visual]: [o que aparece na tela — cena, texto, ação]
[Audio]: [música, som ambiente, silêncio]
[Text Overlay]: [texto exato na tela — máx 10 palavras]

SETUP (2-5s):
[Visual]: [cena de contexto]
[Script]: [1-2 frases faladas]
[Text Overlay]: [texto de apoio se necessário]

DELIVERY (5-25s):
Beat 1 (5-10s):
[Visual]: [descrição do shot]
[Script]: [fala]
[Text Overlay]: [texto na tela]

Beat 2 (10-15s):
[Visual]: [corte ou mudança de ângulo]
[Script]: [fala]
[Text Overlay]: [texto na tela]

Beat 3 (15-20s):
[Visual]: [shot]
[Script]: [fala]
[Text Overlay]: [texto na tela]

[Beat 4 e 5 se necessário para completar 15-30s]

CTA (últimos 3-5s):
[Visual]: [frame final que conecta ao início para loop]
[Script]: [fala do CTA]
[Text Overlay]: [CTA em texto — ação específica]

=== CAPTION ===
[Hook — máx 125 chars, funciona standalone]

[Expansão em 2-3 linhas curtas]

[CTA ou pergunta final]

=== HASHTAGS ===
#hashtag1 [5-15 hashtags relevantes]

=== AUDIO NOTE ===
[Tipo de áudio recomendado e justificativa]
```

## Output Example

```
=== REEL SCRIPT ===

HOOK (0-2s):
[Visual]: texto grande centralizado, fundo preto, fonte bold branca
[Audio]: som de notificação de smartphone seguido de silêncio
[Text Overlay]: "Terapeutas: você está perdendo clientes sem perceber"

SETUP (2-5s):
[Visual]: split screen — agenda vazia vs. agenda preenchida
[Script]: "Em 2026, 67% dos novos pacientes pesquisam o terapeuta online antes do primeiro contato."
[Text Overlay]: "67% pesquisam online"

DELIVERY (5-25s):

Beat 1 (5-10s):
[Visual]: smartphone mostrando busca no Google por "terapeuta online"
[Script]: "Se você não aparece nessa busca, você não existe para eles."
[Text Overlay]: "Não existe para eles"

Beat 2 (10-15s):
[Visual]: corte rápido para tela de agendamento vazia
[Script]: "Não é sobre ser influencer. É sobre estar disponível quando a pessoa precisa."
[Text Overlay]: "Disponível quando precisam"

Beat 3 (15-20s):
[Visual]: tela de plataforma com agenda preenchida, notificações
[Script]: "Plataforma com agenda online. Perfil atualizado. Forma de contato sem fricção."
[Text Overlay]: "Agenda online + perfil + contato direto"

Beat 4 (20-25s):
[Visual]: terapeuta confiante, ambiente profissional
[Script]: "Isso não é luxo. É o básico de 2026."
[Text Overlay]: "É o básico de 2026"

CTA (25-30s):
[Visual]: volta para o texto de abertura (loop), depois aparece CTA
[Script]: "Comenta DIGITAL que eu te mando o checklist de presença online para terapeutas — de graça."
[Text Overlay]: "Comenta DIGITAL 👇"

=== CAPTION ===
Terapeutas: você está perdendo clientes sem perceber — e o motivo é mais simples do que parece.

67% dos novos pacientes pesquisam o terapeuta online antes do primeiro contato. Se você não aparece, não existe pra eles.

Comenta DIGITAL que eu te mando o checklist de presença online.

=== HASHTAGS ===
#terapeutas #psicologia #presencadigital #teleatendimento #saúdementaldigital #consultorioonline #psicologos #saúdemental

=== AUDIO NOTE ===
Beat de fundo suave tipo lo-fi ambient, sem letra, volume baixo para não competir com os text overlays. Evitar músicas com letra — 85% assiste sem som, e a letra ocupa atenção visual sem acrescentar.
```

## Quality Criteria

- [ ] Hook entregue em ≤2 segundos com text overlay explícito (máx 10 palavras)
- [ ] Duração total entre 15-30 segundos (timestamps somados)
- [ ] Cada beat do delivery tem text overlay para visualização sem som
- [ ] Cortes ou mudanças visuais especificados a cada 3-5 segundos
- [ ] Último frame projetado para loop (conexão visual ou narrativa com o início)
- [ ] CTA específico e rastreável (não "siga o perfil")
- [ ] Legenda tem hook nos 125 primeiros caracteres
- [ ] Direção de áudio especificada com justificativa
- [ ] Aspecto 9:16 vertical indicado

## Veto Conditions

Reject and redo if ANY are true:
1. O Reel começa com logo, apresentação ("olá", "hey guys") ou qualquer não-hook nos primeiros 2 segundos
2. Nenhum beat do delivery tem text overlay — Reel só funciona com som
3. Duração total acima de 35 segundos (inclui margem de 5s)
