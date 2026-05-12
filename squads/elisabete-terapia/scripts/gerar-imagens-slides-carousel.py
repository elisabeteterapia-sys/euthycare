"""
Gerador de slides para carrossel Instagram — @elisabete.terapia
Estilo: foto de fundo + overlay gradiente escuro + texto branco por cima.

Uso:
  python gerar-imagens-slides-carousel.py \
    --input  squads/elisabete-terapia/output/carousel-draft.json \
    --output squads/elisabete-terapia/output/carousel/ \
    --photo  squads/elisabete-terapia/assets/foto-elisabete.jpg

  # Sem foto: usa gradiente como fundo
  python gerar-imagens-slides-carousel.py --input ... --output ...
"""

import argparse
import json
import os
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance
except ImportError:
    print("ERRO: pip install pillow")
    raise

SIZE   = (1080, 1080)
PAD    = 72
HANDLE = "@elisabete.terapia"

# Cores de fallback (sem foto)
FALLBACK_GRADIENTS = {
    "capa":     ("#1B3A2F", "#4E8A72"),
    "conteudo": ("#1a2a35", "#2d5a6e"),
    "cta":      ("#2D1B3A", "#6B4E8A"),
}

# Overlay: intensidade do escurecimento por tipo
OVERLAY_ALPHA = {
    "capa":     210,   # mais escuro para texto grande
    "conteudo": 185,
    "cta":      220,
}


# ── Utilitários ──────────────────────────────────────────────────────────────

def hex_to_rgb(h: str) -> tuple:
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "C:/Windows/Fonts/calibrib.ttf" if bold else "C:/Windows/Fonts/calibri.ttf",
        "C:/Windows/Fonts/arialbd.ttf"  if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
    ]
    for p in candidates:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def wrap_text(text: str, font, max_w: int) -> list[str]:
    dummy = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    words, lines, cur = text.split(), [], ""
    for word in words:
        test = (cur + " " + word).strip()
        if dummy.textlength(test, font=font) <= max_w:
            cur = test
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def make_gradient_bg(color_top: str, color_bot: str) -> Image.Image:
    """Fundo de gradiente simples (fallback sem foto)."""
    c1, c2 = hex_to_rgb(color_top), hex_to_rgb(color_bot)
    img = Image.new("RGB", SIZE)
    px  = img.load()
    for y in range(SIZE[1]):
        t = y / (SIZE[1] - 1)
        col = tuple(int(c1[i] * (1-t) + c2[i] * t) for i in range(3))
        for x in range(SIZE[0]):
            px[x, y] = col
    return img


def prepare_bg(photo_path: str | None, slide_type: str) -> Image.Image:
    """
    Carrega foto e aplica:
      1. Crop/resize para 1080x1080
      2. Ligeiro desfoque (efeito 'distante')
      3. Escurecimento suave
    Se sem foto, usa gradiente.
    """
    if photo_path and Path(photo_path).exists():
        img = Image.open(photo_path).convert("RGB")

        # Crop centrado para quadrado
        w, h = img.size
        side = min(w, h)
        left = (w - side) // 2
        top  = (h - side) // 2
        img  = img.crop((left, top, left + side, top + side))
        img  = img.resize(SIZE, Image.LANCZOS)

        # Desfoque suave — efeito 'distante'
        img = img.filter(ImageFilter.GaussianBlur(radius=2.5))

        # Escurecer ligeiramente
        img = ImageEnhance.Brightness(img).enhance(0.70)
    else:
        colors = FALLBACK_GRADIENTS.get(slide_type, FALLBACK_GRADIENTS["conteudo"])
        img = make_gradient_bg(*colors)

    return img


def add_bottom_overlay(img: Image.Image, slide_type: str) -> Image.Image:
    """
    Gradiente escuro do fundo para cima — garante legibilidade do texto.
    Cobre os 65% inferiores com opacidade progressiva.
    """
    overlay = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    draw    = ImageDraw.Draw(overlay)
    h       = SIZE[1]
    start_y = int(h * 0.25)   # começa a escurecer a 25% do topo
    max_a   = OVERLAY_ALPHA[slide_type]

    for y in range(start_y, h):
        t     = (y - start_y) / (h - start_y)
        alpha = int(max_a * (t ** 0.6))
        draw.line([(0, y), (SIZE[0], y)], fill=(0, 0, 0, alpha))

    base = img.convert("RGBA")
    base = Image.alpha_composite(base, overlay)
    return base.convert("RGB")


def draw_topic_tag(draw, text: str, y: int, font) -> int:
    """Etiqueta de tópico — rectângulo arredondado branco semi-transparente."""
    pad_x, pad_y = 22, 10
    w = int(draw._image.size[0] * 0)   # dummy
    # Medir texto
    dummy_img  = Image.new("RGB", (1, 1))
    dummy_draw = ImageDraw.Draw(dummy_img)
    tw = int(dummy_draw.textlength(text.upper(), font=font))
    th = font.size

    rx1, ry1 = PAD, y
    rx2, ry2 = PAD + tw + pad_x * 2, y + th + pad_y * 2

    # Fundo branco semi-transparente
    tag_layer = Image.new("RGBA", draw._image.size, (0, 0, 0, 0))
    tag_draw  = ImageDraw.Draw(tag_layer)
    tag_draw.rounded_rectangle([rx1, ry1, rx2, ry2], radius=6,
                                fill=(255, 255, 255, 55))
    draw._image.paste(Image.alpha_composite(
        draw._image.convert("RGBA"), tag_layer).convert("RGB"))

    # Texto da etiqueta
    draw.text((PAD + pad_x, y + pad_y), text.upper(), font=font,
              fill=(255, 255, 255, 220))
    return ry2 + 20


