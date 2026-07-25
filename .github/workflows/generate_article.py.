#!/usr/bin/env python3
"""
Daily article generator for arabaihub.github.io
-------------------------------------------------
1. Calls the Gemini API to write one original Arabic article about
   Arabic-relevant AI tools / AI news, avoiding topics already covered.
2. Renders the article into a standalone HTML page matching the site's
   existing dark/gold visual identity.
3. Inserts a summary card at the top of the homepage article grid
   (inside the AUTO_ARTICLES_START / AUTO_ARTICLES_END block), keeping
   only the most recent MAX_CARDS cards there.
4. Adds the new page to sitemap.xml.
5. Appends an entry to articles/log.json (human + machine readable log).

Requires the GEMINI_API_KEY environment variable (set as a GitHub secret).
"""

import json
import os
import re
import sys
import unicodedata
import urllib.request
import urllib.error
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTICLES_DIR = os.path.join(ROOT, "articles")
INDEX_PATH = os.path.join(ROOT, "index.html")
SITEMAP_PATH = os.path.join(ROOT, "sitemap.xml")
LOG_PATH = os.path.join(ARTICLES_DIR, "log.json")
SITE_URL = "https://arabaihub.github.io"
MAX_CARDS = 10  # how many article cards to keep visible on the homepage

GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent"
)

ARABIC_MONTHS = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
]


def arabic_date(dt: datetime) -> str:
    return f"{dt.day} {ARABIC_MONTHS[dt.month - 1]} {dt.year}"


def slugify(text: str) -> str:
    """Turn an (often Arabic) title into a safe, mostly-ASCII slug."""
    text = unicodedata.normalize("NFKD", text)
    ascii_text = re.sub(r"[^\w\s-]", "", text, flags=re.UNICODE)
    ascii_text = re.sub(r"[\s_]+", "-", ascii_text).strip("-").lower()
    # If normalization stripped everything (pure Arabic title), fall back
    # to a date-based slug so we never produce an empty filename.
    if not ascii_text or not re.search(r"[a-z0-9]", ascii_text):
        ascii_text = "article"
    return ascii_text


def load_log() -> list:
    if os.path.exists(LOG_PATH):
        with open(LOG_PATH, "r", encoding="utf-8") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return []
    return []


def save_log(entries: list) -> None:
    os.makedirs(ARTICLES_DIR, exist_ok=True)
    with open(LOG_PATH, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)


def call_gemini(api_key: str, previous_titles: list) -> dict:
    avoid_list = "\n".join(f"- {t}" for t in previous_titles[-40:]) or "(لا يوجد بعد)"

    system_instruction = (
        "أنت كاتب محتوى تقني محترف لموقع عربي متخصص اسمه (عربAIهَب)، "
        "يساعد المستخدم العربي على اختيار ومقارنة أدوات الذكاء الاصطناعي "
        "بدون تكلفة. أسلوبك عملي وصريح وغير مبالغ فيه، بدون حشو، وبدون "
        "الترويج لأداة معينة بشكل مبالغ. تكتب بالعربية الفصحى المبسّطة "
        "المفهومة لعموم القراء العرب."
    )

    prompt = f"""اكتب مقالاً عربياً أصلياً وجديداً لموقع عربAIهَب عن أدوات أو استخدامات
الذكاء الاصطناعي (يمكن أن يشمل: مقارنات أدوات، دليل استخدام عملي، أخبار
اتجاهات، نصائح للمسوقين أو صناع المحتوى أو المطورين العرب، إلخ).

تجنّب تماماً تكرار أي من هذه العناوين أو الموضوعات السابقة:
{avoid_list}

أعد النتيجة بصيغة JSON فقط وفق هذا الشكل بالضبط (بدون أي نص خارج JSON):
{{
  "title": "عنوان جذاب لا يتجاوز 70 حرفاً",
  "meta_description": "وصف تعريفي للمقال لا يتجاوز 155 حرفاً",
  "eyebrow": "وسم قصير جداً (2-4 كلمات) يصف نوع المقال، مثل: مقارنة أدوات",
  "intro": "فقرة تمهيدية من جملتين إلى ثلاث",
  "highlight": "جملة واحدة قوية تلخص الفكرة الأساسية، تُعرض في صندوق مميز",
  "sections": [
    {{
      "heading": "عنوان القسم",
      "paragraph": "فقرة شرح (3-5 جمل)",
      "list_items": ["نقطة 1", "نقطة 2", "نقطة 3"],
      "highlight": "جملة اختيارية تُعرض في صندوق تمييز، أو null"
    }}
  ],
  "conclusion": "فقرة خاتمة من جملتين إلى ثلاث"
}}

اكتب 4 إلى 5 عناصر في sections. اجعل list_items فارغة [] في الأقسام التي لا
تحتاج قائمة، واجعل highlight null في الأقسام التي لا تحتاج صندوق تمييز
(لا تستخدم highlight في أكثر من قسمين)."""

    body = {
        "system_instruction": {"parts": [{"text": system_instruction}]},
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.9,
            "responseMimeType": "application/json",
        },
    }

    req = urllib.request.Request(
        f"{GEMINI_URL}?key={api_key}",
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Gemini API HTTP {e.code}: {detail}") from e

    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError) as e:
        raise RuntimeError(f"Unexpected Gemini response shape: {data}") from e

    return json.loads(text)


