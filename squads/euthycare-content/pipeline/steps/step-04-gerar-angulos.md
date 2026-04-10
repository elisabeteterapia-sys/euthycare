---
execution: inline
agent: fabio-feed
inputFile: squads/euthycare-content/output/news-brief.md
outputFile: squads/euthycare-content/output/angles.md
---

# Step 04: Gerar Ângulos Criativos

## Context Loading

Load these files before executing:
- `squads/euthycare-content/output/news-brief.md` — brief com a notícia selecionada
- `squads/euthycare-content/pipeline/data/tone-of-voice.md` — os 6 tons disponíveis
- `squads/euthycare-content/pipeline/data/domain-framework.md` — os 5 ângulos padrão e como aplicá-los
- `squads/euthycare-content/pipeline/data/research-brief.md` — contexto de mercado e nível de consciência do público

## Instructions

### Process

1. Ler a notícia selecionada do news-brief.md
2. Identificar o fato central, dados-chave e implicações para terapeutas
3. Gerar 5 ângulos com os drivers emocionais: Medo, Oportunidade, Educacional, Contrário, Inspiracional
4. Para cada ângulo: nome + driver emocional + hook (1 linha, máx 15 palavras) + premissa (1-2 frases)
5. Apresentar os 5 ângulos ao usuário e aguardar seleção
6. Após seleção, salvar em output/angles.md

**Antes de apresentar os ângulos:** verificar tone-of-voice.md e recomendar o tom mais adequado ao tema/ângulo selecionado.

## Output Format

```
ÂNGULOS GERADOS — {Título da Notícia}

1. MEDO
Driver emocional: {risco específico}
Hook: "{hook de 1 linha}"
Premissa: {o que o carrossel vai argumentar}

2. OPORTUNIDADE
Driver emocional: {ganho específico}
Hook: "{hook de 1 linha}"
Premissa: {premissa}

3. EDUCACIONAL
Driver emocional: {curiosidade ou lacuna de conhecimento}
Hook: "{hook de 1 linha}"
Premissa: {premissa}

4. CONTRÁRIO
Driver emocional: {crença equivocada dominante}
Hook: "{hook de 1 linha}"
Premissa: {premissa}

5. INSPIRACIONAL
Driver emocional: {pertencimento ou missão}
Hook: "{hook de 1 linha}"
Premissa: {premissa}

---
Tom recomendado para esse tema: {nome do tom} — {justificativa em 1 linha}

Qual desses ângulos você quer desenvolver?
```

## Output Example

```
ÂNGULOS GERADOS — CFP publica resolução 001/2026 sobre teleatendimento

1. MEDO
Driver emocional: risco de sanção ética para quem não se adequar até outubro
Hook: "Terapeutas que atendem online sem plataforma certificada arriscam processo ético"
Premissa: A resolução entra em vigor em julho com prazo de 90 dias. Quem não mudar a tempo pode ser denunciado ao CRP regional. O carrossel explica o risco real e o que fazer para evitá-lo.

2. OPORTUNIDADE
Driver emocional: vantagem competitiva para quem se adequar antes da maioria
Hook: "Os terapeutas que se adequarem primeiro à nova resolução CFP saem na frente"
Premissa: A resolução cria um padrão mínimo de qualidade. Terapeutas que já cumprirem os critérios terão diferencial real de credibilidade antes que todos sejam obrigados a seguir.

3. EDUCACIONAL
Driver emocional: lacuna de conhecimento — o que a resolução realmente diz sem juridiquês
Hook: "Nova resolução CFP sobre teleatendimento: o que muda na sua rotina"
Premissa: A maioria dos resumos usa linguagem técnica confusa. Este carrossel traduz os 5 pontos práticos que afetam o dia a dia de quem atende online.

4. CONTRÁRIO
Driver emocional: frustração com desinformação circulando sobre o tema
Hook: "Todo mundo está entendendo a nova resolução CFP errado"
Premissa: Circulam interpretações equivocadas nos grupos de psicólogos. Algumas afirmam que toda gravação fica proibida. Outras que qualquer videochamada deixa de ser permitida. Nenhuma é verdade — veja o que o texto realmente diz.

5. INSPIRACIONAL
Driver emocional: orgulho profissional e pertencimento à vanguarda da psicologia digital
Hook: "O CFP atualizou as regras. Hora da psicologia brasileira subir de nível."
Premissa: A resolução não é burocracia — é o reconhecimento de que o atendimento online é modalidade legítima e sofisticada. O carrossel celebra o avanço e convida terapeutas a liderar a transição.

---
Tom recomendado para esse tema: Profissional e Direto — o tema é regulatório com prazo real, exige assertividade sem alarmismo.

Qual desses ângulos você quer desenvolver?
```

## Veto Conditions

Reject and redo if ANY of these are true:
1. Dois ou mais ângulos têm o mesmo driver emocional
2. Qualquer hook tem mais de 15 palavras

## Quality Criteria

- [ ] Exatamente 5 ângulos com os 5 drivers emocionais padrão
- [ ] Cada hook ≤15 palavras e funciona de forma independente
- [ ] Premissas são perspectivas diferentes da mesma notícia (não notícias diferentes)
- [ ] Tom recomendado com justificativa apresentado ao usuário
- [ ] Ângulo selecionado salvo em output/angles.md
