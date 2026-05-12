# Step 2 — Publicar no Instagram

## Agente
Paulo Publisher

## Instrução

1. Lê `squads/elisabete-terapia/output/post-draft.md`
2. Combina CAPTION + "\n\n" + HASHTAGS num texto único
3. Verifica se existe imagem em `squads/elisabete-terapia/output/post-image.jpg`
   - Se não existir: usa `squads/elisabete-terapia/output/default-image.jpg`
   - Se nenhuma existir: pede à utilizadora para adicionar uma imagem antes de continuar
4. Carrega a LATE_API_KEY do ficheiro `C:/Claude IA/EUTHYCARE/.claude/.env`
5. Faz upload da imagem via Late API e publica no @elisabete.terapia
6. Aguarda confirmação (URL do post)
7. Guarda resultado em `squads/elisabete-terapia/output/published-posts.md`
8. Actualiza `_memory/memories.md` com tema e data

## Em caso de erro
Guardar caption em `output/pending-post.md` e informar a utilizadora.
