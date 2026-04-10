---
execution: subagent
agent: rodrigo-radar
inputFile: squads/euthycare-content/output/research-focus.md
outputFile: squads/euthycare-content/output/news-brief.md
model_tier: fast
---

# Step 02: Buscar e Rankar Notícias

## Context Loading

Load these files before executing:
- `squads/euthycare-content/output/research-focus.md` — foco de pesquisa e período definidos pelo usuário no checkpoint anterior
- `squads/euthycare-content/pipeline/data/research-brief.md` — contexto de mercado e fontes de referência para o setor
- `squads/euthycare-content/_memory/memories.md` — aprendizados de ciclos anteriores (temas que performaram, fontes confiáveis identificadas)

## Instructions

### Process

1. Ler `research-focus.md` e extrair: tema específico + período de busca
2. Executar 3-5 buscas com WebSearch usando queries variadas cobrindo: regulação (CFP/CRP), tecnologia para terapeutas, mercado de saúde mental digital, gestão de consultório
3. Coletar 10-15 candidatos verificando URL e data de publicação em cada um
4. Avaliar cada candidato pelos critérios: relevância para terapeuta praticante, frescor, credibilidade da fonte, potencial de engajamento
5. Selecionar top 5 e atribuir nível de confiança (ALTA/MÉDIA/BAIXA) com justificativa
6. Estruturar o brief no formato padrão e salvar em output/news-brief.md

## Output Format

```
# News Brief — Euthycare Content Squad
Foco: {tema}
Período: {período}
Data de geração: {YYYY-MM-DD}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**1. {Título}**
Fonte: {publicação}
URL: {URL completa}
Data: {data de publicação}
Acesso: {data de acesso}
Confiança: {ALTA | MÉDIA | BAIXA}
Resumo: {1-2 linhas}
Ângulo potencial: {perspectiva para criação}

[Repetir para notícias 2-5]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Critério de ranking: relevância para prática clínica > frescor > potencial de engajamento
```

## Output Example

```
# News Brief — Euthycare Content Squad
Foco: Regulamentação teleatendimento psicologia
Período: Últimos 7 dias
Data de geração: 2026-04-09

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**1. CFP publica resolução 001/2026 sobre teleatendimento**
Fonte: Conselho Federal de Psicologia
URL: https://cfp.org.br/resolucoes/resolucao-001-2026
Data: 2026-04-05
Acesso: 2026-04-09
Confiança: ALTA
Resumo: Resolução atualiza critérios para teleatendimento — plataformas certificadas, backup de prontuários em nuvem, consentimento digital documentado. Prazo: 90 dias a partir de julho.
Ângulo potencial: Educacional (o que mudou e o que fazer) ou Urgência (prazo de adequação)

[Notícias 2-5 no mesmo formato]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Critério de ranking: relevância para prática clínica > frescor > potencial de engajamento
```

## Veto Conditions

Reject and redo if ANY of these are true:
1. Brief tem menos de 5 ou mais de 5 notícias
2. Qualquer notícia não tem URL verificável e acessível

## Quality Criteria

- [ ] Exatamente 5 notícias no brief com todos os campos preenchidos
- [ ] Todas as URLs verificadas e acessíveis
- [ ] Nível de confiança atribuído a cada notícia
- [ ] Notícias dentro do período solicitado
- [ ] Brief salvo em squads/euthycare-content/output/news-brief.md
