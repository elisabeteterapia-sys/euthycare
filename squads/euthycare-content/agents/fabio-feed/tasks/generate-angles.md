---
task: "Generate Angles"
order: 1
input: |
  - news_item: Notícia selecionada pelo usuário no checkpoint anterior (lida de output/news-brief.md)
output: |
  - angles: 5 ângulos criativos com driver emocional, hook de abertura e premissa do carrossel
---

# Generate Angles

Transforma a notícia selecionada em 5 ângulos emocionalmente distintos, cada um com um driver psicológico diferente, um hook de abertura e uma premissa clara para o carrossel.

## Process

1. **Ler a notícia selecionada do news-brief.md** — absorver o fato central, dados, fonte e contexto
2. **Identificar o nível de consciência do público:** terapeutas são geralmente solution aware ou product aware — o copy deve endereçar mecanismo diferenciador e prova
3. **Gerar 5 ângulos usando os 5 drivers emocionais padrão:**
   - Medo: o risco ou perda se o terapeuta não agir
   - Oportunidade: o ganho ou vantagem para quem age primeiro
   - Educacional: a informação que o profissional precisa entender
   - Contrário: a narrativa dominante sobre o tema que está errada
   - Inspiracional: o impacto maior da transformação digital na profissão
4. **Para cada ângulo:** escrever (a) nome do ângulo, (b) driver emocional, (c) hook de abertura (1 linha que paras o scroll), (d) premissa do carrossel em 1-2 frases
5. **Apresentar os 5 ângulos ao usuário** e aguardar seleção
6. **Salvar o ângulo selecionado em output/angles.md**

## Output Format

```
ÂNGULOS GERADOS — {Título da Notícia}

1. MEDO
Driver emocional: {risco específico identificado na notícia}
Hook: "{linha de abertura que para o scroll}"
Premissa: {o que o carrossel vai argumentar em 1-2 frases}

2. OPORTUNIDADE
Driver emocional: {ganho específico identificado na notícia}
Hook: "{linha de abertura}"
Premissa: {premissa do carrossel}

3. EDUCACIONAL
Driver emocional: {curiosidade ou lacuna de conhecimento}
Hook: "{linha de abertura}"
Premissa: {premissa do carrossel}

4. CONTRÁRIO
Driver emocional: {crença equivocada dominante no mercado}
Hook: "{linha de abertura}"
Premissa: {premissa do carrossel}

5. INSPIRACIONAL
Driver emocional: {pertencimento ou missão}
Hook: "{linha de abertura}"
Premissa: {premissa do carrossel}

---
Qual desses ângulos você quer desenvolver?
```

## Output Example

```
ÂNGULOS GERADOS — CFP publica resolução 001/2026 sobre teleatendimento

1. MEDO
Driver emocional: risco de sanção ética para quem não se adequar até outubro
Hook: "Terapeutas que atendem online sem plataforma certificada estão em risco de processo ético"
Premissa: A nova resolução CFP 001/2026 entra em vigor em julho com prazo de 90 dias para adequação. Quem não mudar a tempo pode enfrentar processo no CRP regional. Este carrossel explica o risco e o que fazer.

2. OPORTUNIDADE
Driver emocional: vantagem competitiva para quem se adequar antes da maioria
Hook: "Os terapeutas que se adequarem primeiro à nova resolução CFP vão sair na frente"
Premissa: A resolução cria um novo padrão mínimo de qualidade no atendimento online. Terapeutas que já cumprirem os critérios terão um diferencial real de credibilidade antes que seja obrigatório para todos.

3. EDUCACIONAL
Driver emocional: lacuna de conhecimento — o que a resolução realmente diz sem juridiquês
Hook: "Nova resolução do CFP sobre teleatendimento: o que muda na sua rotina (sem juridiquês)"
Premissa: A maioria dos resumos da resolução usa linguagem técnica que confunde mais do que esclarece. Este carrossel traduz os 5 pontos práticos que afetam o dia a dia do terapeuta que atende online.

4. CONTRÁRIO
Driver emocional: frustração com desinformação circulando sobre o tema
Hook: "Todo mundo está entendendo a nova resolução do CFP errado. Veja o que ela realmente diz."
Premissa: Nas últimas semanas, circulam interpretações equivocadas da resolução 001/2026 em grupos de psicólogos. Algumas afirmam que toda gravação de sessão fica proibida. Outras que qualquer plataforma de videochamada deixa de ser permitida. Nenhuma das duas é verdade.

5. INSPIRACIONAL
Driver emocional: orgulho profissional e pertencimento à vanguarda da psicologia digital
Hook: "O CFP atualizou as regras do jogo. Hora de a psicologia brasileira subir de nível."
Premissa: A resolução 001/2026 não é burocracia — é o reconhecimento oficial de que o atendimento psicológico online é uma modalidade legítima e sofisticada. Este carrossel celebra o avanço e convida terapeutas a liderar a transição.

---
Qual desses ângulos você quer desenvolver?
```

## Quality Criteria

- [ ] Exatamente 5 ângulos gerados (não 3, não 7)
- [ ] Cada ângulo usa um driver emocional diferente
- [ ] Cada ângulo tem hook de 1 linha que funciona de forma independente (passa o scroll-stop test)
- [ ] Hooks não se repetem em estrutura ou driver emocional
- [ ] Premissas são distintas — 5 ângulos sobre o MESMO fato, não 5 fatos diferentes
- [ ] Ângulos salvos em output/angles.md após seleção do usuário

## Veto Conditions

Reject and redo if ANY are true:
1. Dois ou mais ângulos usam o mesmo driver emocional (ex: dois de medo com enquadramento diferente)
2. Qualquer hook tem mais de 15 palavras (hooks longos não param o scroll)
3. Os 5 ângulos parecem ser sobre 5 notícias diferentes, não 5 perspectivas da mesma notícia
