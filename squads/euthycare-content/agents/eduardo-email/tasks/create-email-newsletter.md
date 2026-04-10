---
task: "Create Email Newsletter"
order: 1
input: |
  - angle: Ângulo selecionado (lido de output/angle-selection.md)
  - tone: Tom de voz confirmado (de tone-of-voice.md)
  - format_rules: Regras da plataforma Email Newsletter (injetadas pelo Pipeline Runner)
output: |
  - email: Newsletter completa com subject line, preview text, featured content, seções, CTA e footer
---

# Create Email Newsletter

Produz newsletter de nutrição de leads para terapeutas a partir do ângulo aprovado. Entrega dentro de 200-500 palavras, com subject line de 30-50 chars, preview text complementar e CTA único.

## Process

1. **Ler angle-selection.md** — absorver o ângulo, hook e premissa aprovados
2. **Redigir o corpo completo primeiro** (featured content + 2-3 seções + CTA)
3. **Criar featured content** (100-150 palavras) — a ideia central entregue acima da dobra
4. **Escrever 2-3 seções secundárias** (50-100 palavras cada) com subheadings descritivos
5. **Definir CTA único** com texto verbo+objeto (não "clique aqui")
6. **Contar palavras totais** — ajustar para que fique entre 200-500 palavras
7. **Escrever subject line** (30-50 chars) com curiosidade, benefício ou urgência — escrever depois do corpo para prometer o que o email entrega
8. **Escrever preview text** (60-90 chars) que estende o subject sem repetir
9. **Completar header e footer**

## Output Format

```
=== SUBJECT LINE ===
[30-50 chars — curiosidade, benefício ou urgência]

=== PREVIEW TEXT ===
[60-90 chars — estende o subject, nunca repete]

=== HEADER ===
[Nome da marca | Edição #N | Mês Ano]

=== FEATURED CONTENT ===
[100-150 palavras — ideia central, entregue acima da dobra]

[Descrição de imagem se aplicável]

=== BODY ===

### [Subheading descritivo 1]
[50-100 palavras com link opcional]

### [Subheading descritivo 2]
[50-100 palavras com link opcional]

### [Subheading descritivo 3, se necessário]
[50-100 palavras]

=== CTA ===
[Texto do botão — verbo + objeto]
[URL de destino]

=== FOOTER ===
[Marca] | [site]
Cancelar inscrição | Preferências de email | [Endereço]
```

## Output Example

```
=== SUBJECT LINE ===
Terapeutas online ganham 40% mais clientes

=== PREVIEW TEXT ===
O dado que vai fazer você repensar sua agenda digital

=== HEADER ===
Euthycare | Edição #4 | Abril 2026

=== FEATURED CONTENT ===
Um novo levantamento com 800 terapeutas ativos revelou o que muitos já suspeitavam: profissionais com agenda online e presença digital ativa recebem em média 40% mais solicitações de novos pacientes do que colegas que dependem exclusivamente de indicação direta.

O motivo é direto: 67% dos novos pacientes pesquisam o terapeuta online antes do primeiro contato. Se você não aparece nessa busca, você simplesmente não existe para esse grupo de pessoas.

A boa notícia é que presença digital não significa criar conteúdo todos os dias. Significa estar disponível quando a pessoa precisa — e isso é mais simples do que parece.

[Imagem: agenda digital preenchida vs. agenda vazia]

=== BODY ===

### O mínimo que funciona
Você não precisa de 10 mil seguidores. Perfil atualizado no Google Meu Negócio, agenda online visível e uma forma de contato sem fricção (WhatsApp ou formulário) já colocam você à frente de 70% dos colegas no resultado de busca local. Terapeutas com esses três elementos recebem, em média, 3x mais contatos espontâneos por semana.

### Por que a maioria não faz
O principal obstáculo não é tecnologia — é tempo. Configurar ferramentas digitais quando você já tem agenda cheia parece impossível. É exatamente por isso que a Euthycare existe: você configura uma vez e passa a receber solicitações de forma automática, sem precisar gerenciar plataformas separadas.

=== CTA ===
Experimente grátis por 14 dias
https://euthycare.com/cadastro

=== FOOTER ===
Euthycare | euthycare.com
Cancelar inscrição | Preferências de email | São Paulo, SP
```

## Quality Criteria

- [ ] Subject line entre 30-50 caracteres (contagem verificada manualmente)
- [ ] Preview text entre 60-90 caracteres, não repete o subject
- [ ] Featured content tem 100-150 palavras, entrega o valor principal
- [ ] Total do email entre 200-500 palavras
- [ ] 1 CTA principal com texto verbo+objeto
- [ ] Máximo 2 elementos de CTA total (1 botão + opcional 1 link de texto)
- [ ] Footer com link de unsubscribe presente
- [ ] Corpo escrito antes do subject line (processo verificado)
- [ ] Nenhuma imagem sem indicação de alt text

## Veto Conditions

Reject and redo if ANY are true:
1. Subject line acima de 50 caracteres
2. Preview text repete literalmente o subject line
3. Total de palavras acima de 550 (inclui margem de tolerância)