def render_sections_html(sections: list) -> str:
    blocks = []
    for sec in sections:
        heading = sec.get("heading", "").strip()
        paragraph = sec.get("paragraph", "").strip()
        items = [i.strip() for i in (sec.get("list_items") or []) if i and i.strip()]
        highlight = (sec.get("highlight") or "").strip()

        parts = [f'    <section>\n      <h2>{heading}</h2>\n      <p>{paragraph}</p>']
        if items:
            li = "\n".join(f"        <li>{item}</li>" for item in items)
            parts.append(f"      <ul>\n{li}\n      </ul>")
        if highlight:
            parts.append(f'      <div class="highlight">{highlight}</div>')
        parts.append("    </section>")
        blocks.append("\n".join(parts))
    return "\n\n".join(blocks)


ARTICLE_TEMPLATE = """<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} | عربAIهَب</title>
  <meta name="description" content="{meta_description}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root{{
      --bg:#10151f;
      --bg-elev:#171e2c;
      --bg-card:#1b2333;
      --border:#2a3346;
      --gold:#d3a34e;
      --gold-dim:#8a6f3a;
      --teal:#46b3a0;
      --coral:#d9634a;
      --text:#eeeae1;
      --text-dim:#93a0b5;
      --text-faint:#5c6579;
    }}
    *{{box-sizing:border-box; margin:0; padding:0;}}
    body{{
      font-family:'IBM Plex Sans Arabic', sans-serif;
      background:var(--bg);
      color:var(--text);
      line-height:1.8;
      -webkit-font-smoothing:antialiased;
    }}
    a{{color:inherit; text-decoration:none;}}
    h1,h2,h3,.display{{font-family:'Tajawal', sans-serif;}}
    .wrap{{max-width:920px; margin:0 auto; padding:0 24px;}}
    header{{position:sticky; top:0; z-index:10; background:rgba(16,21,31,0.92); backdrop-filter:blur(10px); border-bottom:1px solid var(--border);}}
    .nav{{display:flex; justify-content:space-between; align-items:center; padding:16px 24px;}}
    .logo{{font-family:'Tajawal'; font-weight:900; font-size:22px; letter-spacing:0.5px; display:flex; align-items:center; gap:8px;}}
    .logo span{{color:var(--gold);}}
    .nav-links{{display:flex; gap:20px; color:var(--text-dim); font-size:15px;}}
    .nav-links a:hover{{color:var(--gold);}}
    .hero{{padding:70px 24px 40px; border-bottom:1px solid var(--border);}}
    .eyebrow{{display:inline-flex; align-items:center; gap:8px; padding:6px 14px; border-radius:999px; background:rgba(70,179,160,0.08); color:var(--teal); border:1px solid rgba(70,179,160,0.24); font-size:13px;}}
    .hero h1{{font-size:clamp(28px,4.2vw,44px); font-weight:800; margin-top:16px; line-height:1.35; max-width:760px;}}
    .hero p{{margin-top:16px; color:var(--text-dim); font-size:18px; max-width:760px;}}
    .article-card{{margin-top:28px; background:linear-gradient(135deg, rgba(211,163,78,0.14), rgba(70,179,160,0.10)), var(--bg-card); border:1px solid var(--border); border-radius:20px; padding:24px; box-shadow:0 20px 45px rgba(0,0,0,0.2);}}
    .article-card p{{color:var(--text); margin-top:8px;}}
    .content{{padding:40px 24px 72px;}}
    .content section{{margin-bottom:28px; background:var(--bg-card); border:1px solid var(--border); border-radius:18px; padding:24px;}}
    .content h2{{font-size:22px; margin-bottom:10px; color:var(--gold);}}
    .content p, .content li{{color:var(--text-dim);}}
    .content ul{{margin-top:10px; padding-right:18px;}}
    .content li{{margin-bottom:8px;}}
    .highlight{{background:rgba(70,179,160,0.12); border:1px solid rgba(70,179,160,0.24); border-radius:14px; padding:16px; color:var(--text); margin-top:14px;}}
    .back-link{{display:inline-flex; margin-top:18px; padding:10px 14px; border-radius:999px; background:rgba(255,255,255,0.06); border:1px solid var(--border); color:var(--text-dim);}}
    .back-link:hover{{color:var(--gold); border-color:var(--gold-dim);}}
    footer{{padding:36px 24px 48px; text-align:center; color:var(--text-faint); border-top:1px solid var(--border);}}
    footer .logo{{justify-content:center; margin-bottom:12px;}}
    @media (max-width:720px){{.nav-links{{display:none;}}}}
  </style>
</head>
<body>
  <header>
    <div class="nav wrap">
      <a href="../index.html" class="logo">عرب<span>AI</span>هَب</a>
      <nav class="nav-links">
        <a href="../index.html#tools">الأدوات</a>
        <a href="../index.html#article">المقالات</a>
        <a href="../index.html#about">عن الموقع</a>
      </nav>
    </div>
  </header>

  <section class="hero">
    <div class="wrap">
      <div class="eyebrow">{eyebrow} • {date_ar}</div>
      <h1>{title}</h1>
      <p>{intro}</p>
      <div class="article-card">
        <p>{highlight}</p>
      </div>
    </div>
  </section>

  <main class="content wrap">
{sections_html}

    <section>
      <h2>الخلاصة</h2>
      <p>{conclusion}</p>
      <a class="back-link" href="../index.html#article">العودة إلى المقالات</a>
    </section>
  </main>

  <footer>
    <div class="logo">عرب<span>AI</span>هَب</div>
    <p>دليل مستقل لأدوات الذكاء الاصطناعي، بعين عربية.</p>
  </footer>
</body>
</html>
"""


