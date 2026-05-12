"""
Agendamento em batch de posts Instagram via Late API.

Lê squads/schedule-config.json, gera conteúdo com Claude API,
cria imagens (carrossel com Pillow) e agenda tudo de uma vez na Late API.

Uso:
  python squads/scripts/agendar-posts-batch-late-api.py
  python squads/scripts/agendar-posts-batch-late-api.py --dry-run
  python squads/scripts/agendar-posts-batch-late-api.py --only-account elisabete-terapia
  python squads/scripts/agendar-posts-batch-late-api.py --from-date 2026-05-01

Dependências:
  pip install anthropic requests pillow python-dotenv
"""

import argparse
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

# ── Dependências opcionais ──────────────────────────────────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv("C:/Claude IA/EUTHYCARE/.claude/.env")
except ImportError:
    # Carregar .env manualmente se python-dotenv não estiver instalado
    env_path = Path("C:/Claude IA/EUTHYCARE/.claude/.env")
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

try:
    import anthropic
except ImportError:
    print("ERRO: anthropic não instalado. Corre: pip install anthropic")
    sys.exit(1)

try:
    from PIL import Image, ImageDraw, ImageFont
    PILLOW_OK = True
except ImportError:
    print("AVISO: Pillow não instalado — carrosseis usarão imagem padrão.")
    PILLOW_OK = False

try:
    from zoneinfo import ZoneInfo
except ImportError:
    from backports.zoneinfo import ZoneInfo  # Python < 3.9

# ── Configuração ─────────────────────────────────────────────────────────────
BASE_DIR   = Path("C:/Claude IA/EUTHYCARE")
CONFIG     = BASE_DIR / "squads/schedule-config.json"
LATE_BASE  = "https://getlate.dev/api/v1"
LATE_KEY   = os.environ.get("LATE_API_KEY", "")
CLAUDE_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

# Cores da marca @elisabete.terapia
SLIDE_COLORS = {
    "bg_capa":     "#F5F0EB",
    "bg_conteudo": "#FFFFFF",
    "bg_cta":      "#E8EDE8",
    "accent":      "#8B9E7A",
    "title":       "#2C2C2C",
    "body":        "#4A4A4A",
    "subtitle":    "#6B6B6B",
    "tag":         "#8B9E7A",
}
SIZE   = (1080, 1080)
PAD    = 90
HANDLE = "@elisabete.terapia"


# ── Prompts para geração de conteúdo ─────────────────────────────────────────

BRAND_VOICE_ELISABETE = """
Tom: caloroso, próximo, sem jargão clínico. Público: adultos 25-50 que consideram terapia.
Nunca usar: "incrível", "transformador", "jornada". CTA suave: "fala comigo — link na bio".
Linguagem: português de Portugal.
"""

BRAND_VOICE_EUTHYCARE = """
Tom: profissional mas acessível, como colega de profissão. Público: terapeutas portugueses 28-50.
Nunca usar: "incrível", "revolucionário". CTA: "Candidata-te em euthycare.com" ou "Link na bio".
Linguagem: português de Portugal.
"""


def build_simple_post_prompt(account: str, topic_hint: str) -> str:
    voice = BRAND_VOICE_ELISABETE if account == "elisabete-terapia" else BRAND_VOICE_EUTHYCARE
    handle = "@elisabete.terapia" if account == "elisabete-terapia" else "@euthycare"

    return f"""Escreve um post para Instagram {handle} sobre o tema: "{topic_hint}".

Voz da marca: {voice}

Responde APENAS com JSON válido neste formato:
{{
  "caption": "texto do post (máx 2200 chars, hook nas primeiras 2 linhas)",
  "hashtags": "#tag1 #tag2 ... (8-12 hashtags relevantes)"
}}"""


