"""
Agendamento em batch de posts Instagram via Zernio API.

Lê squads/schedule-config.json, gera conteúdo com Claude API,
cria imagens (carrossel com Pillow) e agenda tudo de uma vez na Zernio.

Uso:
  python squads/scripts/agendar-posts-batch-zernio.py
  python squads/scripts/agendar-posts-batch-zernio.py --dry-run
  python squads/scripts/agendar-posts-batch-zernio.py --only-account elisabete-terapia
  python squads/scripts/agendar-posts-batch-zernio.py --from-date 2026-05-01
  python squads/scripts/agendar-posts-batch-zernio.py --list-accounts

Dependências:
  pip install anthropic requests pillow python-dotenv tzdata
"""

import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import argparse
import json
import os
import re
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

# ── Carregar .env ────────────────────────────────────────────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv("C:/Claude IA/EUTHYCARE/.claude/.env")
except ImportError:
    env_path = Path("C:/Claude IA/EUTHYCARE/.claude/.env")
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

try:
    import anthropic
except ImportError:
    print("ERRO: pip install anthropic")
    sys.exit(1)

try:
    from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
    PILLOW_OK = True
except ImportError:
    print("AVISO: Pillow não instalado — carrosseis usarão imagem padrão.")
    PILLOW_OK = False

try:
    from zoneinfo import ZoneInfo
except ImportError:
    from backports.zoneinfo import ZoneInfo

# ── Configuração ─────────────────────────────────────────────────────────────
BASE_DIR    = Path("C:/Claude IA/EUTHYCARE")
CONFIG      = BASE_DIR / "squads/schedule-config.json"
ZERNIO_BASE = "https://zernio.com/api/v1"
ZERNIO_KEY  = os.environ.get("ZERNIO_API_KEY", "")
CLAUDE_KEY  = os.environ.get("ANTHROPIC_API_KEY", "")

SLIDE_SCRIPT = BASE_DIR / "squads/elisabete-terapia/scripts/gerar-imagens-slides-carousel.py"


# ── Zernio API helpers ────────────────────────────────────────────────────────

def zernio_headers() -> dict:
    return {
        "Authorization": f"Bearer {ZERNIO_KEY}",
        "Content-Type": "application/json",
    }


def get_zernio_accounts(dry_run: bool) -> dict:
    """Devolve dict {handle: account_id} das contas ligadas no Zernio."""
    if dry_run:
        return {"@elisabete.terapia": "dry-account-1", "@euthycare": "dry-account-2"}

    resp = requests.get(f"{ZERNIO_BASE}/accounts", headers=zernio_headers(), timeout=15)
    resp.raise_for_status()
    raw = resp.json()
    print(f"  [debug] Zernio /accounts response: {json.dumps(raw, indent=2)[:500]}")

    # Normalizar para lista de objectos
    items = raw if isinstance(raw, list) else raw.get("data", raw.get("accounts", []))

    accounts = {}
    for acct in items:
        if not isinstance(acct, dict):
            continue
        handle = (acct.get("username") or acct.get("handle") or
                  acct.get("name") or acct.get("profileName") or "")
        if handle and not handle.startswith("@"):
            handle = f"@{handle}"
        # Zernio usa _id como campo de ID principal
        aid = acct.get("_id") or acct.get("id") or acct.get("accountId")
        if handle and aid:
            accounts[handle] = aid
    return accounts


def upload_image_zernio(image_path: Path, account_id: str, dry_run: bool) -> str:
    """Faz upload de uma imagem e devolve a URL pública (Zernio devolve URL, não mediaId)."""
    if dry_run:
        return f"dry-run-media-id-{image_path.stem}"

    print(f"  [debug] a fazer upload de: {image_path} (existe: {image_path.exists()}, tamanho: {image_path.stat().st_size if image_path.exists() else 0})")
    with open(image_path, "rb") as f:
        file_data = f.read()

    # Zernio espera o campo 'files' (plural) em multipart/form-data
    resp = requests.post(
        f"{ZERNIO_BASE}/media",
        headers={"Authorization": f"Bearer {ZERNIO_KEY}"},
        files={"files": (image_path.name, file_data, "image/jpeg")},
        timeout=60,
    )

    if not resp.ok:
        print(f"  [debug] upload status: {resp.status_code} | body: {resp.text[:400]}")
        resp.raise_for_status()

    data = resp.json()
    print(f"  [debug] upload response: {json.dumps(data)[:300]}")
    # Zernio devolve {"files":[{"url":"...","type":"image",...}]}
    files_list = data.get("files", [])
    if files_list:
        return files_list[0].get("url") or str(data)
    return (data.get("url") or data.get("mediaUrl") or data.get("_id") or
            data.get("id") or data.get("data", {}).get("url") or str(data))


