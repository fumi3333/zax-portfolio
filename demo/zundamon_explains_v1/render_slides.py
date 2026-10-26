import asyncio
import json
import os
import base64
from playwright.async_api import async_playwright
import sys

sys.stdout.reconfigure(encoding='utf-8')

WORK_DIR = r"C:\zax-portfolio\demo\zundamon_explains_v1"
META_PATH = os.path.join(WORK_DIR, "scenes_meta.json")
SLIDES_DIR = os.path.join(WORK_DIR, "slides")
os.makedirs(SLIDES_DIR, exist_ok=True)

with open(META_PATH, "r", encoding="utf-8") as f:
    scenes = json.load(f)

def get_b64(path):
    with open(path, "rb") as f:
        return f"data:image/png;base64,{base64.b64encode(f.read()).decode('utf-8')}"

metan_b64 = get_b64(r"C:\zax-portfolio\demo\metan_zundamon\metan.png")
zundamon_b64 = get_b64(r"C:\zax-portfolio\demo\metan_zundamon\zundamon.png")

def get_scene_visual_html(scene_id):
    if scene_id in ["scene_01", "scene_02"]:
        return """
        <div class="content-box">
          <div class="card-hero">
            <div class="badge-accent">全国1,959自治体・10,800件超集約</div>
            <h2 class="hero-title">全国公有地データベース / サウンディング横断検索</h2>
            <div class="metric-row">
              <div class="metric-box">
                <span class="m-title">巡回自治体数</span>
                <span class="m-num">1,959</span>
                <span class="m-desc">47都道府県・1,741市区町村・財務局</span>
              </div>
              <div class="metric-box">
                <span class="m-title">集約データ規模</span>
                <span class="m-num">10,800<small>件超</small></span>
                <span class="m-desc">都有地・市有地・廃校・対話公募</span>
              </div>
              <div class="metric-box green">
                <span class="m-title">更新頻度</span>
                <span class="m-num">毎朝自動</span>
                <span class="m-desc">新着差分を毎朝自動抽出</span>
              </div>
            </div>
          </div>
        </div>
        """
    elif scene_id in ["scene_03", "scene_04"]:
        return """
        <div class="content-box">
          <div class="problem-card">
            <div class="p-header">❌ 従来の土地探索における深刻な課題</div>
            <div class="p-grid">
              <div class="p-item">
                <span class="p-icon">📄</span>
                <div class="p-text">
                  <strong>自治体ごとに散在する公募PDF</strong>
                  <p>1,959サイトを1つずつ巡回して探す作業に膨大な時間と人件費がかかる</p>
                </div>
              </div>
              <div class="p-item">
                <span class="p-icon">⚠️</span>
                <div class="p-text">
                  <strong>サウンディング型官民対話の見落とし</strong>
                  <p>公募前の事前対話案件（市場調査）が目立たないページに埋もれてしまう</p>
                </div>
              </div>
              <div class="p-item">
                <span class="p-icon">⏳</span>
                <div class="p-text">
                  <strong>締切切れや形式のバラつき</strong>
                  <p>自治体ごとに元号・西暦・表組みが異なり、条件比較が極めて困難</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        """
    elif scene_id in ["scene_05", "scene_06"]:
        return """
        <div class="content-box">
          <div class="solution-card">
            <div class="s-header">✨ 全国一発横断検索で探索工数をゼロへ</div>
            <div class="features-grid">
              <div class="f-card">
                <span class="f-icon">🗺️</span>
                <h4>全国1,959自治体を毎朝自動巡回</h4>
                <p>各財務局・都道府県・市区町村の最新公示を完全自動で集約</p>
              </div>
              <div class="f-card">
                <span class="f-icon">🔍</span>
                <h4>敷地面積・用途地域で瞬時に絞り込み</h4>
                <p>10,000㎡超メガ用地や工業団地、廃校跡地を一発スクリーニング</p>
              </div>
              <div class="f-card">
                <span class="f-icon">📑</span>
                <h4>自治体公式募集要項PDFへ直結</h4>
                <p>中間業者を介さず、自治体原本の募集要項や調書へダイレクトジャンプ</p>
              </div>
            </div>
          </div>
        </div>
        """
    elif scene_id in ["scene_07", "scene_08"]:
        return """
        <div class="content-box">
          <div class="tech-card">
            <div class="t-header">🛡️ 止まらないデータ基盤の裏側（堅牢な防御設計）</div>
            <div class="tech-grid">
              <div class="t-item">
                <span class="t-badge green">DEFENSE 01</span>
                <h4>1ファイル20秒タイムアウト</h4>
                <p>数MBの巨大スキャン画像PDFでも、20秒で安全に切り離して巡回を継続</p>
              </div>
              <div class="t-item">
                <span class="t-badge blue">DEFENSE 02</span>
                <h4>前日比8%急減防止ブレーキ</h4>
                <p>パース異常でデータが減った場合、自動でコミットを止める安全装置を完備</p>
              </div>
              <div class="t-item">
                <span class="t-badge purple">AWARD 03</span>
                <h4>UDC2026 正式エントリー済</h4>
                <p>東大・国交省・デジタル庁共催の最重要オープンデータアワードに申請完了</p>
              </div>
            </div>
          </div>
        </div>
        """
    elif scene_id in ["scene_09", "scene_10"]:
        return """
        <div class="content-box">
          <div class="offer-card">
            <div class="o-header">🎁 ベータ版 試験利用（無料お試し）受付中！</div>
            <div class="o-content">
              <div class="o-box">
                <h3>ご希望の条件を教えてください</h3>
                <div class="o-pills">
                  <span>エリア（〇〇県、〇〇電力管内など）</span>
                  <span>敷地面積（〇〇㎡以上、メガ用地）</span>
                  <span>用途（再エネ、観光、開発など）</span>
                </div>
                <div class="arrow-down">⬇️</div>
                <div class="o-result">
                  合致する自治体公募原本PDFを検索・整理して、<strong>無償でお届けします！</strong>
                </div>
              </div>
              <div class="o-note">※初期費用・契約の強制は一切ありません。まずはお気軽にお試しください。</div>
            </div>
          </div>
        </div>
        """
    elif scene_id in ["scene_10b", "scene_10c"]:
        return """
        <div class="content-box">
          <div class="solution-card">
            <div class="s-header">🔄 利用者様と共に進化する継続改善</div>
            <div class="features-grid">
              <div class="f-card">
                <span class="f-icon">📈</span>
                <h4>毎朝のデータ精度チューニング</h4>
                <p>自治体サイトの更新や新形式PDFにも迅速に対応し、取得精度を日々強化</p>
              </div>
              <div class="f-card">
                <span class="f-icon">💡</span>
                <h4>ご要望に応じた機能拡張</h4>
                <p>「この地域の公募が欲しい」「面積区分を細かく」など現場の声で即時アップデート</p>
              </div>
              <div class="f-card">
                <span class="f-icon">🤝</span>
                <h4>二人三脚のパートナーシップ</h4>
                <p>完成して放置ではなく、実務で本当に使えるツールへと育て続けます</p>
              </div>
            </div>
          </div>
        </div>
        """
    elif scene_id in ["scene_11", "scene_12"]:
        return """
        <div class="content-box">
          <div class="cta-card">
            <div class="c-header">🌐 実演デモ画面を今すぐお試しいただけます</div>
            <div class="url-display">https://fumiproject.dev/haikou/demo/</div>
            <div class="c-grid">
              <div class="c-point">✅ 会員登録なしで実機デモを体験可能</div>
              <div class="c-point">✅ 四国めたん＆ずんだもんの解説動画も掲載</div>
              <div class="c-point">✅ 条件指定のPDF整理送付も受付中</div>
            </div>
            <div class="c-contact">お問い合わせ：zax-official@fumiproject.dev</div>
          </div>
        </div>
        """
    return ""

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <style>
    :root {{
      --primary: #16a34a;
      --bg: #091e3a;
      --surface: #0f274a;
      --surface-card: #153460;
      --border: #1e467d;
      --text: #ffffff;
      --text-muted: #94a3b8;
      --accent-green: #22c55e;
      --accent-yellow: #fbbf24;
      --accent-blue: #38bdf8;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      width: 1920px;
      height: 1080px;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Hiragino Sans", "Meiryo", sans-serif;
      background: linear-gradient(135deg, #091e3a 0%, #040d1a 100%);
      color: var(--text);
      position: relative;
    }}

    /* Global Header */
    header.top-bar {{
      width: 100%;
      height: 76px;
      background: rgba(15, 39, 74, 0.95);
      border-bottom: 2px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 60px;
    }}
    .site-brand {{
      display: flex;
      align-items: center;
      gap: 16px;
    }}
    .brand-logo {{
      background: #16a34a;
      color: #fff;
      padding: 6px 14px;
      border-radius: 8px;
      font-weight: 900;
      font-size: 18px;
      letter-spacing: 0.05em;
    }}
    .brand-title {{
      font-size: 24px;
      font-weight: 800;
      color: #f1f5f9;
    }}
    .brand-meta {{
      font-size: 15px;
      color: var(--text-muted);
      border-left: 2px solid var(--border);
      padding-left: 16px;
    }}
    .top-badge {{
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
      border: 1px solid rgba(34, 197, 94, 0.4);
      padding: 6px 18px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 800;
    }}

    /* Main Stage */
    main.stage {{
      width: 100%;
      height: calc(1080px - 76px - 210px);
      display: grid;
      grid-template-columns: 1140px 660px;
      padding: 30px 60px 10px 60px;
      gap: 40px;
      align-items: center;
    }}

    .left-col {{
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }}

    .scene-meta-header {{
      margin-bottom: 18px;
    }}
    .tag-pill {{
      display: inline-block;
      background: rgba(34, 197, 94, 0.2);
      color: #4ade80;
      border: 1px solid rgba(34, 197, 94, 0.4);
      font-size: 14px;
      font-weight: 800;
      padding: 4px 14px;
      border-radius: 6px;
      margin-bottom: 8px;
      letter-spacing: 0.05em;
    }}
    h1.scene-heading {{
      font-size: 38px;
      font-weight: 900;
      color: #ffffff;
      line-height: 1.25;
      margin-bottom: 6px;
    }}
    p.scene-subheading {{
      font-size: 20px;
      color: var(--accent-blue);
      font-weight: 600;
    }}

    /* Card Panels */
    .content-box {{
      width: 100%;
      height: 480px;
      background: rgba(15, 39, 74, 0.85);
      border: 2px solid var(--border);
      border-radius: 16px;
      padding: 24px 30px;
      box-shadow: 0 15px 35px rgba(0,0,0,0.5);
      display: flex;
      flex-direction: column;
      justify-content: center;
    }}

    .card-hero {{
      text-align: center;
    }}
    .badge-accent {{
      display: inline-block;
      background: #0284c7;
      color: #fff;
      font-weight: 800;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 15px;
      margin-bottom: 14px;
    }}
    .hero-title {{
      font-size: 32px;
      font-weight: 900;
      color: #ffffff;
      margin-bottom: 26px;
    }}
    .metric-row {{
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }}
    .metric-box {{
      background: var(--surface-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 18px;
      text-align: center;
    }}
    .metric-box.green {{
      border-color: rgba(34, 197, 94, 0.5);
      background: rgba(34, 197, 94, 0.1);
    }}
    .m-title {{
      display: block;
      font-size: 14px;
      font-weight: 700;
      color: var(--text-muted);
      margin-bottom: 6px;
    }}
    .m-num {{
      display: block;
      font-size: 38px;
      font-weight: 900;
      color: #ffffff;
      line-height: 1.1;
    }}
    .m-num small {{
      font-size: 20px;
      margin-left: 4px;
    }}
    .m-desc {{
      display: block;
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 8px;
    }}

    .problem-card .p-header, .solution-card .s-header, .tech-card .t-header, .offer-card .o-header, .cta-card .c-header {{
      font-size: 20px;
      font-weight: 800;
      margin-bottom: 20px;
      color: #38bdf8;
    }}
    .p-grid {{
      display: flex;
      flex-direction: column;
      gap: 14px;
    }}
    .p-item {{
      background: var(--surface-card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      gap: 16px;
    }}
    .p-icon {{ font-size: 28px; }}
    .p-text strong {{ font-size: 17px; color: #fff; display: block; margin-bottom: 4px; }}
    .p-text p {{ font-size: 14px; color: var(--text-muted); }}

    .features-grid {{
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }}
    .f-card {{
      background: var(--surface-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 18px;
      text-align: center;
    }}
    .f-icon {{ font-size: 34px; margin-bottom: 10px; display: block; }}
    .f-card h4 {{ font-size: 16px; color: #fff; margin-bottom: 8px; line-height: 1.3; }}
    .f-card p {{ font-size: 13px; color: var(--text-muted); line-height: 1.5; }}

    .tech-grid {{
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }}
    .t-item {{
      background: var(--surface-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 18px;
      text-align: center;
    }}
    .t-badge {{
      display: inline-block;
      font-size: 11px;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 4px;
      margin-bottom: 10px;
    }}
    .t-badge.green {{ background: #16a34a; color: #fff; }}
    .t-badge.blue {{ background: #0284c7; color: #fff; }}
    .t-badge.purple {{ background: #7c3aed; color: #fff; }}
    .t-item h4 {{ font-size: 16px; color: #fff; margin-bottom: 8px; }}
    .t-item p {{ font-size: 13px; color: var(--text-muted); line-height: 1.5; }}

    .o-box {{
      background: var(--surface-card);
      border: 2px solid #38bdf8;
      border-radius: 14px;
      padding: 20px 24px;
      text-align: center;
    }}
    .o-box h3 {{ font-size: 20px; color: #fff; margin-bottom: 14px; }}
    .o-pills {{ display: flex; justify-content: center; gap: 10px; margin-bottom: 12px; }}
    .o-pills span {{ background: #1e467d; padding: 6px 14px; border-radius: 20px; font-size: 13px; }}
    .arrow-down {{ font-size: 22px; margin: 8px 0; }}
    .o-result {{ font-size: 18px; color: #fbbf24; }}
    .o-note {{ font-size: 13px; color: var(--text-muted); text-align: center; margin-top: 14px; }}

    .cta-card {{ text-align: center; }}
    .url-display {{
      font-size: 26px;
      font-weight: 900;
      color: #38bdf8;
      background: #06152b;
      display: inline-block;
      padding: 12px 30px;
      border-radius: 12px;
      border: 1px solid #38bdf8;
      margin-bottom: 24px;
    }}
    .c-grid {{ display: flex; flex-direction: column; gap: 10px; align-items: center; margin-bottom: 20px; }}
    .c-point {{ font-size: 16px; font-weight: 700; color: #e2e8f0; }}
    .c-contact {{ font-size: 15px; color: var(--text-muted); }}

    /* Right Col - Characters */
    .right-col {{
      height: 100%;
      position: relative;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }}
    .char-container {{
      width: 100%;
      height: 540px;
      position: relative;
    }}
    .char-img {{
      position: absolute;
      bottom: 0;
      transition: all 0.3s ease;
      filter: drop-shadow(0 15px 30px rgba(0,0,0,0.7));
    }}
    .char-img.metan {{
      right: 30px;
      height: 510px;
    }}
    .char-img.zundamon {{
      left: 10px;
      height: 480px;
    }}
    .char-img.active {{
      transform: scale(1.05);
      filter: drop-shadow(0 0 25px rgba(34, 197, 94, 0.5));
      z-index: 10;
      opacity: 1.0;
    }}
    .char-img.inactive {{
      transform: scale(0.92);
      opacity: 0.45;
      z-index: 5;
      filter: grayscale(20%) brightness(0.7);
    }}

    /* Bottom Subtitle Bar */
    footer.subtitle-bar {{
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 200px;
      background: rgba(6, 18, 36, 0.96);
      border-top: 3px solid #22c55e;
      padding: 24px 60px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      box-shadow: 0 -10px 40px rgba(0,0,0,0.8);
    }}
    .sub-speaker {{
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }}
    .speaker-badge {{
      padding: 4px 18px;
      border-radius: 20px;
      font-size: 15px;
      font-weight: 900;
    }}
    .speaker-badge.zundamon {{
      background: #16a34a;
      color: #fff;
    }}
    .speaker-badge.metan {{
      background: #db2777;
      color: #fff;
    }}
    .speaker-role {{
      font-size: 14px;
      color: var(--text-muted);
      font-weight: 600;
    }}
    .sub-text {{
      font-size: 28px;
      font-weight: 800;
      line-height: 1.4;
      color: #ffffff;
      letter-spacing: -0.01em;
    }}
  </style>
</head>
<body>
  <header class="top-bar">
    <div class="site-brand">
      <div class="brand-logo">ZAX OFFICIAL</div>
      <div class="brand-title">全国公有地データベース / サウンディング横断検索</div>
      <div class="brand-meta">ずんだもん＆四国めたん 公式解説</div>
    </div>
    <div class="top-badge">全国1,959自治体 毎朝自動更新</div>
  </header>

  <main class="stage">
    <div class="left-col">
      <div class="scene-meta-header">
        <span class="tag-pill">{tag}</span>
        <h1 class="scene-heading">{title}</h1>
        <p class="scene-subheading">{subtitle}</p>
      </div>
      {visual_html}
    </div>

    <div class="right-col">
      <div class="char-container">
        <img src="{zundamon_b64}" class="char-img zundamon {zundamon_active}" alt="ずんだもん">
        <img src="{metan_b64}" class="char-img metan {metan_active}" alt="四国めたん">
      </div>
    </div>
  </main>

  <footer class="subtitle-bar">
    <div class="sub-speaker">
      <span class="speaker-badge {speaker}">{speaker_name}</span>
      <span class="speaker-role">{speaker_role}</span>
    </div>
    <div class="sub-text">{text}</div>
  </footer>
</body>
</html>
"""

async def render():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})

        for idx, sc in enumerate(scenes):
            scene_id = sc["id"]
            out_png = os.path.join(SLIDES_DIR, f"{scene_id}.png")

            speaker = sc["speaker"]
            speaker_name = "ずんだもん" if speaker == "zundamon" else "四国めたん"
            speaker_role = "解説担当なのだ！" if speaker == "zundamon" else "補足・サポート"
            zundamon_active = "active" if speaker == "zundamon" else "inactive"
            metan_active = "active" if speaker == "metan" else "inactive"

            visual_html = get_scene_visual_html(scene_id)

            rendered_html = HTML_TEMPLATE.format(
                tag=sc.get("tag", "EXPLAIN"),
                title=sc.get("title", ""),
                subtitle=sc.get("subtitle", ""),
                visual_html=visual_html,
                zundamon_b64=zundamon_b64,
                metan_b64=metan_b64,
                zundamon_active=zundamon_active,
                metan_active=metan_active,
                speaker=speaker,
                speaker_name=speaker_name,
                speaker_role=speaker_role,
                text=sc["text"]
            )

            await page.set_content(rendered_html)
            await page.wait_for_timeout(100)
            await page.screenshot(path=out_png)
            print(f"[{idx+1}/{len(scenes)}] Rendered slide: {scene_id}.png")

        await browser.close()

asyncio.run(render())
print("\nALL SLIDES RENDERED SUCCESSFULLY!")