def build_article_html(article: dict, date_ar: str) -> str:
    return ARTICLE_TEMPLATE.format(
        title=article["title"],
        meta_description=article["meta_description"],
        eyebrow=article.get("eyebrow", "مقال اليوم"),
        date_ar=date_ar,
        intro=article["intro"],
        highlight=article["highlight"],
        sections_html=render_sections_html(article["sections"]),
        conclusion=article["conclusion"],
    )


def next_card_number(index_html: str) -> str:
    nums = re.findall(r'<span class="num">(\d+)</span>', index_html)
    n = (max(int(x) for x in nums) + 1) if nums else 1
    return f"{n:02d}"


def update_index(index_html: str, article: dict, rel_path: str) -> str:
    card_num = next_card_number(index_html)
    new_card = (
        f'      <div class="article-card card-lift">\n'
        f'        <span class="num">{card_num}</span>\n'
        f'        <h3>{article["title"]}</h3>\n'
        f'        <p>{article["meta_description"]}</p>\n'
        f'        <a href="{rel_path}" style="color:var(--gold); font-weight:700; margin-top:4px;">اقرأ المقال الكامل</a>\n'
        f'      </div>'
    )

    start_marker = "<!-- AUTO_ARTICLES_START -->"
    end_marker = "<!-- AUTO_ARTICLES_END -->"
    start = index_html.index(start_marker) + len(start_marker)
    end = index_html.index(end_marker)
    existing_block = index_html[start:end]

    updated_block = f"\n{new_card}\n" + existing_block

    # Cap the number of visible cards to MAX_CARDS (drop the oldest ones).
    cards = re.findall(r'<div class="article-card card-lift">.*?</div>', updated_block, flags=re.DOTALL)
    if len(cards) > MAX_CARDS:
        cards = cards[:MAX_CARDS]
        updated_block = "\n      " + "\n      ".join(cards) + "\n    "

    return index_html[:start] + updated_block + index_html[end:]