def build_carousel_prompt(topic_hint: str) -> str:
    return f"""Cria conteúdo para um carrossel Instagram @elisabete.terapia sobre: "{topic_hint}".

{BRAND_VOICE_ELISABETE}

Regras:
- Slide 1 (capa): título que para o scroll (máx 8 palavras) + subtítulo opcional (máx 12 palavras)
- Slides 2-4: uma ideia por slide, title (máx 6 palavras) + body (máx 80 palavras)
- Slide 5 (cta): convite suave, sem pressão
- Mínimo 3 slides, máximo 5

Responde APENAS com JSON válido:
{{
  "topic": "{topic_hint}",
  "caption": "legenda do post (máx 2200 chars) com CTA no final",
  "hashtags": "#tag1 #tag2 ... (8-12 hashtags)",
  "slides": [
    {{"number": 1, "type": "capa", "title": "...", "subtitle": "..."}},
    {{"number": 2, "type": "conteudo", "title": "...", "body": "..."}},
    {{"number": 3, "type": "conteudo", "title": "...", "body": "..."}},
    {{"number": 4, "type": "conteudo", "title": "...", "body": "..."}},
    {{"number": 5, "type": "cta", "title": "Queres falar?", "body": "..."}}
  ]
}}"""


# ── Geração de conteúdo via Claude API ───────────────────────────────────────

def generate_content(prompt: str, dry_run: bool) -> dict:
    if dry_run:
        return {"caption": "[DRY RUN] Caption gerada", "hashtags": "#teste",
                "slides": [{"number": 1, "type": "capa", "title": "Título", "subtitle": ""}]}

    client = anthropic.Anthropic(api_key=CLAUDE_KEY)
    msg = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}],
    )
    text = msg.content[0].text.strip()
    # Extrair JSON mesmo que o modelo adicione markdown
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError(f"Resposta não é JSON válido:\n{text}")
    return json.loads(match.group())


# ── Gerador de imagens de slides (Pillow) ────────────────────────────────────

def _load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "C:/Windows/Fonts/calibrib.ttf" if bold else "C:/Windows/Fonts/calibri.ttf",
        "C:/Windows/Fonts/arialbd.ttf"  if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for p in candidates:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def _wrap(text: str, font, max_w: int) -> list[str]:
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


def _draw_footer(draw, number: int, total: int, font):
    draw.text((PAD, SIZE[1] - 55), f"{number}/{total}", font=font,
              fill=SLIDE_COLORS["tag"], anchor="ls")
    draw.text((SIZE[0] - PAD, SIZE[1] - 55), HANDLE, font=font,
              fill=SLIDE_COLORS["tag"], anchor="rs")


def _make_slide(slide: dict, total: int) -> Image.Image:
    n, t = slide["number"], slide.get("type", "conteudo")
    bg = {"capa": SLIDE_COLORS["bg_capa"], "cta": SLIDE_COLORS["bg_cta"]}.get(
        t, SLIDE_COLORS["bg_conteudo"])
    img = Image.new("RGB", SIZE, bg)
    draw = ImageDraw.Draw(img)
    f_title = _load_font(66 if t == "capa" else 52, bold=True)
    f_body  = _load_font(38)
    f_small = _load_font(28)
    max_w   = SIZE[0] - PAD * 2

    if t == "capa":
        title_lines = _wrap(slide.get("title", ""), f_title, max_w)
        sub_lines   = _wrap(slide.get("subtitle", ""), f_body, max_w)
        block_h = len(title_lines) * 78 + (len(sub_lines) * 50 + 30 if sub_lines else 0)
        y = (SIZE[1] - block_h) // 2 - 20
        draw.rectangle([PAD, PAD, PAD + 60, PAD + 6], fill=SLIDE_COLORS["accent"])
        for line in title_lines:
            draw.text((PAD, y), line, font=f_title, fill=SLIDE_COLORS["title"]); y += 78
        if sub_lines:
            y += 10
            draw.rectangle([PAD, y, PAD + 60, y + 4], fill=SLIDE_COLORS["accent"]); y += 18
            for line in sub_lines:
                draw.text((PAD, y), line, font=f_body, fill=SLIDE_COLORS["subtitle"]); y += 50

    elif t == "cta":
        title_lines = _wrap(slide.get("title", "Queres falar?"), f_title, max_w)
        body_lines  = _wrap(slide.get("body", "Link na bio."), f_body, max_w)
        block_h = len(title_lines) * 74 + len(body_lines) * 52 + 40
        y = (SIZE[1] - block_h) // 2 - 30
        for line in title_lines:
            draw.text((PAD, y), line, font=f_title, fill=SLIDE_COLORS["title"]); y += 74
        y += 16
        draw.rectangle([PAD, y, PAD + 60, y + 4], fill=SLIDE_COLORS["accent"]); y += 24
        for line in body_lines:
            draw.text((PAD, y), line, font=f_body, fill=SLIDE_COLORS["body"]); y += 52

    else:  # conteudo
        title_lines = _wrap(slide.get("title", ""), f_title, max_w)
        body_lines  = _wrap(slide.get("body", ""), f_body, max_w)
        y = PAD + 80
        draw.rectangle([PAD, y, PAD + 60, y + 4], fill=SLIDE_COLORS["accent"]); y += 24
        for line in title_lines:
            draw.text((PAD, y), line, font=f_title, fill=SLIDE_COLORS["title"]); y += 62
        y += 16
        for line in body_lines:
            draw.text((PAD, y), line, font=f_body, fill=SLIDE_COLORS["body"]); y += 50

    _draw_footer(draw, n, total, f_small)
    return img