def draw_footer(img: Image.Image, number: int, total: int):
    """Handle e número do slide no rodapé."""
    draw   = ImageDraw.Draw(img)
    f      = load_font(26)
    y      = SIZE[1] - 52
    draw.text((PAD, y),           f"{number}/{total}", font=f, fill=(200, 200, 200))
    draw.text((SIZE[0] - PAD, y), HANDLE,              font=f, fill=(200, 200, 200),
              anchor="rs")


# ── Construtores por tipo ────────────────────────────────────────────────────

def make_capa(slide: dict, total: int, photo: str | None) -> Image.Image:
    img  = prepare_bg(photo, "capa")
    img  = add_bottom_overlay(img, "capa")
    draw = ImageDraw.Draw(img)

    f_tag      = load_font(28, bold=True)
    f_title    = load_font(78, bold=True)
    f_subtitle = load_font(40)
    max_w      = SIZE[0] - PAD * 2

    topic = slide.get("topic_label", slide.get("title", "")[:20])

    # Posicionamento — bloco no terço inferior
    y = int(SIZE[1] * 0.52)

    # Tag de tópico
    y = draw_topic_tag(draw, topic, y, f_tag)
    y += 8

    # Título grande
    for line in wrap_text(slide.get("title", ""), f_title, max_w):
        draw.text((PAD, y), line, font=f_title, fill="white")
        y += 88

    # Subtítulo
    subtitle = slide.get("subtitle", "")
    if subtitle:
        y += 6
        for line in wrap_text(subtitle, f_subtitle, max_w):
            draw.text((PAD, y), line, font=f_subtitle, fill=(210, 210, 210))
            y += 50

    draw_footer(img, 1, total)
    return img


def make_conteudo(slide: dict, number: int, total: int, photo: str | None) -> Image.Image:
    img  = prepare_bg(photo, "conteudo")
    img  = add_bottom_overlay(img, "conteudo")
    draw = ImageDraw.Draw(img)

    f_title = load_font(58, bold=True)
    f_body  = load_font(38)
    max_w   = SIZE[0] - PAD * 2

    # Bloco no centro-baixo
    title_lines = wrap_text(slide.get("title", ""), f_title, max_w)
    body_lines  = wrap_text(slide.get("body", ""),  f_body,  max_w)

    block_h = len(title_lines) * 68 + len(body_lines) * 52 + 32
    y       = int(SIZE[1] * 0.50) - block_h // 4

    for line in title_lines:
        draw.text((PAD, y), line, font=f_title, fill="white")
        y += 68

    y += 14
    # Linha decorativa
    draw.rectangle([PAD, y, PAD + 50, y + 3], fill=(180, 220, 200))
    y += 18

    for line in body_lines:
        draw.text((PAD, y), line, font=f_body, fill=(220, 220, 220))
        y += 52

    draw_footer(img, number, total)
    return img


def make_cta(slide: dict, number: int, total: int, photo: str | None) -> Image.Image:
    img  = prepare_bg(photo, "cta")
    img  = add_bottom_overlay(img, "cta")
    draw = ImageDraw.Draw(img)

    f_title = load_font(68, bold=True)
    f_body  = load_font(42)
    max_w   = SIZE[0] - PAD * 2

    title_lines = wrap_text(slide.get("title", "Queres falar?"), f_title, max_w)
    body_lines  = wrap_text(
        slide.get("body", "Marca uma sessão de descoberta. Link na bio."),
        f_body, max_w)

    block_h = len(title_lines) * 78 + len(body_lines) * 56 + 40
    y       = int(SIZE[1] * 0.48) - block_h // 4

    for line in title_lines:
        draw.text((PAD, y), line, font=f_title, fill="white")
        y += 78

    y += 16
    draw.rectangle([PAD, y, PAD + 50, y + 3], fill=(180, 150, 220))
    y += 22

    for line in body_lines:
        draw.text((PAD, y), line, font=f_body, fill=(210, 210, 230))
        y += 56

    draw_footer(img, number, total)
    return img


# ── Entry point ──────────────────────────────────────────────────────────────

def generate_carousel(input_path: str, output_dir: str,
                      photo_path: str | None = None) -> list[str]:
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    slides = data.get("slides", [])
    if not slides:
        print("ERRO: Nenhum slide no JSON.")
        return []

    Path(output_dir).mkdir(parents=True, exist_ok=True)
    total = len(slides)
    paths = []

    for slide in slides:
        n, t = slide["number"], slide.get("type", "conteudo")

        if t == "capa":
            img = make_capa(slide, total, photo_path)
        elif t == "cta":
            img = make_cta(slide, n, total, photo_path)
        else:
            img = make_conteudo(slide, n, total, photo_path)

        out = os.path.join(output_dir, f"slide-{n:02d}.jpg")
        img.save(out, "JPEG", quality=95)
        paths.append(out)
        print(f"✓ slide-{n:02d}.jpg")

    print(f"\n{total} slides em: {output_dir}")
    return paths


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input",  required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--photo",  default=None,
                        help="Foto de fundo (JPG). Sem foto: usa gradiente.")
    args = parser.parse_args()
    generate_carousel(args.input, args.output, args.photo)
