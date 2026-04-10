---
task: "Review Content"
order: 1
input: |
  - instagram_feed: output/instagram-feed.md
  - instagram_reels: output/instagram-reels.md
  - blog_post: output/blog-post.md
  - email_newsletter: output/email-newsletter.md
  - quality_criteria: pipeline/data/quality-criteria.md
output: |
  - review: Veredictos estruturados para todos os outputs com scoring, feedback acionável e strengths
---

# Review Content

Avalia todos os outputs do ciclo de produção contra os critérios definidos em quality-criteria.md e emite veredictos APPROVE / CONDITIONAL APPROVE / REJECT com feedback acionável.

## Process

1. **Ler quality-criteria.md** completamente antes de avaliar qualquer output
2. **Ler o primeiro output completamente** (Instagram feed) sem fazer notas antes de terminar a leitura
3. **Avaliar cada critério individualmente** com nota 1-10 e justificativa específica
4. **Verificar hard rejection triggers** explicitamente (endereçamento de público, promessas verificáveis, conformidade CFP/LGPD)
5. **Calcular média e aplicar regras de decisão** (APPROVE ≥7 sem <4; CONDITIONAL APPROVE ≥7 com não-crítico 4-6; REJECT <7 ou crítico <4)
6. **Redigir review estruturado** para o primeiro output: veredicto no topo, tabela de scores, feedback com localização exata, strengths, sugestões não-bloqueantes
7. **Repetir para cada output** (reels, blog, email)
8. **Emitir sumário final** com status de aprovação de cada formato e próximos passos

## Output Format

```
==============================
 REVISÃO — CICLO #{número}
==============================

📸 INSTAGRAM FEED
VEREDICTO: {APPROVE | CONDITIONAL APPROVE | REJECT} — {média}/10
{Se REJECT: TRIGGER: {critério que causou rejeição automática}}

| Critério                    | Nota  | Resumo                                      |
|-----------------------------|-------|---------------------------------------------|
| {Critério 1}                | X/10  | {Justificativa em 1 linha}                  |
| {Critério 2}                | X/10  | {Justificativa}                             |
| ...                         | ...   | ...                                         |

Strength: {O que funcionou bem e por quê}

{Se REJECT ou CONDITIONAL}
Required change: {Trecho exato} — {Correção específica}
Required change: {Trecho exato} — {Correção específica}

Suggestion (non-blocking): {Melhoria opcional com localização}

---

🎬 INSTAGRAM REELS
VEREDICTO: {APPROVE | CONDITIONAL APPROVE | REJECT} — {média}/10
...

---

✍️ BLOG POST
VEREDICTO: {APPROVE | CONDITIONAL APPROVE | REJECT} — {média}/10
...

---

📧 EMAIL NEWSLETTER
VEREDICTO: {APPROVE | CONDITIONAL APPROVE | REJECT} — {média}/10
...

---

SUMÁRIO DO CICLO #{número}
Feed: {APPROVE | CONDITIONAL | REJECT}
Reels: {APPROVE | CONDITIONAL | REJECT}
Blog: {APPROVE | CONDITIONAL | REJECT}
Email: {APPROVE | CONDITIONAL | REJECT}

{Se algum REJECT: PATH TO APPROVAL com lista numerada de mudanças obrigatórias}
{Se todos APPROVE/CONDITIONAL: "Pronto para aprovação final do usuário"}

Revisão {N} de 3. {Se revisão 3: "Limite atingido — escalando para aprovação manual"}
```

## Output Example

```
==============================
 REVISÃO — CICLO #1
==============================

📸 INSTAGRAM FEED
VEREDICTO: APPROVE — 8.1/10

| Critério                    | Nota  | Resumo                                                                |
|-----------------------------|-------|-----------------------------------------------------------------------|
| Hook do cover               | 9/10  | Título ≤20 palavras, cria tensão sem entregar resposta prematura       |
| Profundidade por slide      | 8/10  | 50-70 palavras por slide, hierarquia headline/apoio clara             |
| Alternância de fundos       | 8/10  | Light/dark/accent bem alternados, visual rhythm presente              |
| Legenda 125 chars           | 8/10  | Hook funciona standalone, pergunta de fechamento relevante            |
| Alinhamento de marca        | 8/10  | Tom profissional e direto mantido em todos os slides                  |
| CTA específico              | 8/10  | "Comenta RESOLUÇÃO" é rastreável e tem valor percebido claro          |

Strength: O slide 4 usa o dado "90 dias" de forma cirúrgica — específico, concreto e com impacto imediato. É o tipo de detalhe que converte um slide educativo em um slide que o terapeuta salva.

Suggestion (non-blocking): O slide 7 (síntese) tem lista numerada mas sem texto de apoio — adicionar 1-2 linhas contextualizando "por que essa ordem" tornaria a síntese mais memorável.

---

📧 EMAIL NEWSLETTER
VEREDICTO: REJECT — 5.5/10

TRIGGER: Subject line com 54 caracteres (acima do limite de 50)

| Critério                    | Nota  | Resumo                                                                |
|-----------------------------|-------|-----------------------------------------------------------------------|
| Subject line chars          | 3/10  | 54 chars — truncado no mobile antes da palavra "clientes"             |
| Preview text                | 7/10  | Estende o subject corretamente, não repete                            |
| Featured content            | 7/10  | 148 palavras, entrega o valor central, está acima da dobra            |
| Total de palavras           | 8/10  | 380 palavras — dentro do range ideal                                  |
| CTA                         | 8/10  | "Experimente grátis por 14 dias" — verbo+objeto+benefício            |
| Footer                      | 9/10  | Unsubscribe presente, endereço incluído                               |

Strength: O featured content usa o dado "40%" de forma efetiva e o enquadramento "presença digital não é ser influencer" neutraliza a principal objeção do público logo no topo.

Required change: Subject line atual ("Terapeutas online ganham 40% mais clientes novos") tem 54 chars. Encurtar para ≤50 chars.
Sugestão: "Terapeutas online ganham 40% mais clientes" (44 chars) — mantém o dado e a promessa, elimina "novos" redundante.

PATH TO APPROVAL:
1. Encurtar subject line para ≤50 caracteres preservando o dado "40%"
2. Resubmeter como Ciclo #2

---

SUMÁRIO DO CICLO #1
Feed: APPROVE
Reels: APPROVE
Blog: CONDITIONAL APPROVE (Required change: meta description com 161 chars — encurtar 1 char)
Email: REJECT (subject line)

Path to full approval:
1. Email: encurtar subject line para ≤50 chars
2. Blog: encurtar meta description de 161 para ≤160 chars

Revisão 1 de 3.
```

## Quality Criteria

- [ ] Todos os 4 outputs avaliados (feed, reels, blog, email)
- [ ] Cada critério de quality-criteria.md avaliado com nota + justificativa de 1 linha
- [ ] Veredicto emitido no topo de cada output (APPROVE/CONDITIONAL/REJECT)
- [ ] Hard rejection triggers verificados explicitamente para cada output
- [ ] Pelo menos 1 Strength por output (com especificidade — não "bom trabalho")
- [ ] Cada "Required change" tem localização exata + correção sugerida
- [ ] Número da revisão registrado ("Revisão N de 3")
- [ ] Sumário final com status de cada formato e próximos passos

## Veto Conditions

Reject and redo if ANY are true:
1. Qualquer output avaliado sem justificativa em ao menos um critério com nota abaixo de 8
2. Review emitido sem pelo menos 1 Strength por output
3. REJECT emitido sem Required changes específicas e acionáveis
