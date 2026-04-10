---
task: "Gerar Ângulos Emocionais"
order: 1
input: |
  - metaphor: A metáfora fornecida pelo usuário (texto livre)
  - context: Para quem é o conteúdo (Euthycare marca / terapeuta / ambos)
  - duration_preference: Curto (~1 min) / Longo (~5 min) / Ambos
output: |
  - angles: Lista de 5 ângulos emocionais com hook, driver, CTA e tom
  - file: squads/roteiro-metaforas/output/angles.md
---

# Gerar Ângulos Emocionais

Transforma uma metáfora bruta em 5 perspectivas emocionais distintas, cada uma com hook, driver emocional, CTA sugerido e tom de voz recomendado. O output alimenta o checkpoint de seleção de ângulo.

## Process

1. **Receber e analisar a metáfora** — identificar a âncora visual central (o objeto/fenômeno da metáfora) e a experiência emocional que ela representa
2. **Verificar segurança** — confirmar que a metáfora não patologiza, não reforça estigma e pode ser enquadrada positivamente; se necessário, propor ajuste sutil antes de expandir
3. **Gerar 5 ângulos distintos** — um por tipo emocional: Reflexivo, Educativo, Inspirador, Narrativo, Provocativo. Cada ângulo usa a mesma âncora visual mas entra por uma porta emocional diferente
4. **Redigir hook para cada ângulo** — máximo 15 palavras, testado mentalmente no "scroll-stop test"
5. **Definir CTA conectado à metáfora** — o convite à ação deve emergir naturalmente da imagem da metáfora, não ser colado artificialmente

## Output Format

```yaml
metaphor_received: "..."
anchor_visual: "..."  # a imagem central extraída

angles:
  - number: 1
    name: "Reflexivo"
    hook: "..."
    emotional_driver: "..."
    core_message: "..."
    suggested_cta: "..."
    recommended_tone: "Tom 1 — Reflexivo"
    best_formats: ["youtube-script", "instagram-feed"]

  - number: 2
    name: "Educativo"
    hook: "..."
    emotional_driver: "..."
    core_message: "..."
    suggested_cta: "..."
    recommended_tone: "Tom 2 — Educativo"
    best_formats: ["youtube-script", "instagram-reels"]

  - number: 3
    name: "Inspirador"
    hook: "..."
    emotional_driver: "..."
    core_message: "..."
    suggested_cta: "..."
    recommended_tone: "Tom 3 — Inspirador"
    best_formats: ["instagram-reels", "youtube-shorts"]

  - number: 4
    name: "Narrativo"
    hook: "..."
    emotional_driver: "..."
    core_message: "..."
    suggested_cta: "..."
    recommended_tone: "Tom 4 — Narrativo"
    best_formats: ["instagram-stories", "instagram-feed"]

  - number: 5
    name: "Provocativo"
    hook: "..."
    emotional_driver: "..."
    core_message: "..."
    suggested_cta: "..."
    recommended_tone: "Tom 6 — Provocativo"
    best_formats: ["instagram-reels", "youtube-shorts"]
```

## Output Example

> Metáfora: "A ansiedade é como um alarme que toca mesmo quando não há fogo"

```yaml
metaphor_received: "A ansiedade é como um alarme que toca mesmo quando não há fogo"
anchor_visual: "Alarme de incêndio disparando em ambiente seguro"

angles:
  - number: 1
    name: "Reflexivo"
    hook: "Seu alarme toca. E você não sabe por quê."
    emotional_driver: "Curiosidade contemplativa — por que meu corpo faz isso?"
    core_message: "A ansiedade não é irracional — é um sistema calibrado para um mundo que não existe mais"
    suggested_cta: "O que o seu alarme tem tentado te dizer?"
    recommended_tone: "Tom 1 — Reflexivo"
    best_formats: ["youtube-script", "instagram-feed"]

  - number: 2
    name: "Educativo"
    hook: "Por que seu cérebro dispara o alarme sem perigo real?"
    emotional_driver: "Alívio pelo entendimento — finalmente faz sentido"
    core_message: "O sistema nervoso não distingue leão de e-mail — mas dá para recalibrá-lo"
    suggested_cta: "Comenta: você reconhece esse alarme na sua vida?"
    recommended_tone: "Tom 2 — Educativo"
    best_formats: ["youtube-script", "instagram-reels"]

  - number: 3
    name: "Inspirador"
    hook: "Você não precisa destruir o alarme. Só precisa recalibrá-lo."
    emotional_driver: "Esperança e agência — posso fazer algo com isso"
    core_message: "A terapia não silencia a ansiedade à força — ensina o sistema a distinguir perigo real de percebido"
    suggested_cta: "Qual é o primeiro ajuste que você quer fazer no seu alarme?"
    recommended_tone: "Tom 3 — Inspirador"
    best_formats: ["instagram-reels", "youtube-shorts"]

  - number: 4
    name: "Narrativo"
    hook: "Era meia-noite. Tudo bem. E mesmo assim o alarme tocou."
    emotional_driver: "Identificação — isso acontece comigo também"
    core_message: "A história de quem vive com ansiedade — e como encontrar o botão de ajuste"
    suggested_cta: "Manda pra alguém que precisa ouvir que não está sozinho"
    recommended_tone: "Tom 4 — Narrativo"
    best_formats: ["instagram-stories", "instagram-feed"]

  - number: 5
    name: "Provocativo"
    hook: "E se a ansiedade não fosse o problema?"
    emotional_driver: "Dissonância cognitiva — isso muda tudo que eu pensava"
    core_message: "A ansiedade é a resposta mais inteligente que você encontrou para o que viveu — o problema é que o perigo passou"
    suggested_cta: "Concorda ou discorda? Comenta aqui."
    recommended_tone: "Tom 6 — Provocativo"
    best_formats: ["instagram-reels", "youtube-shorts"]
```

## Quality Criteria

- [ ] 5 ângulos gerados com drivers emocionais distintos (sem repetição)
- [ ] Cada hook tem máximo 15 palavras e passa o scroll-stop test
- [ ] Nenhum ângulo usa linguagem diagnóstica ou patologizante
- [ ] A âncora visual está presente e reconhecível em todos os 5 ângulos
- [ ] CTA de cada ângulo emerge da metáfora (não é genérico)
- [ ] Tom de voz recomendado especificado para cada ângulo

## Veto Conditions

Rejeitar e refazer se QUALQUER condição for verdadeira:
1. Dois ou mais ângulos compartilham o mesmo driver emocional principal
2. Qualquer ângulo usa linguagem que patologiza, culpa ou estigmatiza a experiência emocional
