---
execution: subagent
agent: bruna-blog
format: blog-post
inputFile: squads/euthycare-content/output/angle-selection.md
outputFile: squads/euthycare-content/output/blog-post.md
model_tier: powerful
---

# Step 08: Criar Blog Post

## Context Loading

Load these files before executing:
- `squads/euthycare-content/output/angle-selection.md` — ângulo aprovado e tom selecionado
- `squads/euthycare-content/output/news-brief.md` — notícia base com dados, fonte e URL
- `squads/euthycare-content/pipeline/data/research-brief.md` — contexto de mercado e vocabulário do setor
- `squads/euthycare-content/pipeline/data/tone-of-voice.md` — guia de tom de voz
- `squads/euthycare-content/pipeline/data/anti-patterns.md` — erros a evitar
- `squads/euthycare-content/_memory/company.md` — perfil da Euthycare

## Instructions

### Process

1. Ler angle-selection.md — ângulo, hook, premissa e tom aprovados
2. Escolher o formato do artigo mais adequado ao ângulo (how-to, listicle, problema/solução, etc.)
3. Estruturar o outline com 4-6 seções H2 cobrindo o argumento completo
4. Redigir intro com hook nas primeiras 2-3 frases + promessa do artigo
5. Escrever corpo seção por seção — cada H2: ponto principal → evidência/exemplo → transição
6. Tecer 3+ links internos e 2+ externos contextualmente no texto
7. Escrever conclusão com resumo 1-2 frases + CTA específico
8. Redigir título (≤70 chars) e meta description (150-160 chars) por último

## Output Format

```
=== TÍTULO ===
[≤70 chars, keyword frontal]

=== META DESCRIPTION ===
[150-160 chars — segundo headline]

=== INTRO ===
[Hook 2-3 frases — dado/afirmação/cenário]
[Promessa — o que o leitor ganha]

=== BODY ===
## [H2 descritivo e scannable]
[200-300 palavras — ponto + evidência + transição]

### [H3 se necessário]
[100-150 palavras]

[Repetir para 4-6 seções H2]

=== CONCLUSÃO ===
[Resumo 1-2 frases]
[CTA específico — verbo + objeto + benefício]

=== POST NOTES ===
Contagem de palavras: [número]
Links internos: [3+ com âncora e URL]
Links externos: [2+ com fonte e URL]
Quebras visuais: [lista de onde inserir]
```

## Output Example

*(Ver output-examples.md — Exemplo 3: Blog Post)*

## Veto Conditions

Reject and redo if ANY of these are true:
1. Artigo abre com definição, contexto genérico ou frase como "No mundo de hoje..."
2. Total de palavras abaixo de 1.200 ou acima de 2.800
3. Nenhum link interno ou externo incluído no corpo do texto

## Quality Criteria

- [ ] Título ≤70 chars com keyword frontal
- [ ] Meta description 150-160 chars
- [ ] Intro abre com dado, afirmação ou cenário (não definição)
- [ ] 4-6 seções H2 com subheadings descritivos
- [ ] 1.500-2.500 palavras totais
- [ ] 3+ links internos e 2+ externos contextuais
- [ ] 1 quebra visual mínimo a cada 300 palavras
- [ ] CTA específico na conclusão
