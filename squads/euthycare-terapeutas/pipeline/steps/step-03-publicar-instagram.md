# Step 3 — Publicar no Instagram

## Agente
Paulo Publisher

## Instrução

1. Lê `squads/euthycare-terapeutas/output/post-draft.md`
2. Combina CAPTION + "\n\n" + HASHTAGS num texto único
3. Verifica se existe imagem em `squads/euthycare-terapeutas/output/post-image.jpg`
   - Se não existir: usa `squads/euthycare-terapeutas/output/default-image.jpg`
   - Se nenhuma existir: pede à utilizadora para adicionar uma imagem antes de continuar
4. Usa o Playwright MCP para publicar:
   a. Navega para https://www.instagram.com/
   b. Clica no botão "+" (criar novo post)
   c. Faz upload da imagem
   d. Clica "Seguinte" até chegar ao ecrã de legenda
   e. Cola o texto completo na caixa de legenda
   f. Clica "Partilhar"
5. Aguarda confirmação do Instagram (URL do post)
6. Guarda resultado em `squads/euthycare-terapeutas/output/published-posts.md`:
   ```
   ## [data]
   - Topic: [tema]
   - URL: [url do post]
   - Caption: [primeiras 100 chars]
   ```
7. Actualiza `_memory/memories.md` com o tema usado e data

## Em caso de erro
Se o Playwright falhar, guardar o caption em `output/pending-post.md` e informar a utilizadora para publicar manualmente.
