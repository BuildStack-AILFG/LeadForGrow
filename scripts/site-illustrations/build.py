"""LeadForGrow marketing illustrations — original artwork, no third-party images.

LeadForGrow is an omnichannel CRM, so the pictures keep coming back to one idea: leads from WhatsApp, Instagram, email,
calls, ads and the website land in one place, get qualified and move down one pipeline.
Run from the repo root: `python scripts/site-illustrations/build.py` -> public/images/site/**.svg
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from draw import CARD, FRONTEND, INK, LINE, MUTED, Svg, text_w  # noqa: E402

G = "#1D4B3E"        # brand (globals.css --brand)
G2 = "#2A7D66"       # accent
MINT = "#E6F4EE"
MINT2 = "#BAE0CF"
AMBER = "#D97706"
VIOLET = "#7C3AED"
BLUE = "#2563EB"
CORAL = "#E5484D"
THEME = {
    "bg1": "#F4FBF7", "bg2": "#D9EEE3", "glow": "#8FD5BC", "glow_op": 0.55, "dot": G, "dot_op": 0.07, "shadow_op": 0.13,
    "header": G, "avatar": G2, "wallpaper": "#F5F8F2", "wall_dot": G, "out": "#DCF5E7", "out_text": INK, "out_time": MUTED,
    "in": CARD, "link": G2, "frame": "#0F172A",
}

# channels — generic icons + the channel's name (no third-party logos)
CH = {
    "whatsapp": ("WhatsApp", "message-circle", "#1FA855"),
    "instagram": ("Instagram", "camera", "#D9468F"),
    "email": ("Email", "mail", BLUE),
    "calls": ("Calls", "phone", AMBER),
    "ads": ("Meta & Google Ads", "megaphone", VIOLET),
    "website": ("Website", "globe", "#0891B2"),
}

AI_W, AI_H = 896, 640
CAP_W, CAP_H = 800, 352


def new(w, h, glow=(0.8, 0.15)):
    s = Svg(w, h, THEME)
    s.background(glow)
    return s


def channel_tile(s, key, x, y, size=40, active=False):
    _, ic, col = CH[key]
    if active:
        s.rect(x, y, size, size, size * 0.3, col, shadow=True)
        s.icon(ic, x + size * 0.22, y + size * 0.22, size * 0.56, "#FFFFFF", 2.2)
    else:
        s.rect(x, y, size, size, size * 0.3, "#FFFFFF", LINE, 1.2)
        s.icon(ic, x + size * 0.22, y + size * 0.22, size * 0.56, col, 2)


def source_chip(s, key, x, y, size=12.5):
    label, ic, col = CH[key]
    return s.chip(x, y, label, "#FFFFFF", col, size, ic, stroke=col + "55")


def funnel(s, x, y, target, keys=("whatsapp", "instagram", "email", "calls", "ads", "website"), active="whatsapp", step=52, size=38):
    """Column of channel tiles with curves converging on `target` (x, y)."""
    tx, ty = target
    for i, k in enumerate(keys):
        cy = y + i * step + size / 2
        on = k == active
        s.path(f"M{x + size} {cy} C {x + size + 50} {cy}, {tx - 60} {ty}, {tx} {ty}", stroke=CH[k][2] if on else "#9CC7B5",
               sw=2.6 if on else 1.6, dash=None if on else "4 6", opacity=1 if on else 0.8)
    for i, k in enumerate(keys):
        channel_tile(s, k, x, y + i * step, size, k == active)


def stages(s, x, y, names, current, w=260, col=G2):
    n = len(names)
    gap = w / (n - 1)
    s.line(x, y, x + w, y, "#D5E6DD", 4)
    s.line(x, y, x + gap * current, y, col, 4)
    for i, name in enumerate(names):
        cx = x + i * gap
        done = i <= current
        s.circle(cx, y, 8 if i == current else 6, col if done else "#FFFFFF", None if done else "#C8DAD0", 2)
        s.text(cx, y + 24, name, 11.5, INK if i == current else MUTED, 700 if i == current else 500, "middle")


# ---- AI suite (896x640) -----------------------------------------------------------------------------------------------

def ai_copilot():
    s = new(AI_W, AI_H, (0.85, 0.1))
    top = s.window(40, 60, 816, 520, "Inbox  ·  Ritika Jain")
    s.rect(40, top, 250, 484, 0, "#F7FAF8")
    s.text(60, top + 30, "Knowledge base", 14, INK, 800)
    docs = [("file-text", "Price list 2026.pdf", CORAL), ("file-spreadsheet", "Course catalog.xlsx", "#16A34A"),
            ("circle-help", "FAQs · 42 answers", BLUE), ("file-text", "Refund policy.docx", BLUE)]
    for i, (ic, n, c) in enumerate(docs):
        y = top + 50 + i * 54
        s.rect(56, y, 218, 44, 10, "#FFFFFF", LINE)
        s.icon(ic, 68, y + 11, 22, c)
        s.text(100, y + 27, n, 13, INK, 600)
    s.chip(56, top + 280, "Trained · synced 2 min ago", MINT, G, 12, "check")
    # conversation
    s.rect(290, top, 566, 484, 0, "#F5F8F2")
    source_chip(s, "instagram", 310, top + 16)
    y = s.bubble(314, top + 60, ["Is the weekend batch still open?", "And can I pay in instalments?"], "in", 15.5, time="7:42 PM")
    s.rect(310, y + 22, 526, 210, 14, "#F5F0FF", "#DDD0FB", 1.5)
    s.icon_badge("sparkles", 336, y + 50, 15, VIOLET, shadow=False)
    s.text(360, y + 55, "AI suggested reply", 14, VIOLET, 800)
    s.text(684, y + 55, "from Price list 2026.pdf", 11.5, MUTED, anchor="middle")
    for i, l in enumerate(["Hi Ritika! Yes, the Saturday–Sunday batch has 6 seats", "left. Fees are ₹24,000 — you can pay in 3 instalments", "of ₹8,000. Shall I reserve a seat for you?"]):
        s.text(330, y + 88 + i * 24, l, 14.5, INK)
    s.chip(330, y + 168, "Send", G, "#FFFFFF", 13, "send")
    s.chip(410, y + 168, "Edit", "#FFFFFF", INK, 13, "pencil", stroke=LINE)
    s.chip(490, y + 168, "Shorter", "#FFFFFF", INK, 13, "wand-sparkles", stroke=LINE)
    return s


def ai_chatbot():
    s = new(AI_W, AI_H, (0.2, 0.15))
    funnel(s, 70, 150, (300, 330), keys=("whatsapp", "instagram", "website", "email"), active="website", step=72, size=46)
    y = s.phone(320, 40, 320, 560, "Brightway Clinic", "AI assistant · website chat", ("BC", G2))
    y = s.bubble(626, y, ["Do you do laser hair removal?", "What does it cost?"], "out", 15, time="10:02")
    y = s.bubble(334, y + 14, ["Yes! 6 sessions start at ₹14,999 ✨", "First consultation is free.", "Want me to book one?"], "in", 15,
                 buttons=[("calendar-check", "Book free consult"), ("indian-rupee", "See all prices")], time="10:02")
    y = s.bubble(626, y + 14, ["Book free consult"], "out", 15, time="10:03")
    s.bubble(334, y + 14, ["Booked ✅ Thu, 11 AM. Your lead", "is with Dr. Rao's team."], "in", 15, time="10:03")
    s.end_phone()
    s.card(666, 130, 200, 96)
    s.icon_badge("bot", 700, 178, 20, VIOLET, shadow=False)
    s.text(730, 170, "AI agent", 15, INK, 700)
    s.text(730, 192, "same brain on", 12.5, MUTED)
    s.text(730, 208, "every channel", 12.5, MUTED)
    s.card(666, 420, 200, 100)
    s.text(686, 452, "Lead created", 13, MUTED, 600)
    s.text(686, 482, "Hot · ₹15k", 20, G, 800)
    s.text(686, 504, "source: Website", 12, MUTED)
    return s


def ai_forms():
    s = new(AI_W, AI_H, (0.8, 0.85))
    funnel(s, 60, 120, (240, 330), keys=("website", "whatsapp", "instagram", "ads"), active="ads", step=80, size=48)
    fx, fy = 250, 70
    s.card(fx, fy, 320, 500, 18)
    s.text(fx + 24, fy + 42, "Get a free quote", 20, INK, 800)
    s.text(fx + 24, fy + 66, "Instant form · Meta lead ad", 12.5, MUTED)
    for i, (label, val) in enumerate([("Full name", "Arjun Mehta"), ("Phone", "+91 98200 4XX51"), ("City", "Pune"), ("Budget", "₹50k – ₹1L")]):
        yy = fy + 96 + i * 76
        s.text(fx + 24, yy, label, 12.5, MUTED, 600)
        s.rect(fx + 24, yy + 10, 272, 40, 10, "#F5F8F2", LINE)
        s.text(fx + 38, yy + 36, val, 14.5, INK)
    s.rect(fx + 24, fy + 420, 272, 46, 23, G)
    s.text(fx + 160, fy + 449, "Submit", 15, "#FFFFFF", 700, "middle")
    s.path(f"M{fx + 320} 320 C 620 320, 600 230, 630 230", stroke=G2, sw=2.5, dash="6 7")
    x, y0 = 610, 130
    s.card(x, y0, 260, 330)
    s.icon_badge("user-plus", x + 34, y0 + 36, 17, G, shadow=False)
    s.text(x + 60, y0 + 32, "New lead", 16, INK, 800)
    s.text(x + 60, y0 + 52, "in 0.4 sec", 12.5, MUTED)
    rows = [("Name", "Arjun Mehta"), ("Source", "Meta Ads"), ("Campaign", "Diwali leads"), ("Score", "82 · Hot"), ("Owner", "Priya (auto)")]
    for i, (k, v) in enumerate(rows):
        yy = y0 + 96 + i * 34
        s.text(x + 20, yy, k, 12.5, MUTED, 600)
        s.text(x + 110, yy, v, 13.5, INK, 700)
    s.chip(x + 20, y0 + 272, "WhatsApp welcome sent", MINT, G, 12, "check")
    return s


def ai_intent():
    s = new(AI_W, AI_H, (0.5, 0.5))
    msgs = [("email", "Can you send the invoice for March again?"), ("instagram", "do u deliver to Nagpur?? 🙏"),
            ("whatsapp", "I want to cancel my booking")]
    for i, (k, m) in enumerate(msgs):
        y = 60 + i * 96
        s.card(50, y, 380, 76)
        channel_tile(s, k, 66, y + 18, 40, True)
        s.text(120, y + 32, CH[k][0], 12.5, MUTED, 700)
        s.text(120, y + 54, m, 14, INK, 500)
        s.path(f"M430 {y + 38} C 480 {y + 38}, 470 330, 500 330", stroke=CH[k][2], sw=2, dash="5 6")
    s.card(500, 250, 350, 170)
    s.icon_badge("brain", 534, 290, 18, VIOLET, shadow=False)
    s.text(564, 286, "AI reads the intent", 16, INK, 800)
    s.text(564, 306, "on every channel, no keywords", 12.5, MUTED)
    x = 524
    for t, c in (("Invoice", BLUE), ("Delivery area", "#D9468F"), ("Cancellation", CORAL)):
        x += s.chip(x, 330, t, "#FFFFFF", c, 12.5, stroke=c + "66") + 8
    s.chip(524, 372, "Routes each to the right flow", MINT, G, 12.5, "workflow")
    s.card(120, 400, 330, 190)
    s.text(140, 432, "Cancellation flow started", 15, INK, 800)
    for i, (ic, t) in enumerate([("message-circle", "Asks the reason"), ("ticket-percent", "Offers to reschedule"), ("user-round", "Alerts the owner")]):
        yy = 456 + i * 40
        s.rect(140, yy, 290, 32, 8, "#F5F8F2")
        s.icon(ic, 150, yy + 7, 18, G2)
        s.text(178, yy + 21, t, 13.5, INK, 600)
    s.path("M520 420 C 500 470, 470 480, 450 490", stroke=G2, sw=2.5, dash="6 7")
    return s


def ai_templates():
    s = new(AI_W, AI_H, (0.1, 0.1))
    top = s.window(40, 50, 816, 540, "Templates")
    tx = 64
    for i, t in enumerate(["All", "WhatsApp", "Email", "SMS"]):
        tx += s.chip(tx, top + 18, t, G if i == 0 else "#F1F5F2", "#FFFFFF" if i == 0 else MUTED, 13) + 10
    s.chip(690, top + 16, "Write with AI", "#F5F0FF", VIOLET, 13, "sparkles")
    cards = [
        ("whatsapp", "Festive offer", ["Hi {{name}}! Our Diwali offer", "is live — 20% off till Sunday.", "Reply YES to book."], "Approved"),
        ("email", "Monthly newsletter", ["Subject: What's new in", "October 🎉", "3 updates your team will love…"], "Ready"),
        ("whatsapp", "Payment reminder", ["Hi {{name}}, invoice #{{no}}", "of ₹{{amount}} is due on", "{{date}}. Pay here: {{link}}"], "Approved"),
    ]
    for i, (k, name, lines, status) in enumerate(cards):
        x, y = 64 + i * 262, top + 74
        label, ic, col = CH[k]
        s.rect(x, y, 244, 420, 14, "#FAFCFB", LINE)
        s.rect(x + 14, y + 14, 216, 110, 10, col, opacity=0.13)
        s.icon_badge(ic, x + 122, y + 69, 28, col, shadow=False)
        s.text(x + 16, y + 156, name, 16, INK, 800)
        s.chip(x + 16, y + 170, label, "#FFFFFF", col, 12, stroke=col + "55")
        s.chip(x + 130, y + 170, status, MINT, G, 12, "check")
        for j, l in enumerate(lines):
            s.text(x + 16, y + 232 + j * 22, l, 13.5, INK)
        s.rect(x + 16, y + 360, 212, 38, 19, G)
        s.text(x + 122, y + 384, "Use template", 13.5, "#FFFFFF", 700, "middle")
    return s


# ---- capability / hub / release cards (800x352) ----------------------------------------------------------------------

def cap_ai_agent():
    s = new(CAP_W, CAP_H, (0.15, 0.2))
    funnel(s, 40, 40, (230, 176), keys=("whatsapp", "instagram", "email", "website"), active="instagram", step=72, size=42)
    s.card(240, 40, 300, 272)
    source_chip(s, "instagram", 258, 56)
    y = s.bubble(520, 100, ["Need a 2BHK under ₹60L", "near Whitefield"], "out", 15)
    s.icon_badge("bot", 274, y + 30, 16, VIOLET, shadow=False)
    s.rect(296, y + 12, 226, 96, 10, "#F5F0FF")
    s.text(310, y + 38, "3 matches found 🏡", 14, INK, 700)
    s.text(310, y + 60, "Palm Grove · ₹54L", 13, INK)
    s.text(310, y + 80, "Green Vista · ₹58L", 13, INK)
    s.text(310, y + 100, "Book a site visit?", 13, G2, 700)
    s.card(564, 70, 200, 210)
    s.text(582, 100, "AI qualified", 15, INK, 800)
    for i, (k, v) in enumerate([("Budget", "₹60L"), ("Area", "Whitefield"), ("Timeline", "3 months"), ("Score", "Hot 🔥")]):
        s.text(582, 132 + i * 26, k, 12.5, MUTED, 600)
        s.text(670, 132 + i * 26, v, 13, INK, 700)
    s.chip(582, 236, "Assigned to Priya", MINT, G, 12, "user-round")
    return s


def cap_flow_builder():
    s = new(CAP_W, CAP_H, (0.5, 0.0))
    nodes = [(30, 140, "New lead", "user-plus", G2, "From any channel"), (210, 50, "WhatsApp", "message-circle", "#1FA855", "Welcome message"),
             (210, 230, "Email", "mail", BLUE, "Brochure + offer"), (400, 140, "Wait 1 day", "clock", "#64748B", "No reply?"),
             (590, 50, "Call task", "phone", AMBER, "Assign to sales"), (590, 230, "Move deal", "kanban", VIOLET, "Stage: Follow-up")]
    pos = {n[2]: (n[0], n[1]) for n in nodes}

    def link(a, b):
        (ax, ay), (bx, by) = pos[a], pos[b]
        x1, y1, x2, y2 = ax + 170, ay + 36, bx, by + 36
        mx = (x1 + x2) / 2
        s.path(f"M{x1} {y1} C {mx} {y1}, {mx} {y2}, {x2} {y2}", stroke=G2, sw=2.4)
        s.circle(x2, y2, 4.5, G2)
    for a, b in [("New lead", "WhatsApp"), ("New lead", "Email"), ("WhatsApp", "Wait 1 day"), ("Email", "Wait 1 day"),
                 ("Wait 1 day", "Call task"), ("Wait 1 day", "Move deal")]:
        link(a, b)
    for x, y, t, ic, c, sub in nodes:
        s.card(x, y, 170, 72, 12)
        s.rect(x, y, 5, 72, 2, c)
        s.icon_badge(ic, x + 28, y + 26, 13, c, shadow=False)
        s.text(x + 48, y + 31, t, 13.5, INK, 800)
        s.text(x + 16, y + 58, sub, 12, MUTED)
    s.chip(30, 304, "No-code · WhatsApp, email & CRM in one flow", "#FFFFFF", G, 12.5, "workflow", stroke=LINE)
    return s


def cap_maximize_leads():
    s = new(CAP_W, CAP_H, (0.9, 0.2))
    keys = ("ads", "website", "instagram", "whatsapp", "calls")
    counts = ["412", "268", "195", "340", "86"]
    for i, k in enumerate(keys):
        y = 30 + i * 60
        s.card(30, y, 230, 48, 12)
        channel_tile(s, k, 40, y + 7, 34, True)
        s.text(86, y + 30, CH[k][0].split(" ")[0], 14, INK, 700)
        s.text(244, y + 30, counts[i], 15, G, 800, "end")
        s.path(f"M260 {y + 24} C 310 {y + 24}, 300 176, 340 176", stroke=CH[k][2], sw=2, opacity=0.8)
    s.card(340, 40, 420, 272)
    s.text(362, 74, "Lead funnel · this month", 15, INK, 800)
    bars = [("Captured", 1301, "#8FD5BC"), ("Qualified", 742, "#5FB898"), ("Demo / visit", 318, G2), ("Won", 129, G)]
    for i, (n, v, c) in enumerate(bars):
        y = 96 + i * 46
        s.text(362, y + 22, n, 13.5, INK, 700)
        s.rect(470, y + 6, 270, 24, 8, "#E5EFEA")
        s.rect(470, y + 6, max(270 * v / 1301, 14), 24, 8, c)
        s.text(740, y + 23, f"{v:,}", 13, INK, 800, "end")
    s.chip(362, 296 - 6, "Speed-to-lead: 38 sec", MINT, G, 12, "zap")
    return s


def cap_instagram():
    s = new(CAP_W, CAP_H, (0.15, 0.85))
    s.card(40, 30, 240, 292, 14)
    g = s.uid("ig")
    s.defs.append(f'<linearGradient id="{g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F9A8D4"/><stop offset="1" stop-color="#D9468F"/></linearGradient>')
    s.rect(40, 70, 240, 120, 0, f"url(#{g})")
    s.icon("sparkles", 132, 102, 56, "#FFFFFF", 1.6)
    s.avatar(62, 50, 11, "U", "#D9468F")
    s.text(80, 55, "urban.glow", 12.5, INK, 700)
    for i, ic in enumerate(("heart", "message-circle", "send")):
        s.icon(ic, 54 + i * 28, 200, 19, INK)
    for i, (w, t) in enumerate([("ananya", "price? 😍"), ("rohan", "link pls")]):
        y = 248 + i * 30
        s.avatar(62, y, 10, w[0].upper(), ["#F59E0B", "#6366F1"][i])
        s.text(78, y + 4, w, 12, INK, 700)
        s.text(78 + text_w(w, 12, 700) + 6, y + 4, t, 12, INK)
    s.path("M280 250 C 330 250, 320 120, 360 120", stroke="#D9468F", sw=2.4, dash="6 7")
    s.card(360, 40, 220, 200)
    source_chip(s, "instagram", 374, 54, 12)
    s.bubble(380, 96, ["Hi Ananya! It's ₹649 💖", "Here's 10% off for you:"], "in", 13, buttons=[("shopping-bag", "Shop now")], fill="#FDF0F6")
    s.path("M580 140 C 620 140, 600 200, 620 210", stroke=G2, sw=2.4, dash="6 7")
    s.card(600, 170, 170, 150)
    s.text(616, 198, "Saved to CRM", 14, INK, 800)
    s.text(616, 222, "Ananya · lead", 12.5, MUTED)
    s.chip(616, 236, "instagram-comment", MINT, G, 11)
    s.chip(616, 272, "Follow-up: tomorrow", "#FFF7E6", AMBER, 11, "clock")
    return s


def cap_inbox():
    s = new(CAP_W, CAP_H, (0.1, 0.9))
    top = s.window(30, 24, 740, 304, "Unified inbox")
    s.rect(30, top, 260, 268, 0, "#F7FAF8")
    x = 42
    for t, n, on in (("Needs reply", 7, True), ("Mine", 3, False), ("All", 0, False)):
        x += s.chip(x, top + 10, f"{t} {n}" if n else t, G if on else "#FFFFFF", "#FFFFFF" if on else MUTED, 11.5, stroke=None if on else LINE) + 6
    convs = [("whatsapp", "Rohit K", "Is COD available?"), ("instagram", "Meera S", "do u ship to Pune?"),
             ("email", "Kabir J", "Re: Quote for 50 units"), ("calls", "Sana P", "Missed call · 2 min ago")]
    for i, (k, n, m) in enumerate(convs):
        y = top + 50 + i * 54
        if i == 0:
            s.rect(38, y - 4, 244, 50, 10, MINT)
        channel_tile(s, k, 46, y + 2, 34, True)
        s.text(90, y + 16, n, 13.5, INK, 700)
        s.text(90, y + 35, m, 12, MUTED)
    s.text(310, top + 30, "Rohit K", 16, INK, 800)
    source_chip(s, "whatsapp", 386, top + 12, 11.5)
    s.chip(512, top + 12, "Assigned · Priya", "#F5F0FF", VIOLET, 11.5, "user-round")
    s.rect(300, top + 50, 470, 218, 0, "#F5F8F2")
    s.bubble(316, top + 64, ["Is COD available for Pune?"], "in", 14)
    s.bubble(754, top + 112, ["Yes! COD works across", "Pune 🚚"], "out", 14, time="4:12")
    s.rect(316, top + 190, 330, 50, 10, "#FFF7E6", "#F5D08A")
    s.icon("sticky-note", 328, top + 202, 16, AMBER)
    s.text(352, top + 214, "Note: repeat buyer — offer free", 12.5, "#7A4A0A", 600)
    s.text(352, top + 231, "shipping on orders over ₹999", 12.5, "#7A4A0A", 600)
    return s


def cap_pipeline():
    s = new(CAP_W, CAP_H, (0.85, 0.15))
    cols = [("New", ["whatsapp", "ads", "website"]), ("Qualified", ["instagram", "calls"]), ("Proposal", ["email", "whatsapp"]), ("Won", ["ads"])]
    names = iter(["Arjun · ₹45k", "Neha · ₹1.2L", "Kiran · ₹30k", "Dev · ₹80k", "Isha · ₹2L", "Om · ₹65k", "Ria · ₹50k", "Sam · ₹90k"])
    for i, (title, ks) in enumerate(cols):
        x = 30 + i * 186
        s.rect(x, 24, 176, 304, 14, "#FFFFFF", opacity=0.55)
        s.text(x + 16, 52, title, 14, INK, 800)
        s.text(x + 160, 52, str(len(ks)), 13, MUTED, 700, "end")
        for j, k in enumerate(ks):
            y = 68 + j * 82
            hl = (i == 1 and j == 0)
            s.rect(x + 10, y, 156, 70, 10, CARD, G2 if hl else None, 2.5 if hl else 1, shadow=True)
            nm = next(names)
            s.text(x + 24, y + 26, nm, 13, INK, 700)
            channel_tile(s, k, x + 22, y + 36, 24, False)
            s.text(x + 54, y + 53, CH[k][0].split(" ")[0], 11.5, MUTED, 600)
            if hl:
                s.chip(x + 100, y + 10, "Call 4pm", "#FFF7E6", AMBER, 10.5)
    return s


def cap_broadcast():
    s = new(CAP_W, CAP_H, (0.9, 0.2))
    s.card(30, 30, 330, 292)
    s.text(50, 62, "Campaign · Diwali offer", 16, INK, 800)
    s.text(50, 84, "1,725 contacts · segment: hot leads", 12.5, MUTED)
    for i, (k, sent, read) in enumerate((("whatsapp", "1,240", 0.91), ("email", "1,725", 0.46), ("instagram", "380", 0.72))):
        y = 108 + i * 64
        channel_tile(s, k, 50, y, 40, True)
        s.text(102, y + 17, f"{CH[k][0]} · {sent} sent", 13.5, INK, 700)
        s.rect(102, y + 28, 200, 8, 4, "#E5EFEA")
        s.rect(102, y + 28, 200 * read, 8, 4, CH[k][2])
        s.text(340, y + 36, f"{int(read * 100)}%", 12.5, MUTED, 700, "end")
    s.chip(50, 292, "Schedule · Fri 10:00 AM", MINT, G, 12, "calendar-clock")
    pts = [(470, 70), (580, 52), (690, 86), (440, 180), (560, 160), (680, 200), (520, 280), (640, 290), (740, 270)]
    cols = ["#1FA855", BLUE, "#D9468F"]
    for x, y in pts:
        s.path(f"M360 170 Q {(360 + x) / 2} {y - 40}, {x} {y}", stroke=G2, sw=1.4, dash="4 6", opacity=0.55)
    for i, (x, y) in enumerate(pts):
        s.avatar(x, y, 21, "ABCDEFGHJ"[i] + "KLMNPRSTV"[i], [G2, VIOLET, AMBER, BLUE, CORAL][i % 5])
        s.circle(x + 16, y + 16, 9, cols[i % 3])
        s.icon(["message-circle", "mail", "camera"][i % 3], x + 10, y + 10, 12, "#FFFFFF", 2.4)
    return s


def cap_payments_meetings():
    s = new(CAP_W, CAP_H, (0.85, 0.85))
    s.card(30, 30, 300, 292)
    s.text(50, 62, "Invoice #INV-2041", 16, INK, 800)
    s.chip(230, 46, "Due 5 Nov", "#FFF7E6", AMBER, 11.5)
    for i, (n, p) in enumerate((("Growth plan · 12 mo", "₹23,880"), ("Onboarding", "₹4,999"), ("GST 18%", "₹5,198"))):
        y = 96 + i * 34
        s.text(50, y, n, 13.5, INK)
        s.text(310, y, p, 13.5, INK, 700, "end")
    s.line(50, 196, 310, 196, LINE, 1.2)
    s.text(50, 226, "Total", 14, MUTED, 700)
    s.text(310, 228, "₹34,077", 22, G, 800, "end")
    s.rect(50, 252, 260, 44, 22, G)
    s.text(180, 280, "Send payment link", 14, "#FFFFFF", 700, "middle")
    s.card(360, 30, 410, 180)
    s.text(380, 62, "Meetings · Thursday", 15, INK, 800)
    for i, (t, who, c) in enumerate((("11:00", "Demo · Arjun Mehta", G2), ("14:30", "Proposal call · Neha", VIOLET), ("17:00", "Site visit · Om", AMBER))):
        y = 80 + i * 40
        s.rect(380, y, 370, 32, 8, "#F5F8F2")
        s.rect(380, y, 4, 32, 2, c)
        s.text(394, y + 21, t, 13, MUTED, 700)
        s.text(446, y + 21, who, 13.5, INK, 700)
    s.card(360, 230, 410, 92)
    s.icon_badge("circle-check", 398, 276, 20, "#16A34A", shadow=False)
    s.text(430, 270, "₹34,077 received via UPI", 15, INK, 800)
    s.text(430, 292, "Deal moved to Won · receipt sent on WhatsApp", 12.5, MUTED)
    return s


def cap_analytics():
    s = new(CAP_W, CAP_H, (0.2, 0.9))
    tiles = [("Leads", "1,301", G2), ("Reply time", "38 sec", AMBER), ("Won", "₹18.4L", VIOLET)]
    for i, (k, v, c) in enumerate(tiles):
        x = 30 + i * 170
        s.card(x, 24, 156, 92)
        s.text(x + 16, 54, k, 12.5, MUTED, 600)
        s.text(x + 16, 94, v, 26, c, 800)
    s.card(30, 132, 496, 196)
    s.text(50, 162, "Leads by source", 14, INK, 800)
    data = [("ads", 412), ("whatsapp", 340), ("website", 268), ("instagram", 195), ("calls", 86)]
    for i, (k, v) in enumerate(data):
        y = 180 + i * 28
        s.text(50, y + 15, CH[k][0].split(" ")[0], 12.5, INK, 600)
        s.rect(150, y + 4, 300 * v / 412, 16, 5, CH[k][2])
        s.text(150 + 300 * v / 412 + 8, y + 17, str(v), 12, MUTED, 700)
    s.card(546, 24, 224, 304)
    s.text(564, 54, "Team", 14, INK, 800)
    for i, (n, sc, c) in enumerate((("Priya", 0.92, G2), ("Arjun", 0.78, VIOLET), ("Neha", 0.64, AMBER), ("Kabir", 0.5, BLUE))):
        y = 78 + i * 60
        s.avatar(576, y + 16, 15, n[:2].upper(), c)
        s.text(600, y + 14, n, 13, INK, 700)
        s.text(752, y + 14, f"{int(sc * 40)} won", 11.5, MUTED, 600, "end")
        s.rect(600, y + 24, 152, 7, 3.5, "#E5EFEA")
        s.rect(600, y + 24, 152 * sc, 7, 3.5, c)
    return s


def hub_marketing():
    s = new(CAP_W, CAP_H, (0.85, 0.15))
    s.card(30, 30, 360, 292)
    s.text(50, 62, "Segment · hot leads, Pune", 15, INK, 800)
    x = 50
    for t in ("score > 70", "city = Pune", "no reply 3d"):
        x += s.chip(x, 76, t, MINT, G, 11.5) + 6
    s.text(50, 140, "1,725", 34, G, 800)
    s.text(50, 164, "contacts match", 13, MUTED)
    for i, k in enumerate(("whatsapp", "email", "instagram", "ads")):
        channel_tile(s, k, 50 + i * 54, 190, 42, i < 2)
    s.text(50, 262, "Send on WhatsApp + Email, retarget", 12.5, MUTED)
    s.text(50, 280, "the rest with Meta Ads audiences", 12.5, MUTED)
    s.card(420, 30, 350, 292)
    s.text(440, 62, "Campaign results", 15, INK, 800)
    for i, (k, v, c) in enumerate((("Delivered", "1,688", G2), ("Read", "1,402", BLUE), ("Clicked", "611", VIOLET), ("Booked", "143", AMBER))):
        y = 84 + i * 56
        s.text(440, y + 18, k, 13, MUTED, 600)
        s.text(750, y + 20, v, 18, INK, 800, "end")
        s.rect(440, y + 30, 310, 8, 4, "#E5EFEA")
        s.rect(440, y + 30, 310 * [0.98, 0.83, 0.36, 0.09][i] + 2, 8, 4, c)
    return s


def hub_support():
    s = new(CAP_W, CAP_H, (0.1, 0.2))
    y = s.phone(50, 24, 280, 304, "Support", "replies in ~2 min", ("LF", G2))
    y = s.bubble(316, y, ["My order arrived damaged 😟"], "out", 14, time="9:41")
    y = s.bubble(64, y + 12, ["So sorry, Aditi! A free", "replacement ships today."], "in", 14, time="9:42")
    s.bubble(316, y + 12, ["Thank you so much! 🙏"], "out", 14, time="9:43")
    s.end_phone()
    stats = [("timer", "First response", "< 2 min", G2), ("ticket-check", "Resolved today", "128 · all channels", "#16A34A"), ("star", "CSAT", "4.8 / 5", AMBER)]
    for i, (ic, k, v, c) in enumerate(stats):
        y = 32 + i * 98
        s.card(380, y, 390, 82)
        s.icon_badge(ic, 420, y + 41, 20, c, shadow=False)
        s.text(454, y + 34, k, 13, MUTED, 600)
        s.text(454, y + 62, v, 21, INK, 800)
    return s


def hub_sales():
    s = new(CAP_W, CAP_H, (0.85, 0.85))
    s.card(30, 30, 340, 292)
    s.avatar(74, 76, 26, "NV", VIOLET)
    s.text(112, 70, "Nikhil Verma", 18, INK, 800)
    s.text(112, 92, "Nest Realty · Pune", 12.5, MUTED)
    x = 50
    for k in ("ads", "whatsapp", "email"):
        x += source_chip(s, k, x, 116, 11) + 6
    s.text(50, 176, "Timeline", 13, MUTED, 700)
    events = [("megaphone", "Came from a Meta ad", "Mon"), ("message-circle", "Chatted on WhatsApp", "Mon"), ("phone", "Call · 6 min", "Tue"), ("mail", "Proposal opened ×3", "Wed")]
    for i, (ic, t, d) in enumerate(events):
        y = 194 + i * 30
        s.icon(ic, 50, y, 16, G2)
        s.text(76, y + 13, t, 13, INK, 600)
        s.text(350, y + 13, d, 12, MUTED, anchor="end")
    s.card(396, 30, 374, 292)
    s.text(416, 62, "Deal · ₹2,40,000", 16, INK, 800)
    s.chip(640, 46, "82% likely", MINT, G, 12)
    stages(s, 430, 112, ["New", "Qualified", "Proposal", "Won"], 2, 300)
    s.text(416, 186, "Next step", 13, MUTED, 700)
    s.rect(416, 198, 334, 46, 10, "#FFF7E6")
    s.icon("calendar-check", 428, 211, 20, AMBER)
    s.text(458, 226, "Negotiation call · Thu 4 PM", 14, INK, 700)
    s.chip(416, 264, "Owner: Priya", "#F5F0FF", VIOLET, 12, "user-round")
    s.chip(540, 264, "Reminder on WhatsApp", MINT, G, 12, "bell")
    return s


def release_email_builder():
    s = new(800, 450, (0.85, 0.1))
    top = s.window(30, 30, 740, 390, "Email builder")
    s.rect(30, top, 170, 354, 0, "#F7FAF8")
    for i, (ic, t) in enumerate((("heading", "Heading"), ("image", "Image"), ("type", "Text"), ("square-mouse-pointer", "Button"), ("columns-2", "Columns"), ("share-2", "Social"))):
        y = top + 16 + i * 52
        s.rect(44, y, 142, 42, 10, "#FFFFFF", LINE)
        s.icon(ic, 56, y + 11, 20, G2)
        s.text(86, y + 26, t, 13, INK, 600)
    x0, w = 240, 380
    s.rect(x0, top + 16, w, 330, 10, "#FFFFFF", LINE)
    g = s.uid("hero")
    s.defs.append(f'<linearGradient id="{g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F59E0B"/><stop offset="1" stop-color="#E5484D"/></linearGradient>')
    s.rect(x0 + 16, top + 32, w - 32, 110, 8, f"url(#{g})")
    s.text(x0 + 36, top + 82, "Diwali Sale ✨", 24, "#FFFFFF", 900)
    s.text(x0 + 36, top + 114, "Up to 40% off this week", 16, "#FFF4D6", 700)
    s.skeleton(x0 + 16, top + 162, [340, 300, 320], 9, 18, "#E5EFEA")
    s.rect(x0 + 120, top + 228, 140, 40, 20, G)
    s.text(x0 + 190, top + 253, "Shop now", 14, "#FFFFFF", 700, "middle")
    for i in range(4):
        s.circle(x0 + 150 + i * 28, top + 300, 9, "#D5E6DD")
    s.rect(640, top + 16, 116, 120, 10, "#F5F0FF", "#DDD0FB")
    s.icon("sparkles", 652, top + 28, 18, VIOLET)
    s.text(652, top + 66, "Paste from", 12, MUTED, 600)
    s.text(652, top + 84, "Canva or", 12, MUTED, 600)
    s.text(652, top + 102, "Mailchimp", 12, MUTED, 600)
    s.rect(640, top + 150, 116, 40, 20, G)
    s.text(698, top + 175, "Send test", 13, "#FFFFFF", 700, "middle")
    return s


def release_revenue_leak():
    s = new(800, 450, (0.15, 0.2))
    s.card(40, 40, 720, 370)
    s.text(64, 80, "Leads slipping right now", 19, INK, 800)
    s.chip(600, 60, "₹3.8L at risk", "#FDECEC", CORAL, 13, "triangle-alert")
    rows = [("whatsapp", "Rohit K", "Waiting for a reply · 2 h", "Reply"), ("instagram", "Meera S", "No follow-up in 4 days", "Follow up"),
            ("calls", "Kabir J", "Callback was due yesterday", "Call now"), ("email", "Sana P", "Proposal opened, no next step", "Add task")]
    for i, (k, n, why, act) in enumerate(rows):
        y = 106 + i * 72
        s.rect(60, y, 680, 60, 12, "#F7FAF8", LINE)
        channel_tile(s, k, 74, y + 10, 40, True)
        s.text(128, y + 26, n, 15, INK, 800)
        s.text(128, y + 46, why, 13, MUTED)
        s.rect(600, y + 13, 124, 34, 17, G)
        s.text(662, y + 35, act, 13, "#FFFFFF", 700, "middle")
    return s


def action_whatsapp_intent():
    s = new(640, 560, (0.5, 0.2))
    s.card(40, 40, 400, 120)
    channel_tile(s, "whatsapp", 60, 64, 40, True)
    s.text(112, 78, "WhatsApp · Customer", 13, MUTED, 700)
    s.text(112, 104, "“Where is my order? It's been", 15.5, INK, 500)
    s.text(112, 128, "3 days.”", 15.5, INK, 500)
    s.path("M240 160 C 240 200, 360 190, 360 230", stroke=G2, sw=2.5, dash="6 7")
    s.card(180, 230, 420, 130)
    s.icon_badge("brain", 214, 270, 18, VIOLET, shadow=False)
    s.text(244, 266, "Intent: Order status", 16, INK, 800)
    s.text(244, 287, "96% confident · no keyword rule", 12.5, MUTED)
    s.rect(204, 318, 372, 10, 5, "#E5EFEA")
    s.rect(204, 318, 357, 10, 5, VIOLET)
    s.path("M400 360 C 400 400, 250 390, 250 420", stroke=G2, sw=2.5, dash="6 7")
    s.card(40, 420, 470, 110)
    s.icon_badge("truck", 76, 462, 18, G2, shadow=False)
    s.text(106, 458, "Tracking link sent in 4 sec", 16, INK, 800)
    s.text(106, 480, "“Arriving tomorrow by 6 PM 🚚”", 13.5, MUTED)
    s.chip(106, 494, "Logged on the lead's timeline", MINT, G, 12, "check")
    return s


def action_instagram_dm():
    s = new(640, 506, (0.2, 0.8))
    s.card(40, 36, 280, 430, 16)
    g = s.uid("igp")
    s.defs.append(f'<linearGradient id="{g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FBCFE8"/><stop offset="1" stop-color="#D9468F"/></linearGradient>')
    s.avatar(64, 62, 12, "G", "#D9468F")
    s.text(84, 67, "glow.store", 13.5, INK, 700)
    s.rect(40, 88, 280, 170, 0, f"url(#{g})")
    s.text(180, 168, "GIVEAWAY 🎁", 26, "#FFFFFF", 900, "middle")
    s.text(180, 198, "Comment WIN to enter", 15, "#FFFFFF", 700, "middle")
    for i, ic in enumerate(("heart", "message-circle", "send")):
        s.icon(ic, 56 + i * 30, 272, 20, INK)
    for i, (w, t) in enumerate([("riya", "WIN 🙌"), ("aman", "WIN"), ("tanvi", "WIN!!")]):
        y = 326 + i * 40
        s.avatar(64, y, 11, w[0].upper(), ["#F59E0B", "#6366F1", "#10B981"][i])
        s.text(82, y + 5, w, 13, INK, 700)
        s.text(82 + text_w(w, 13, 700) + 6, y + 5, t, 13, INK)
    s.path("M320 340 C 370 340, 350 200, 390 200", stroke="#D9468F", sw=2.5, dash="6 7")
    s.card(360, 120, 250, 250, 16)
    source_chip(s, "instagram", 376, 136, 12)
    s.bubble(380, 184, ["Hi Riya! You're in 🎉", "Here's ₹250 off your", "next order:"], "in", 14, buttons=[("gift", "Claim reward")], fill="#FDF0F6")
    s.chip(376, 330, "+1 lead in CRM", MINT, G, 12, "user-plus")
    return s


# ---- industries (800x396) --------------------------------------------------------------------------------------------

def industry(icon, color, channel, name, message, stage_names, current, next_step, value, glow=(0.15, 0.2)):
    s = new(800, 396, glow)
    s.icon_badge(icon, 64, 64, 28, color)
    funnel(s, 150, 34, (330, 198), active=channel, step=55, size=38)
    x, y = 330, 34
    s.card(x, y, 440, 328, 16)
    initials = "".join(p[0] for p in name.split()[:2])
    s.avatar(x + 40, y + 42, 20, initials, color)
    s.text(x + 72, y + 38, name, 17, INK, 800)
    s.text(x + 72, y + 58, "New lead · just now", 12.5, MUTED)
    source_chip(s, channel, x + 270, y + 24, 12)
    s.rect(x + 22, y + 82, 396, 64, 12, "#F5F8F2")
    s.icon("quote", x + 34, y + 94, 16, MUTED)
    for i, l in enumerate(message):
        s.text(x + 58, y + 108 + i * 22, l, 14.5, INK, 500)
    stages(s, x + 50, y + 186, stage_names, current, 340, G2)
    s.rect(x + 22, y + 238, 260, 42, 10, "#FFF7E6")
    s.icon("calendar-check", x + 34, y + 249, 20, AMBER)
    s.text(x + 62, y + 264, next_step, 13.5, INK, 700)
    s.chip(x + 296, y + 243, value, MINT, G, 13)
    s.text(x + 22, y + 306, "Assigned to Priya · reminder on WhatsApp", 12.5, MUTED)
    return s


INDUSTRIES = {
    "banking-finance": ("landmark", BLUE, "website", "Rakesh Iyer", ["Looking for a home loan of ₹40L,", "salaried, CIBIL 780."], ["Lead", "Docs", "Sanction", "Disbursed"], 1, "Collect salary slips · Tue", "₹40L loan"),
    "travel-tourism": ("plane", "#0891B2", "instagram", "Sana Qureshi", ["Bali for 2 in December?", "Budget around ₹1.2L."], ["Enquiry", "Quote", "Booked", "Travelled"], 1, "Send itinerary · today 6 PM", "₹1.2L trip"),
    "beauty-cosmetics": ("sparkles", "#D9468F", "instagram", "Ananya Rao", ["Is the vitamin C serum okay", "for oily skin? Want 2."], ["Enquiry", "Cart", "Paid", "Repeat"], 1, "Send 10% code · now", "₹1,798"),
    "education": ("graduation-cap", VIOLET, "ads", "Sunita Sharma", ["Class 11 JEE batch for my son —", "fees and demo class timing?"], ["Enquiry", "Demo", "Counselled", "Enrolled"], 1, "Demo class · Sat 10 AM", "₹85k course"),
    "spas-salons": ("scissors", "#C2410C", "whatsapp", "Meera Shah", ["Bridal package for 14 Dec,", "4 people. Any slots?"], ["Enquiry", "Trial", "Booked", "Done"], 1, "Trial session · Fri 3 PM", "₹32,000"),
    "ecommerce": ("shopping-cart", "#EA580C", "website", "Neha Gupta", ["Left 2 items in cart —", "running shoes, size 7."], ["Visitor", "Cart", "Ordered", "Repeat"], 1, "Cart reminder · in 1 hour", "₹4,398"),
    "restaurant-food": ("utensils", AMBER, "calls", "Kabir Singh", ["Table for 12 this Saturday,", "birthday dinner, veg menu."], ["Enquiry", "Menu sent", "Confirmed", "Visited"], 1, "Share menu & advance link", "₹18,000"),
    "health-wellness": ("stethoscope", "#0E9F6E", "whatsapp", "Rohit Menon", ["Knee pain for 3 weeks. Is", "Dr. Rao available Monday?"], ["Enquiry", "Booked", "Visited", "Follow-up"], 1, "Appointment · Mon 11:30", "Ortho consult"),
    "home-decor": ("sofa", "#A16207", "instagram", "Tara Kapoor", ["Do you make the walnut study", "table in a 5-ft size?"], ["Enquiry", "Quote", "Ordered", "Delivered"], 1, "Send custom quote · today", "₹26,500"),
    "marketing-agencies": ("briefcase", "#4F46E5", "email", "Urban Bakes (client)", ["212 new leads from the Diwali", "campaign — need a report."], ["Leads", "Qualified", "Handed", "Won"], 2, "Weekly report · auto Monday", "3 clients"),
    "automotive": ("car", "#475569", "calls", "Ahmed Khan", ["Creta due for 20,000 km", "service, pick-up possible?"], ["Due", "Booked", "In service", "Delivered"], 1, "Pick-up · Fri 10 AM", "₹6,800"),
    "real-estate": ("building-2", "#0F766E", "ads", "Amit Desai", ["3BHK at Lake View — price", "and site visit this weekend?"], ["Lead", "Site visit", "Negotiation", "Booked"], 1, "Site visit · Sun 11 AM", "₹1.2 Cr"),
    "freelancer-consultants": ("user-round", "#0891B2", "email", "Priya Nair", ["Need a brand identity for", "my café — timeline & cost?"], ["Enquiry", "Call", "Proposal", "Signed"], 1, "Discovery call · Wed 5 PM", "₹60,000"),
}


def nav_icon(icon, colors):
    s = Svg(72, 72)
    g = s.uid("nv")
    s.defs.append(f'<linearGradient id="{g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{colors[0]}"/><stop offset="1" stop-color="{colors[1]}"/></linearGradient>')
    s.rect(0, 0, 72, 72, 16, f"url(#{g})")
    s.icon(icon, 18, 18, 36, "#FFFFFF", 2)
    return s


NAV = {
    "marketing-agency": ("briefcase", ("#6366F1", "#4338CA")), "restaurants-food": ("utensils", ("#F59E0B", "#D97706")),
    "real-estate": ("building-2", ("#14B8A6", "#0F766E")), "health-wellness": ("stethoscope", ("#10B981", "#047857")),
    "edutech": ("graduation-cap", ("#8B5CF6", "#6D28D9")), "channel-whatsapp": ("message-circle", ("#22C55E", "#15803D")),
    "channel-instagram": ("camera", ("#F472B6", "#C026D3")),
}

SCENES = {
    "product/ai-copilot": ai_copilot, "product/ai-chatbot": ai_chatbot, "product/ai-forms": ai_forms, "product/ai-intent": ai_intent,
    "product/ai-templates": ai_templates, "product/ai-agent": cap_ai_agent, "product/flow-builder": cap_flow_builder,
    "product/maximize-leads": cap_maximize_leads, "product/instagram-automation": cap_instagram, "product/unified-inbox": cap_inbox,
    "product/pipeline": cap_pipeline, "product/broadcast": cap_broadcast, "product/payments-meetings": cap_payments_meetings,
    "product/analytics": cap_analytics, "product/hub-marketing": hub_marketing, "product/hub-support": hub_support, "product/hub-sales": hub_sales,
    "product/email-builder": release_email_builder, "product/revenue-leak": release_revenue_leak,
    "product/whatsapp-intent": action_whatsapp_intent, "product/instagram-dm": action_instagram_dm,
    **{f"industries/{k}": (lambda a=a: industry(*a)) for k, a in INDUSTRIES.items()},
    **{f"nav-icons/{k}": (lambda a=a: nav_icon(*a)) for k, a in NAV.items()},
}

if __name__ == "__main__":
    out = FRONTEND / "public" / "images" / "site"
    for name, fn in SCENES.items():
        f = out / f"{name}.svg"
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_text(fn().render(), encoding="utf-8")
        print(name)
