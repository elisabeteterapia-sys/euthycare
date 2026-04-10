---
execution: subagent
agent: eduardo-email
format: email-newsletter
inputFile: squads/euthycare-content/output/angle-selection.md
outputFile: squads/euthycare-content/output/email-newsletter.md
model_tier: powerful
---

# Step 09: Criar Email Newsletter

## Context Loading

Load these files before executing:
- `squads/euthycare-content/output/angle-selection.md` — ângulo aprovado e tom selecionado
- `squads/euthycare-content/output/news-brief.md` — notícia base com dados verificados
- `squads/euthycare-content/pipeline/data/tone-of-voice.md` — guia de tom de voz
- `squads/euthycare-content/pipeline/data/anti-patterns.md` — erros a evitar (especialmente subject line)
- `squads/euthycare-content/_memory/company.md` — perfil da Euthycare

## Instructions

### Process

1. Ler angle-selection.md — ângulo aprovado e tom selecionado
2. Redigir o CORPO completo primeiro: featured content (100-150 palavras) + 2-3 seções secundárias (50-100 palavras cada) + CTA único
3. Verificar contagem total de palavras: deve estar entre 200-500
4. Definir CTA: texto com verbo + objeto (não "clique aqui")
5. Escrever subject line (30-50 chars) DEPOIS do corpo — prometer o que o email entrega
6. Escrever preview text (60-90 chars): estende o subject, nunca repete
7. Completar header e footer

## Output Format

```
=== SUBJECT LINE ===
[30-50 chars — verificar contagem]

=== PREVIEW TEXT ===
[60-90 chars — estende, não repete]

=== HEADER ===
[Marca | Edição #N | Mês Ano]

=== FEATURED CONTENT ===
[100-150 palavras — valor central acima da dobra]

=== BODY ===
### [Subheading 1]
[50-100 palavras]

### [Subheading 2]
[50-100 palavras]

### [Subheading 3, opcional]
[50-100 palavras]

=== CTA ===
[Texto do botão — verbo + objeto]
[URL]

=== FOOTER ===
[Marca] | [site]
Cancelar inscrição | Preferências | [Endereço]
```

## Output Example

*(Ver output-examples.md — Exemplo 2: Email Newsletter)*

## Veto Conditions

Reject and redo if ANY of these are true:
1. Subject line acima de 50 caracteres (contar caracteres manualmente)
2. Preview text repete literalmente o subject line

## Quality Criteria

- [ ] Subject line 30-50 chars (verificado)
- [ ] Preview text 60-90 chars, não repete subject
- [ ] Featured content ≤150 palavras, acima da dobra
- [ ] Total 200-500 palavras
- [ ] 1 CTA principal com verbo+objeto
- [ ] Footer com unsubscribe
- [ ] Corpo escrito antes do subject line
