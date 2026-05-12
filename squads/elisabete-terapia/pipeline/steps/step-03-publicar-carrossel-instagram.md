# Step 3 — Publicar Carrossel no Instagram

## Agente
Paulo Publisher

## Instrução

1. Lê `squads/elisabete-terapia/output/carousel-draft.json` para obter caption e hashtags
2. Lista todos os slides em `squads/elisabete-terapia/output/carousel/slide-*.jpg` (ordem crescente)
3. Carrega LATE_API_KEY de `C:/Claude IA/EUTHYCARE/.claude/.env`
4. Faz upload de cada slide individualmente e colecta os mediaIds:

```bash
# Repetir para cada slide (slide-01.jpg, slide-02.jpg, ...)
curl -s -X POST "https://getlate.dev/api/v1/media/upload" \
  -H "Authorization: Bearer $LATE_API_KEY" \
  -F "file=@squads/elisabete-terapia/output/carousel/slide-01.jpg" \
  -F "accountId=69e616717dea335c2b14501f"
# Guardar o "id" retornado por cada upload
```

5. Publica o carrossel com todos os mediaIds na ordem correcta:

```bash
curl -s -X POST "https://getlate.dev/api/v1/posts" \
  -H "Authorization: Bearer $LATE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "accountIds": ["69e616717dea335c2b14501f"],
    "text": "[CAPTION]\n\n[HASHTAGS]",
    "mediaIds": ["ID_SLIDE_1", "ID_SLIDE_2", "..."]
  }'
```

6. Confirma URL do post publicado
7. Guarda em `output/published-posts.md`:
   ```
   ## [data] — CARROSSEL
   - URL: [url]
   - Tema: [topic]
   - Slides: [número de slides]
   - Caption: [primeiras 100 chars]
   ```
8. Actualiza `_memory/memories.md` com tema e data

## Em caso de erro
Guardar caption em `output/pending-post.md` e informar a utilizadora.
