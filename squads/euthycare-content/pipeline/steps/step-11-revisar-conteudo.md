---
execution: inline
agent: carolina-critica
on_reject: 6
---

# Step 11: Revisar Conteúdo

## Context Loading

Load these files before executing:
- `squads/euthycare-content/output/instagram-feed.md` — carrossel gerado pelo Fábio Feed
- `squads/euthycare-content/output/instagram-reels.md` — script de Reel gerado pela Vilma Viral
- `squads/euthycare-content/output/blog-post.md` — artigo gerado pela Bruna Blog
- `squads/euthycare-content/output/email-newsletter.md` — newsletter gerada pelo Eduardo Email
- `squads/euthycare-content/pipeline/data/quality-criteria.md` — critérios e regras de decisão
- `squads/euthycare-content/pipeline/data/anti-patterns.md` — erros a evitar
- `squads/euthycare-content/_memory/memories.md` — padrões de qualidade aprendidos

## Instructions

### Process

1. Ler quality-criteria.md completamente antes de avaliar qualquer output
2. Ler cada output na íntegra uma vez antes de pontuar
3. Para cada output (feed, reels, blog, email): avaliar todos os critérios com nota 1-10 + justificativa de 1 linha
4. Verificar hard rejection triggers explicitamente: (a) endereça terapeuta não paciente, (b) promessas verificáveis, (c) nenhuma violação de conformidade CFP/LGPD
5. Calcular média e emitir veredicto (APPROVE ≥7 sem <4; CONDITIONAL ≥7 com não-crítico 4-6; REJECT <7 ou crítico <4)
6. Para REJECT/CONDITIONAL: listar Required changes com localização exata + correção sugerida
7. Para cada output: identificar e nomear pelo menos 1 Strength
8. Emitir sumário final com status de cada formato e próximos passos
9. Registrar número da revisão ("Revisão N de 3") — se revisão 3, escalar ao usuário

## Output Format

```
==============================
 REVISÃO — CICLO #{N}
==============================

📸 INSTAGRAM FEED
VEREDICTO: {APPROVE | CONDITIONAL APPROVE | REJECT} — {média}/10
{TRIGGER se REJECT automático}

| Critério | Nota | Resumo |
|----------|------|--------|
| {critério} | X/10 | {justificativa} |

Strength: {o que funcionou bem com especificidade}

{Required change e/ou Suggestions se aplicável}

---
🎬 INSTAGRAM REELS
[mesmo formato]

---
✍️ BLOG POST
[mesmo formato]

---
📧 EMAIL NEWSLETTER
[mesmo formato]

---
SUMÁRIO DO CICLO #{N}
Feed: {status}
Reels: {status}
Blog: {status}
Email: {status}

{PATH TO APPROVAL se algum REJECT}
{Ou "Pronto para aprovação final" se todos APPROVE/CONDITIONAL}

Revisão {N} de 3.
```

## Output Example

*(Ver tasks/review.md — Output Example completo)*

## Veto Conditions

Reject and redo if ANY of these are true:
1. Algum output avaliado sem justificativa em critério com nota abaixo de 8
2. Review sem pelo menos 1 Strength por output

## Quality Criteria

- [ ] Todos os 4 outputs avaliados
- [ ] Critérios globais e de plataforma avaliados com nota + justificativa
- [ ] Hard rejection triggers verificados explicitamente
- [ ] Pelo menos 1 Strength por output
- [ ] Required changes com localização + correção se REJECT/CONDITIONAL
- [ ] Sumário final com próximos passos
- [ ] Número de revisão registrado
