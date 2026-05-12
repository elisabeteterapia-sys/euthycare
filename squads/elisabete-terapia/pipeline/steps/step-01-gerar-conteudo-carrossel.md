# Step 1 — Gerar Conteúdo do Carrossel

## Agente
Sofia Criadora

## Instrução

1. Lê `_memory/memories.md` para ver o último tema usado
2. Lê `pipeline/data/carousel-topics.md` para escolher o próximo tema
3. Lê `pipeline/data/brand-voice.md` para garantir o tom correcto
4. Cria conteúdo para **máximo 5 slides** no formato abaixo
5. Salva em `squads/elisabete-terapia/output/carousel-draft.json`

## Formato de output (JSON)

```json
{
  "topic": "nome do tema usado",
  "caption": "legenda do post (máx 2200 chars) — inclui CTA suave no final",
  "hashtags": "#tag1 #tag2 ... (8-12 hashtags)",
  "slides": [
    {
      "number": 1,
      "type": "capa",
      "title": "título chamativo (máx 8 palavras)",
      "subtitle": "frase de apoio opcional (máx 12 palavras)"
    },
    {
      "number": 2,
      "type": "conteudo",
      "title": "título breve do slide (máx 6 palavras)",
      "body": "texto do slide (máx 80 palavras)"
    },
    {
      "number": 3,
      "type": "conteudo",
      "title": "...",
      "body": "..."
    },
    {
      "number": 4,
      "type": "conteudo",
      "title": "...",
      "body": "..."
    },
    {
      "number": 5,
      "type": "cta",
      "title": "Queres falar?",
      "body": "Marca uma sessão de descoberta gratuita. Link na bio."
    }
  ]
}
```

## Regras
- Slide 1 (capa): título que para o scroll — pergunta ou afirmação forte
- Slides 2-4: uma ideia por slide, linguagem simples e validadora
- Slide 5 (CTA): sempre presente, suave, sem pressão
- Mínimo 3 slides, máximo 5
- Nunca repetir tema consecutivo (ver `_memory/memories.md`)