def schedule_post_zernio(account_id: str, text: str, media_urls: list[str],
                         scheduled_for_iso: str, dry_run: bool) -> str:
    """Agenda um post no Zernio. Devolve o post ID."""
    if dry_run:
        return "dry-run-post-id"

    payload = {
        "accountIds": [account_id],
        "content": text,
        "scheduledFor": scheduled_for_iso,
        "platforms": [{"platform": "instagram", "accountId": account_id}],
    }
    if media_urls:
        # Zernio espera mediaItems com type + url
        payload["mediaItems"] = [{"url": u, "type": "image"} for u in media_urls]

    resp = requests.post(
        f"{ZERNIO_BASE}/posts",
        headers=zernio_headers(),
        json=payload,
        timeout=30,
    )

    if not resp.ok:
        print(f"  [debug] post status: {resp.status_code}")
        print(f"  [debug] post body: {resp.text[:400]}")
        resp.raise_for_status()

    data = resp.json()
    post = data.get("post", data)
    return (post.get("_id") or post.get("id") or
            data.get("postId") or "ok")


# ── Conversão de horário Lisboa → UTC ISO 8601 ───────────────────────────────

def lisbon_to_utc(date_str: str, time_str: str) -> str:
    tz  = ZoneInfo("Europe/Lisbon")
    dt  = datetime.fromisoformat(f"{date_str}T{time_str}:00").replace(tzinfo=tz)
    utc = dt.astimezone(timezone.utc)
    return utc.strftime("%Y-%m-%dT%H:%M:%SZ")


# ── Geração de conteúdo com Claude API ───────────────────────────────────────

BRAND_ELISABETE = "Tom caloroso, próximo, sem jargão clínico. Público adultos 25-50. CTA suave. Português de Portugal. OBRIGATÓRIO: incluir sempre 'euthycare.com' na legenda (ex: 'Marca a tua sessão em euthycare.com' ou 'Link: euthycare.com')."
BRAND_EUTHYCARE = "Tom profissional mas acessível para terapeutas portugueses 28-50. Português de Portugal. OBRIGATÓRIO: incluir sempre 'euthycare.com' na legenda (ex: 'Candidata-te em euthycare.com' ou 'Sabe mais em euthycare.com')."

# Contas a mencionar para crescimento de audiência
TAGS_ELISABETE = """
Regras de tags OBRIGATÓRIAS:
- SEMPRE mencionar @euthycare na legenda — ex: "Trabalho através da @euthycare" ou "Sessões disponíveis via @euthycare" (adaptar ao contexto, mas sempre presente)
- Mencionar @ordemdosterapeutas APENAS quando o tema for certificação ou regulação (opcional)
- Máximo 2 tags de contas por post
"""

TAGS_EUTHYCARE = """
Regras de tags OBRIGATÓRIAS:
- SEMPRE mencionar @elisabete.terapia na legenda — ex: "Como a @elisabete.terapia, os nossos terapeutas..." ou "Segue @elisabete.terapia para dicas de bem-estar" (adaptar ao contexto, mas sempre presente)
- Mencionar @ordemdosterapeutas APENAS quando o tema for certificação ou regulação (opcional)
- Máximo 2 tags de contas por post
"""