def generate_slide_images(slides: list, out_dir: Path) -> list[Path]:
    """Gera imagens JPG para cada slide. Devolve lista de caminhos."""
    out_dir.mkdir(parents=True, exist_ok=True)
    paths = []
    for slide in slides:
        img = _make_slide(slide, len(slides))
        p = out_dir / f"slide-{slide['number']:02d}.jpg"
        img.save(p, "JPEG", quality=95)
        paths.append(p)
    return paths


# ── Late API — upload e agendamento ──────────────────────────────────────────

def upload_image(image_path: Path, account_id: str, dry_run: bool) -> str:
    if dry_run:
        return f"dry-run-media-id-{image_path.stem}"

    with open(image_path, "rb") as f:
        resp = requests.post(
            f"{LATE_BASE}/media/upload",
            headers={"Authorization": f"Bearer {LATE_KEY}"},
            files={"file": (image_path.name, f, "image/jpeg")},
            data={"accountId": account_id},
            timeout=30,
        )
    resp.raise_for_status()
    return resp.json()["id"]


def schedule_post(account_id: str, text: str, media_ids: list[str],
                  scheduled_at_utc: str, dry_run: bool) -> str:
    if dry_run:
        return f"dry-run-post-id"

    payload = {
        "accountIds": [account_id],
        "text": text,
        "mediaIds": media_ids,
        "scheduledAt": scheduled_at_utc,
    }
    resp = requests.post(
        f"{LATE_BASE}/posts",
        headers={"Authorization": f"Bearer {LATE_KEY}",
                 "Content-Type": "application/json"},
        json=payload,
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    return data.get("id", data.get("postId", "ok"))


# ── Conversão de horário Lisboa → UTC ISO 8601 ───────────────────────────────

def lisbon_to_utc(date_str: str, time_str: str) -> str:
    tz_lisbon = ZoneInfo("Europe/Lisbon")
    dt_local  = datetime.fromisoformat(f"{date_str}T{time_str}:00").replace(
        tzinfo=tz_lisbon)
    dt_utc    = dt_local.astimezone(timezone.utc)
    return dt_utc.strftime("%Y-%m-%dT%H:%M:%SZ")


# ── Obter imagem padrão por conta ─────────────────────────────────────────────

def get_default_image(account_key: str) -> Path:
    paths = [
        BASE_DIR / f"squads/{account_key}/output/default-image.jpg",
        BASE_DIR / "squads/euthycare-terapeutas/output/default-image.jpg",
    ]
    for p in paths:
        if p.exists():
            return p
    return None


# ── Pipeline principal ────────────────────────────────────────────────────────

def process_slot(slot: dict, accounts: dict, dry_run: bool, run_id: str) -> dict:
    acct_key   = slot["account"]
    acct       = accounts[acct_key]
    account_id = acct["account_id"]
    post_type  = slot.get("type", "simples")
    topic      = slot.get("topic_hint", "")
    sched_utc  = lisbon_to_utc(slot["date"], slot["time"])

    print(f"\n▶ {slot['date']} {slot['time']} | {acct['handle']} | {post_type} | {topic}")

    # 1. Gerar conteúdo
    if post_type == "carrossel":
        prompt = build_carousel_prompt(topic)
    else:
        prompt = build_simple_post_prompt(acct_key, topic)

    content = generate_content(prompt, dry_run)
    full_text = content["caption"] + "\n\n" + content["hashtags"]

    # 2. Preparar imagens
    media_ids = []

    if post_type == "carrossel" and PILLOW_OK and "slides" in content:
        out_dir = BASE_DIR / f"squads/{acct_key}/output/carousel-{run_id}-{slot['date']}"
        slide_paths = generate_slide_images(content["slides"], out_dir)
        for p in slide_paths:
            mid = upload_image(p, account_id, dry_run)
            media_ids.append(mid)
            print(f"  ↑ {p.name} → {mid}")
    else:
        # Post simples — usa imagem padrão
        img_path = get_default_image(acct_key)
        if img_path:
            mid = upload_image(img_path, account_id, dry_run)
            media_ids.append(mid)
            print(f"  ↑ default-image.jpg → {mid}")
        else:
            print(f"  ⚠ Sem imagem padrão — post agendado SEM imagem")

    # 3. Agendar
    post_id = schedule_post(account_id, full_text, media_ids, sched_utc, dry_run)
    print(f"  ✓ Agendado para {sched_utc} | post_id: {post_id}")

    return {
        "slot": f"{slot['date']} {slot['time']}",
        "account": acct["handle"],
        "type": post_type,
        "topic": topic,
        "scheduled_utc": sched_utc,
        "post_id": post_id,
        "status": "scheduled",
    }


def main():
    parser = argparse.ArgumentParser(description="Agendamento batch Instagram via Late API")
    parser.add_argument("--dry-run", action="store_true",
                        help="Simula sem fazer chamadas reais à API")
    parser.add_argument("--only-account", metavar="ACCOUNT",
                        help="Processa apenas esta conta (ex: elisabete-terapia)")
    parser.add_argument("--from-date", metavar="YYYY-MM-DD",
                        help="Processa apenas slots a partir desta data")
    args = parser.parse_args()

    # Validar API keys
    if not args.dry_run:
        if not LATE_KEY:
            print("ERRO: LATE_API_KEY não encontrada em .env"); sys.exit(1)
        if not CLAUDE_KEY:
            print("ERRO: ANTHROPIC_API_KEY não encontrada em .env"); sys.exit(1)

    # Carregar config
    with open(CONFIG, "r", encoding="utf-8") as f:
        config = json.load(f)

    accounts = config["accounts"]
    slots    = config["slots"]

    # Filtros
    if args.only_account:
        slots = [s for s in slots if s["account"] == args.only_account]
    if args.from_date:
        slots = [s for s in slots if s["date"] >= args.from_date]

    # Filtrar slots no passado
    now_utc = datetime.now(timezone.utc)
    future_slots = []
    for s in slots:
        utc = lisbon_to_utc(s["date"], s["time"])
        if datetime.fromisoformat(utc.replace("Z", "+00:00")) > now_utc:
            future_slots.append(s)
        else:
            print(f"  ⏭ Ignorado (passado): {s['date']} {s['time']} {s['account']}")

    print(f"\n{'[DRY RUN] ' if args.dry_run else ''}Agendando {len(future_slots)} posts...\n")

    run_id  = datetime.now().strftime("%Y%m%d%H%M")
    results = []

    for slot in future_slots:
        try:
            result = process_slot(slot, accounts, args.dry_run, run_id)
            results.append(result)
            time.sleep(1)  # respeitar rate limits
        except Exception as e:
            print(f"  ✗ ERRO: {e}")
            results.append({
                "slot": f"{slot['date']} {slot['time']}",
                "account": slot["account"],
                "status": "error",
                "error": str(e),
            })

    # Relatório final
    ok    = [r for r in results if r["status"] == "scheduled"]
    fails = [r for r in results if r["status"] == "error"]

    print(f"\n{'='*50}")
    print(f"✓ {len(ok)} posts agendados | ✗ {len(fails)} erros")

    # Guardar relatório
    report_path = BASE_DIR / f"squads/schedule-report-{run_id}.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"Relatório: {report_path}")


if __name__ == "__main__":
    main()
