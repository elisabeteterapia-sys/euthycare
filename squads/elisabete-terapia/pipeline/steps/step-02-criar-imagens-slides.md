# Step 2 — Criar Imagens dos Slides

## Tipo
Script Python

## Instrução

1. Lê `squads/elisabete-terapia/output/carousel-draft.json`
2. Corre o script para gerar imagens:

```bash
cd "C:/Claude IA/EUTHYCARE"
python squads/elisabete-terapia/scripts/gerar-imagens-slides-carousel.py \
  --input squads/elisabete-terapia/output/carousel-draft.json \
  --output squads/elisabete-terapia/output/carousel/
```

3. Verifica que foram criados os ficheiros `slide-01.jpg`, `slide-02.jpg`, etc.
4. Se o script falhar por falta de dependências:
   ```bash
   pip install pillow
   ```
   e tenta novamente.

## Output esperado
```
squads/elisabete-terapia/output/carousel/
├── slide-01.jpg   ← capa
├── slide-02.jpg
├── slide-03.jpg
├── slide-04.jpg   (se existir)
└── slide-05.jpg   (se existir)
```

## Em caso de erro
Informar a utilizadora com a mensagem de erro do script.