def update_sitemap(sitemap_xml: str, rel_path: str, today: str) -> str:
    entry = (
        f"  <url>\n"
        f"    <loc>{SITE_URL}/{rel_path}</loc>\n"
        f"    <lastmod>{today}</lastmod>\n"
        f"    <changefreq>monthly</changefreq>\n"
        f"    <priority>0.7</priority>\n"
        f"  </url>\n"
    )
    return sitemap_xml.replace("</urlset>", entry + "</urlset>")


def main() -> int:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY environment variable is not set.", file=sys.stderr)
        return 1

    now = datetime.now(timezone.utc)
    today_iso = now.strftime("%Y-%m-%d")
    date_ar = arabic_date(now)

    log = load_log()
    previous_titles = [entry["title"] for entry in log]

    print("Calling Gemini API to generate today's article...")
    article = call_gemini(api_key, previous_titles)

    base_slug = slugify(article["title"])
    if base_slug == "article":
        base_slug = f"article-{today_iso}"
    slug = base_slug
    suffix = 1
    while os.path.exists(os.path.join(ARTICLES_DIR, f"{slug}.html")):
        suffix += 1
        slug = f"{base_slug}-{suffix}"

    filename = f"{slug}.html"
    rel_path = f"articles/{filename}"

    html = build_article_html(article, date_ar)
    os.makedirs(ARTICLES_DIR, exist_ok=True)
    with open(os.path.join(ARTICLES_DIR, filename), "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Wrote {rel_path}")

    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        index_html = f.read()
    index_html = update_index(index_html, article, rel_path)
    with open(INDEX_PATH, "w", encoding="utf-8") as f:
        f.write(index_html)
    print("Updated index.html")

    with open(SITEMAP_PATH, "r", encoding="utf-8") as f:
        sitemap_xml = f.read()
    sitemap_xml = update_sitemap(sitemap_xml, rel_path, today_iso)
    with open(SITEMAP_PATH, "w", encoding="utf-8") as f:
        f.write(sitemap_xml)
    print("Updated sitemap.xml")

    log.append(
        {
            "date": today_iso,
            "title": article["title"],
            "file": rel_path,
        }
    )
    save_log(log)
    print("Updated articles/log.json")

    # GitHub Actions step output, used by the workflow to write the commit message.
    gh_output = os.environ.get("GITHUB_OUTPUT")
    if gh_output:
        with open(gh_output, "a", encoding="utf-8") as f:
            f.write(f"title={article['title']}\n")

    return 0


if __name__ == "__main__":
    sys.exit(main())
