---
task: "Find and Rank News"
order: 1
input: |
  - research_focus: Tema e período definidos pelo usuário no checkpoint anterior (lido de output/research-focus.md)
output: |
  - news_brief: Brief estruturado com top 5 notícias rankadas, cada uma com título, fonte, URL, data, resumo e ângulo potencial
---

# Find and Rank News

Pesquisa notícias e tendências relevantes para terapeutas profissionais no tema e período solicitados, avalia e rankeia as 5 mais relevantes para produção de conteúdo da Euthycare.

## Process

1. **Ler o research-focus.md:** identificar tema específico e período de busca antes de qualquer pesquisa
2. **Mapear categorias de fontes:** CFP/CRP (regulação), HealthTech news (tecnologia), publicações clínicas (setor), imprensa especializada (mercado)
3. **Executar 3-5 buscas com queries variadas:** ex. "nova resolução CFP 2026", "teleatendimento psicologia regulação", "plataforma terapeutas digital 2026"
4. **Coletar 10-15 candidatos:** verificar URL, data de publicação e acessibilidade
5. **Avaliar cada candidato por:** (a) relevância para terapeutas, (b) impacto na prática clínica, (c) frescor da notícia, (d) credibilidade da fonte
6. **Selecionar top 5 e atribuir nível de confiança:** ALTA (2+ fontes independentes), MÉDIA (fonte única confiável), BAIXA (não verificável)
7. **Estruturar brief no formato padrão** e salvar em output/news-brief.md

## Output Format

```markdown
# News Brief — Euthycare Content Squad
Foco: {tema da pesquisa}
Período: {período solicitado}
Data de geração: {YYYY-MM-DD}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**1. {Título da notícia}**
Fonte: {Nome da publicação}
URL: {URL completa}
Data: {data de publicação}
Acesso: {data de acesso}
Confiança: {ALTA | MÉDIA | BAIXA}
Resumo: {1-2 linhas descrevendo o que a notícia traz}
Ângulo potencial: {perspectiva que poderia guiar a criação de conteúdo}

**2. {Título da notícia}**
...

**3. {Título da notícia}**
...

**4. {Título da notícia}**
...

**5. {Título da notícia}**
...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Critério de ranking: relevância para prática clínica > frescor > potencial de engajamento
```

## Output Example

```markdown
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
Resumo: A resolução atualiza os critérios para teleatendimento telepresencial, exigindo plataformas certificadas, backup de prontuários em nuvem e consentimento digital documentado. Prazo de adequação: 90 dias a partir de julho de 2026.
Ângulo potencial: Educacional (o que mudou e o que fazer) ou Urgência (prazo de adequação)

**2. Pesquisa: terapeutas digitalizados recebem 40% mais solicitações**
Fonte: Saúde Digital Brasil
URL: https://saudedigitalbrasil.com.br/pesquisa-terapeutas-2026
Data: 2026-04-03
Acesso: 2026-04-09
Confiança: MÉDIA
Resumo: Levantamento com 800 terapeutas ativos aponta que profissionais com agenda online e perfil digital ativo recebem em média 40% mais novos pacientes que colegas sem presença digital.
Ângulo potencial: Oportunidade (janela para crescer antes da saturação) ou Medo (terapeutas sem digital perdem mercado)

**3. Plataformas de telepsicologia crescem 62% no primeiro trimestre de 2026**
Fonte: Saúde Business
URL: https://saudebusiness.com.br/telepsicologia-q1-2026
Data: 2026-04-01
Acesso: 2026-04-09
Confiança: ALTA
Resumo: Dados de mercado apontam crescimento acelerado no setor, com destaque para plataformas voltadas a gestão de prontuários e agendamento online para psicólogos autônomos.
Ângulo potencial: Tendência de mercado (surfar a onda) ou Contrário (o que esses números não dizem)

**4. CRP-SP lança programa de certificação para plataformas de atendimento online**
Fonte: CRP São Paulo
URL: https://crpsp.org.br/certificacao-plataformas-2026
Data: 2026-04-02
Acesso: 2026-04-09
Confiança: ALTA
Resumo: O conselho regional paulista anuncia programa voluntário de certificação para plataformas de teleatendimento, com critérios de segurança de dados e conformidade com a nova resolução federal.
Ângulo potencial: Educacional (o que é a certificação e por que importa) ou Posicionamento (Euthycare e os critérios)

**5. Psicólogos relatam dificuldades com LGPD em prontuários digitais**
Fonte: Psicologia na Prática
URL: https://psicologianaprática.com.br/lgpd-prontuarios-2026
Data: 2026-03-28
Acesso: 2026-04-09
Confiança: MÉDIA
Resumo: Estudo qualitativo revela que 58% dos psicólogos autônomos relatam insegurança sobre como adequar o armazenamento de prontuários digitais à LGPD, especialmente em plataformas de videoconferência generalistas.
Ângulo potencial: Dor (a confusão que todo terapeuta digital sente) ou Solução (o que os melhores estão fazendo)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Critério de ranking: relevância para prática clínica > frescor > potencial de engajamento
```

## Quality Criteria

- [ ] Exatamente 5 notícias no brief
- [ ] Cada notícia tem todos os campos: título, fonte nomeada, URL, data de publicação, data de acesso, nível de confiança, resumo e ângulo potencial
- [ ] Todas as notícias dentro do período solicitado (máximo 1 exceção justificada)
- [ ] URLs verificadas e acessíveis no momento da pesquisa
- [ ] Nível de confiança atribuído e justificado para cada notícia
- [ ] Brief salvo em squads/euthycare-content/output/news-brief.md

## Veto Conditions

Reject and redo if ANY are true:
1. Qualquer notícia no brief não tem URL verificável e acessível
2. Brief tem menos de 5 ou mais de 5 notícias
3. Nenhuma das 5 notícias tem conexão direta com a prática clínica ou regulação de terapeutas