def generate_content(account: str, post_type: str, topic: str, dry_run: bool) -> dict:
    if dry_run:
        if post_type == "carrossel":
            return {
                "topic": topic, "caption": f"[DRY RUN] {topic}", "hashtags": "#teste",
                "slides": [
                    {"number": 1, "type": "capa", "title": topic, "subtitle": ""},
                    {"number": 2, "type": "conteudo", "title": "Ponto 1", "body": "Corpo do slide 2."},
                    {"number": 3, "type": "cta", "title": "Queres falar?", "body": "Link na bio."},
                ]
            }
        return {"caption": f"[DRY RUN] Post sobre {topic}", "hashtags": "#teste"}

    voice = BRAND_ELISABETE if account == "elisabete-terapia" else BRAND_EUTHYCARE
    tags  = TAGS_ELISABETE  if account == "elisabete-terapia" else TAGS_EUTHYCARE

    if post_type == "carrossel":
        prompt = f"""Cria conteúdo para carrossel Instagram @{account} sobre "{topic}".
{voice}
{tags}
Slides: capa (título 8 palavras max + subtítulo opcional), 2-3 slides de conteúdo, slide CTA final.
Responde APENAS com JSON:
{{"topic":"{topic}","caption":"legenda (máx 2200 chars, inclui tags de contas se relevante)","hashtags":"#tag1 #tag2 (8-12)","slides":[{{"number":1,"type":"capa","title":"...","subtitle":"..."}},{{"number":2,"type":"conteudo","title":"...","body":"..."}},{{"number":3,"type":"conteudo","title":"...","body":"..."}},{{"number":4,"type":"cta","title":"Queres falar?","body":"..."}}]}}"""
    else:
        prompt = f"""Escreve post Instagram @{account} sobre "{topic}".
{voice}
{tags}
Responde APENAS com JSON: {{"caption":"texto (máx 2200 chars, hook nas primeiras 2 linhas, inclui tags de contas se relevante)","hashtags":"#tag1 #tag2 (8-12)"}}"""

    client = anthropic.Anthropic(api_key=CLAUDE_KEY)
    msg    = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}],
    )
    text  = msg.content[0].text.strip()
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError(f"JSON inválido:\n{text}")
    return json.loads(match.group())


# ── Geração de slides (carrossel) ────────────────────────────────────────────

def generate_slides(content: dict, account: str, run_id: str,
                    slot_date: str, photo: str | None) -> list[Path]:
    """Gera imagens JPG para carrossel. Devolve lista de caminhos."""
    if not PILLOW_OK:
        return []

    out_dir = BASE_DIR / f"squads/{account}/output/carousel-{run_id}-{slot_date}"

    # Importar gerador de slides
    import importlib.util
    spec = importlib.util.spec_from_file_location("slide_gen", SLIDE_SCRIPT)
    mod  = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)

    # Guardar JSON temporário
    draft_path = out_dir.parent / f"carousel-draft-{run_id}.json"
    draft_path.parent.mkdir(parents=True, exist_ok=True)
    with open(draft_path, "w", encoding="utf-8") as f:
        json.dump(content, f, ensure_ascii=False)

    paths = mod.generate_carousel(str(draft_path), str(out_dir), photo)
    return [Path(p) for p in paths]


def get_default_image(account: str) -> Path | None:
    candidates = [
        BASE_DIR / f"squads/{account}/output/default-image.jpg",
        BASE_DIR / "squads/euthycare-terapeutas/output/default-image.jpg",
    ]
    for p in candidates:
        if p.exists():
            return p
    return None


# ── Pipeline principal ────────────────────────────────────────────────────────

def process_slot(slot: dict, zernio_accounts: dict, config_accounts: dict,
                 dry_run: bool, run_id: str, photo: str | None) -> dict:
    acct_key  = slot["account"]
    handle    = config_accounts[acct_key]["handle"]
    post_type = slot.get("type", "simples")
    topic     = slot.get("topic_hint", "")
    sched_utc = lisbon_to_utc(slot["date"], slot["time"])

    # Obter account_id do Zernio pelo handle
    account_id = zernio_accounts.get(handle)
    if not account_id and not dry_run:
        raise ValueError(f"Conta {handle} não encontrada no Zernio. Verifica as ligações.")

    print(f"\n>> {slot['date']} {slot['time']} | {handle} | {post_type} | {topic}")

    # 1. Gerar conteúdo
    content   = generate_content(acct_key, post_type, topic, dry_run)
    full_text = content["caption"] + "\n\n" + content["hashtags"]

    # 2. Preparar imagens
    media_ids = []

    if post_type == "carrossel" and PILLOW_OK and "slides" in content:
        slide_paths = generate_slides(content, acct_key, run_id, slot["date"], photo)
        for p in slide_paths:
            mid = upload_image_zernio(p, account_id, dry_run)
            media_ids.append(mid)
            print(f"  upload {p.name} -> {mid}")
    else:
        img_path = get_default_image(acct_key)
        if img_path:
            mid = upload_image_zernio(img_path, account_id, dry_run)
            media_ids.append(mid)
            print(f"  upload default-image.jpg -> {mid}")
        else:
            print(f"  Sem imagem — post agendado so com texto")

    # 3. Agendar
    post_id = schedule_post_zernio(account_id, full_text, media_ids, sched_utc, dry_run)
    print(f"  Agendado para {sched_utc} | post_id: {post_id}")

    return {
        "slot": f"{slot['date']} {slot['time']}",
        "account": handle, "type": post_type, "topic": topic,
        "scheduled_utc": sched_utc, "post_id": post_id, "status": "scheduled",
    }


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Agendamento batch Instagram via Zernio")
    parser.add_argument("--dry-run",      action="store_true")
    parser.add_argument("--only-account", metavar="ACCOUNT")
    parser.add_argument("--from-date",    metavar="YYYY-MM-DD")
    parser.add_argument("--list-accounts",action="store_true",
                        help="Lista contas ligadas no Zernio e termina")
    parser.add_argument("--photo",        default=None,
                        help="Foto de fundo para slides carrossel")
    args = parser.parse_args()

    # Validar keys
    if not args.dry_run and not args.list_accounts:
        if not ZERNIO_KEY:
            print("ERRO: ZERNIO_API_KEY não encontrada em .env"); sys.exit(1)
        if not CLAUDE_KEY:
            print("ERRO: ANTHROPIC_API_KEY não encontrada em .env"); sys.exit(1)

    # Listar contas
    if args.list_accounts:
        print("Contas ligadas no Zernio:")
        for handle, aid in get_zernio_accounts(False).items():
            print(f"  {handle} -> {aid}")
        return

    # Carregar config
    with open(CONFIG, "r", encoding="utf-8") as f:
        config = json.load(f)

    config_accounts = config["accounts"]
    slots           = config["slots"]

    if args.only_account:
        slots = [s for s in slots if s["account"] == args.only_account]
    if args.from_date:
        slots = [s for s in slots if s["date"] >= args.from_date]

    # Filtrar passado
    now_utc = datetime.now(timezone.utc)
    slots   = [s for s in slots
               if datetime.fromisoformat(
                   lisbon_to_utc(s["date"], s["time"]).replace("Z", "+00:00")
               ) > now_utc]

    print(f"\n{'[DRY RUN] ' if args.dry_run else ''}Agendando {len(slots)} posts...\n")

    # Obter contas Zernio uma vez
    zernio_accounts = get_zernio_accounts(args.dry_run)
    run_id   = datetime.now().strftime("%Y%m%d%H%M")
    results  = []

    for slot in slots:
        try:
            result = process_slot(slot, zernio_accounts, config_accounts,
                                  args.dry_run, run_id, args.photo)
            results.append(result)
            time.sleep(1)
        except Exception as e:
            print(f"  ERRO: {e}")
            results.append({
                "slot": f"{slot['date']} {slot['time']}",
                "account": slot["account"], "status": "error", "error": str(e),
            })

    ok    = [r for r in results if r["status"] == "scheduled"]
    fails = [r for r in results if r["status"] == "error"]
    print(f"\n{'='*50}")
    print(f"OK: {len(ok)} posts agendados | ERROS: {len(fails)}")

    report = BASE_DIR / f"squads/schedule-report-zernio-{run_id}.json"
    with open(report, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"Relatório: {report}")


if __name__ == "__main__":
    main()
