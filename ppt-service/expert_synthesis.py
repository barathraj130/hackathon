# ppt-service/expert_synthesis.py
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
import os

# --- Visual Identity (Institutional Premium Light Theme) ---
PRIMARY_COLOR = RGBColor(13, 148, 136)   # Teal-600
SECONDARY_COLOR = RGBColor(51, 65, 85)   # Slate-700
BG_LIGHT = RGBColor(255, 255, 255)       # Pure White
ACCENT_GREY = RGBColor(241, 245, 249)    # Slate-100
TEXT_MAIN = RGBColor(30, 41, 59)         # Slate-800
LINE_COLOR = RGBColor(203, 213, 225)     # Slate-300
ERROR_ZONE = RGBColor(225, 29, 72)       # Rose-600

def add_footer(slide, text="HACK@JIT 1.0"):
    f_box = slide.shapes.add_textbox(Inches(0.4), Inches(7.1), Inches(9.2), Inches(0.3))
    p = f_box.text_frame.paragraphs[0]
    p.text = text
    p.font.size = Pt(8); p.font.name = 'Arial'; p.font.color.rgb = RGBColor(148, 163, 184)
    p.alignment = PP_ALIGN.RIGHT

def set_slide_bg(slide):
    fill = slide.background.fill
    fill.solid(); fill.fore_color.rgb = BG_LIGHT

def add_header(slide, title):
    branding = slide.shapes.add_textbox(Inches(0.4), Inches(0.2), Inches(4), Inches(0.3))
    p_b = branding.text_frame.paragraphs[0]
    p_b.text = "HACK@JIT 1.0"
    p_b.font.size = Pt(10); p_b.font.bold = True; p_b.font.color.rgb = PRIMARY_COLOR
    if os.path.exists("institution_logo.png"):
        slide.shapes.add_picture("institution_logo.png", Inches(8.8), Inches(0.2), width=Inches(0.8))
    title_box = slide.shapes.add_textbox(Inches(0.4), Inches(0.6), Inches(9.2), Inches(0.5))
    tf = title_box.text_frame; tf.text = title.upper()
    p = tf.paragraphs[0]; p.font.size = Pt(24); p.font.bold = True; p.font.color.rgb = TEXT_MAIN
    line = slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(0.4), Inches(1.15), Inches(3.0), Inches(1.15))
    line.line.color.rgb = PRIMARY_COLOR; line.line.width = Pt(3)
    add_footer(slide)

def add_clean_box(slide, text, left, top, width, height, size=14, bold=False, color=TEXT_MAIN, borderColor=LINE_COLOR, bgColor=WHITE):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    shape.fill.solid(); shape.fill.fore_color.rgb = bgColor or WHITE
    shape.line.color.rgb = borderColor; shape.line.width = Pt(1)
    tf = shape.text_frame; tf.word_wrap = True; tf.margin_left = Inches(0.12); tf.margin_top = Inches(0.12)
    p = tf.paragraphs[0]; p.text = str(text) if text else "N/A"
    p.font.size = Pt(size); p.font.bold = bold; p.font.name = 'Arial'; p.font.color.rgb = color

WHITE = RGBColor(255, 255, 255)

def create_expert_deck(team_name, college, data):
    prs = Presentation()
    
    # 1. FINAL COVER
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide)
    tx_title = slide.shapes.add_textbox(Inches(0.5), Inches(1.5), Inches(9), Inches(1.5))
    p_title = tx_title.text_frame.paragraphs[0]
    p_title.text = data.get('projectName', 'VENTURE PROTOTYPE').upper()
    p_title.font.size = Pt(54); p_title.font.bold = True; p_title.font.color.rgb = PRIMARY_COLOR; p_title.alignment = PP_ALIGN.CENTER
    tx_id = slide.shapes.add_textbox(Inches(1), Inches(3.2), Inches(8), Inches(3))
    tf_d = tx_id.text_frame; tf_d.word_wrap = True
    def add_line(lb, val, sz, b=True, cl=TEXT_MAIN):
        p = tf_d.add_paragraph(); p.alignment = PP_ALIGN.CENTER; p.text = f"{lb}: {val}"
        p.font.size = Pt(sz); p.font.bold = b; p.font.color.rgb = cl; p.font.name = 'Arial'
    add_line("TEAM NAME", team_name.upper(), 22, True, PRIMARY_COLOR)
    add_line("COLLEGE", college.upper(), 18, False, SECONDARY_COLOR)
    add_line("TEAM LEADER", data.get('leaderName', 'N/A').upper(), 20, True, TEXT_MAIN)
    add_line("NODE MEMBERS", data.get('memberNames', 'N/A').upper(), 16, False, SECONDARY_COLOR)
    add_footer(slide)

    modules = [
        ("02 // STRATEGIC CONTEXT", lambda s: draw_strategic(s, data)),
        ("03 // PROBLEM STATEMENT", lambda s: draw_problem(s, data)),
        ("04 // IMPACT MATRIX", lambda s: draw_impact(s, data)),
        ("05 // SYSTEMIC STAKEHOLDERS", lambda s: draw_stakeholders(s, data)),
        ("06 // TARGET PERSONA", lambda s: draw_persona(s, data)),
        ("07 // GAP ANALYSIS", lambda s: draw_gap(s, data)),
        ("08 // SOLUTION ARCHITECTURE", lambda s: draw_solution(s, data)),
        ("09 // LEAN OPERATIONAL LOGIC", lambda s: draw_lean(s, data)),
        ("10 // ALTITUDE METRICS", lambda s: draw_balloon(s, data)),
        ("11 // MARKET POSITIONING", lambda s: draw_market_matrix(s, data)),
        ("12 // MARKET SIZING (TAM SAM SOM)", lambda s: draw_market_sizing(s, data)),
        ("13 // REVENUE ARCHITECTURE", lambda s: draw_revenue(s, data)),
        ("14 // FISCAL ALLOCATION", lambda s: draw_fiscal(s, data)),
        ("15 // FUTURE TRAJECTORY", lambda s: draw_vision(s, data))
    ]

    for title, fn in modules:
        s = prs.slides.add_slide(prs.slide_layouts[6]); set_slide_bg(s)
        add_header(s, title); fn(s)

    # 16. CLOSURE
    slide = prs.slides.add_slide(prs.slide_layouts[6]); set_slide_bg(slide)
    tx = slide.shapes.add_textbox(Inches(0), Inches(3.2), Inches(10), Inches(1.5))
    p = tx.text_frame.paragraphs[0]; p.text = "THANK YOU."; p.font.size = Pt(64); p.font.bold = True; p.font.color.rgb = PRIMARY_COLOR; p.alignment = PP_ALIGN.CENTER
    add_footer(slide)

    if not os.path.exists('ppt_outputs'): os.makedirs('ppt_outputs')
    out = f"ppt_outputs/{team_name.lower().replace(' ', '_')}_pitch_artifact.pptx"
    prs.save(out); return out

# --- DRAWERS ---

def draw_strategic(slide, data):
    parts = [("DOMAIN", 's2_domain', 0.8), ("OPERATIONAL CONTEXT", 's2_context', 1.8), ("ROOT CATALYST", 's2_rootReason', 1.0)]
    y = 1.6
    for t, k, h in parts:
        add_clean_box(slide, t, Inches(0.5), Inches(y), Inches(9), Inches(0.35), 11, True, PRIMARY_COLOR, None, BG_LIGHT)
        add_clean_box(slide, data.get(k, 'N/A'), Inches(0.5), Inches(y+0.4), Inches(9), Inches(h), 14)
        y += h + 0.6

def draw_problem(slide, data):
    add_clean_box(slide, "CORE CHALLENGE", Inches(0.5), Inches(1.6), Inches(9), Inches(0.35), 11, True, ERROR_ZONE, None, BG_LIGHT)
    add_clean_box(slide, data.get('s3_coreProblem', 'N/A'), Inches(0.5), Inches(2.0), Inches(9), Inches(2.1), 16)
    add_clean_box(slide, "AFFECTED NODES", Inches(0.5), Inches(4.6), Inches(4.3), Inches(0.35), 11, True, TEXT_MAIN, None, BG_LIGHT)
    add_clean_box(slide, data.get('s3_affected', 'N/A'), Inches(0.5), Inches(5.0), Inches(4.3), Inches(1.5), 13)
    add_clean_box(slide, "SYSTEMIC IMPACT", Inches(5.2), Inches(4.6), Inches(4.3), Inches(0.35), 11, True, TEXT_MAIN, None, BG_LIGHT)
    add_clean_box(slide, data.get('s3_whyItMatters', 'N/A'), Inches(5.2), Inches(5.0), Inches(4.3), Inches(1.5), 13)

def draw_impact(slide, data):
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(1), Inches(6.5), Inches(9), Inches(6.5)).line.color.rgb = TEXT_MAIN
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(1), Inches(6.5), Inches(1), Inches(1.8)).line.color.rgb = TEXT_MAIN
    m = {"Low": 1, "Medium": 2, "High": 3, "Rare": 1, "Occasional": 2, "Frequent": 3}
    pts = [p for p in data.get('s4_painPoints', []) if p.get('point')]
    for i, p in enumerate(pts[:8]):
        x, y = 1+m.get(p.get('freq'), 2)*2.4, 6.5-m.get(p.get('impact'), 2)*1.4
        dot = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(x-0.1), Inches(y-0.1), Inches(0.25), Inches(0.25))
        dot.fill.solid(); dot.fill.fore_color.rgb = ERROR_ZONE; dot.line.width = 0
        y_list = 6.4 - (i * 0.5) # POINT 0 (bottom) to POINT N (top)
        add_text_box_simple(slide, f"{i+1}. {p['point'][:65]}", 5.5, y_list, 4, 0.4, 10, True)

def add_text_box_simple(slide, text, x, y, w, h, sz, b=False, cl=TEXT_MAIN):
    tx = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    p = tx.text_frame.paragraphs[0]; p.text = text; p.font.size = Pt(sz); p.font.bold = b; p.font.color.rgb = cl

def draw_stakeholders(slide, data):
    for i, (l, k) in enumerate([("PRIMARY SEGMENT", 's5_primaryUsers'), ("SECONDARY SEGMENT", 's5_secondaryUsers')]):
        y = 1.8 + i*2.6
        add_clean_box(slide, l, Inches(0.5), Inches(y), Inches(9), Inches(0.35), 12, True, PRIMARY_COLOR, None, BG_LIGHT)
        add_clean_box(slide, data.get(k, 'N/A'), Inches(0.5), Inches(y+0.4), Inches(9), Inches(1.8), 14)

def draw_persona(slide, data):
    coords = [(0.5, 1.8), (5.1, 1.8), (0.5, 4.4), (5.1, 4.4)]
    titles = ["PERSONAL INFO", "CHALLENGES", "PROFESSIONAL GOALS", "SUCCESS FACTORS"]
    vals = [f"Name: {data.get('s6_customerName','X')}\nAge: {data.get('s6_customerAge', 'X')}\nLoc: {data.get('s6_customerLocation','X')}", data.get('s6_pains', 'N/A'), data.get('s6_goals', 'N/A'), data.get('s6_howWeHelp', 'N/A')]
    for i, (x, y) in enumerate(coords):
        add_clean_box(slide, titles[i], Inches(x), Inches(y), Inches(4.4), Inches(0.35), 11, True, PRIMARY_COLOR, None, BG_LIGHT)
        add_clean_box(slide, vals[i], Inches(x), Inches(y+0.4), Inches(4.4), Inches(2.0), 11)
    # Target Avatar central circle
    c = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(4.4), Inches(3.7), Inches(1.2), Inches(1.2))
    c.fill.solid(); c.fill.fore_color.rgb = PRIMARY_COLOR; c.line.color.rgb = WHITE; c.line.width = Pt(2)
    add_text_box_centered(slide, data.get('s6_customerName', 'PERSONA').upper()[:10], 4.4, 4.15, 1.2, 0.3, 9, True, WHITE)

def add_text_box_centered(slide, text, x, y, w, h, sz, b, cl):
    tx = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    p = tx.text_frame.paragraphs[0]; p.text = text; p.font.size = Pt(sz); p.font.bold = b; p.font.color.rgb = cl; p.alignment = PP_ALIGN.CENTER

def draw_gap(slide, data):
    pts = [((0.5, 1.8), "STATUS QUO", 's7_alternatives'), ((5.1, 1.8), "SYSTEMIC GAPS", 's7_limitations'), ((0.5, 4.4), "VALUE GAINS", 's7_gainCreators'), ((5.1, 4.4), "PAIN RELIEF", 's7_painKillers')]
    for (x,y), t, k in pts:
        add_clean_box(slide, t, Inches(x), Inches(y), Inches(4.4), Inches(0.35), 11, True, PRIMARY_COLOR, None, BG_LIGHT)
        add_clean_box(slide, data.get(k, 'N/A'), Inches(x), Inches(y+0.4), Inches(4.4), Inches(2.0), 11)

def draw_solution(slide, data):
    add_clean_box(slide, data.get('s8_oneline', 'N/A'), Inches(0.5), Inches(1.5), Inches(9), Inches(0.6), 22, True, PRIMARY_COLOR, None, BG_LIGHT)
    sps = [s for s in data.get('s8_flowSteps', []) if s.strip()][:6]
    for i, s in enumerate(sps):
        x, y = 0.5 + (i%3)*3.2, 3.2 + (i//3)*1.6
        add_clean_box(slide, f"{i+1}. {s}", Inches(x), Inches(y), Inches(2.8), Inches(1.3), 10, True, TEXT_MAIN, PRIMARY_COLOR, ACCENT_GREY)

def draw_lean(slide, data):
    w = 1.9; pillars = [('PROBLEM','s9_leanProblem',0.4,4.0), ('SOLUTION','s9_leanSolution',0.4+w,2.0), ('USP','s9_leanUSP',0.4+2*w,4.0), ('ADVANAGE','s9_leanUnfair',0.4+3*w,2.0), ('SEGMENTS','s9_leanSegments',0.4+4*w,4.0)]
    for t,k,x,h in pillars:
        add_clean_box(slide, t, Inches(x), Inches(1.6), Inches(w-0.1), Inches(0.35), 9, True, PRIMARY_COLOR, None, BG_LIGHT)
        add_clean_box(slide, data.get(k,'N/A'), Inches(x), Inches(2.0), Inches(w-0.1), Inches(h-0.4), 8)
    for t,k,x,y in [("METRICS","s9_leanMetrics",0.4+w,3.6), ("CHANNELS","s9_leanChannels",0.4+3*w,3.6)]:
        add_clean_box(slide, t, Inches(x), Inches(y), Inches(w-0.1), Inches(0.35), 8, True, PRIMARY_COLOR, None, BG_LIGHT)
        add_clean_box(slide, data.get(k,'N/A'), Inches(x), Inches(y+0.4), Inches(w-0.1), Inches(1.6), 8)
    for t,k,x in [("COSTS","s9_leanCosts",0.4), ("REVENUE","s9_leanRevenue",0.4+w*3)]:
        add_clean_box(slide, t, Inches(x), Inches(5.7), Inches(w*2), Inches(0.35), 9, True, PRIMARY_COLOR, None, BG_LIGHT)
        add_clean_box(slide, data.get(k,'N/A'), Inches(x), Inches(6.1), Inches(w*2), Inches(0.9), 8)

def draw_balloon(slide, data):
    # Envelope
    env = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(3.2), Inches(1.5), Inches(3.6), Inches(3.6))
    env.fill.solid(); env.fill.fore_color.rgb = PRIMARY_COLOR; env.line.color.rgb = SECONDARY_COLOR; env.line.width = Pt(1)
    add_text_box_centered(slide, "LIFTS (DRIVERS)", 3.4, 2.0, 3.2, 0.4, 12, True, WHITE)
    ls = "\n".join([f"• {x}" for x in data.get('s10_lifts', []) if x.strip()][:4])
    add_text_box_centered(slide, ls, 3.4, 2.4, 3.2, 1.5, 10, False, WHITE)
    # Basket
    bk = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(4.2), Inches(5.6), Inches(1.6), Inches(1.0))
    bk.fill.solid(); bk.fill.fore_color.rgb = SECONDARY_COLOR; bk.line.width = 0
    add_text_box_centered(slide, "VENTURE CORE", 4.2, 5.8, 1.6, 0.4, 11, True, WHITE)
    # Connectors
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(3.7), Inches(4.8), Inches(4.2), Inches(5.6)).line.color.rgb=SECONDARY_COLOR
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(6.3), Inches(4.8), Inches(5.8), Inches(5.6)).line.color.rgb=SECONDARY_COLOR
    # Lateral Quadrants
    add_clean_box(slide, "PULLS (ANCHORS)", Inches(0.4), Inches(4.0), Inches(2.7), Inches(0.35), 11, True, ERROR_ZONE, None, BG_LIGHT)
    pl = "\n".join([f"• {x}" for x in data.get('s10_pulls', []) if x.strip()][:4])
    add_clean_box(slide, pl, Inches(0.4), Inches(4.4), Inches(2.7), Inches(1.8), 10)
    add_clean_box(slide, "OUTCOMES (ALTITUDE)", Inches(6.9), Inches(4.0), Inches(2.7), Inches(0.35), 11, True, PRIMARY_COLOR, None, BG_LIGHT)
    os = "\n".join([f"• {x}" for x in data.get('s10_outcomes', []) if x.strip()][:4])
    add_clean_box(slide, os, Inches(6.9), Inches(4.4), Inches(2.7), Inches(1.8), 10)

def draw_market_sizing(slide, data):
    # TAM SAM SOM Concentric visual
    coords = [(3.0, 1.7, 4.0, "TAM", 's12_tam', PRIMARY_COLOR), (3.5, 2.7, 3.0, "SAM", 's12_sam', SECONDARY_COLOR), (4.0, 3.7, 2.0, "SOM", 's12_som', RGBColor(148, 163, 184))]
    for x,y,d,lb,k,cl in coords:
        ov = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(x), Inches(y), Inches(d), Inches(d))
        ov.fill.background(); ov.line.color.rgb = cl; ov.line.width = Pt(2)
        add_text_box_simple(slide, f"{lb}: {data.get(k, 'N/A')}", x+d+0.2, y+d/2, 2.5, 0.4, 14, True, cl)
    add_clean_box(slide, "MARKET LOGIC", Inches(0.5), Inches(5.8), Inches(9), Inches(0.35), 10, True, PRIMARY_COLOR, None, BG_LIGHT)
    add_clean_box(slide, data.get('s12_marketLogic', 'N/A'), Inches(0.5), Inches(6.2), Inches(9), Inches(0.8), 10)

def draw_market_matrix(slide, data):
    # Institutional Matrix Table
    rows = 4; cols = 4
    t = slide.shapes.add_table(rows, cols, Inches(0.5), Inches(1.8), Inches(9), Inches(5)).table
    hdrs = ["FEATURE / METRIC", "COMPETITOR 1", "COMPETITOR 2", "OUR VENTURE"]
    for i, h in enumerate(hdrs):
        c = t.cell(0, i); c.text = h; c.fill.solid(); c.fill.fore_color.rgb = PRIMARY_COLOR
        p = c.text_frame.paragraphs[0]; p.font.size=Pt(11); p.font.bold=True; p.font.color.rgb=WHITE
    f_rows = ["Market Focus", "Pricing Tier", "Core Strength", "Disruptive Potential"]
    comps = data.get('s11_competitors', [])
    our = data.get('s11_ourVenture', {})
    for r in range(1, rows):
        t.cell(r, 0).text = f_rows[r-1]
        if len(comps) > 0: t.cell(r, 1).text = comps[0].get('strength','N/A') if r == 1 else comps[0].get('name','N/A')
        if len(comps) > 1: t.cell(r, 2).text = comps[1].get('strength','N/A') if r == 1 else comps[1].get('name','N/A')
        t.cell(r, 3).text = our.get('strength','N/A') if r == 1 else "High Scale"
        for c in range(cols):
            p = t.cell(r, c).text_frame.paragraphs[0]
            p.font.size = Pt(10)
            if r % 2 == 0:
                t.cell(r, c).fill.solid()
                t.cell(r, c).fill.fore_color.rgb = ACCENT_GREY

def draw_revenue(slide, data):
    m = [("PRIMARY STREAM", 's13_primaryStream', 0.5, 1.8), ("SECONDARY STREAM", 's13_secondaryStream', 5.1, 1.8), ("PRICING LOGIC", 's13_pricingStrategy', 0.5, 4.4), ("ECONOMIC LOGIC", 's13_revenueLogic', 5.1, 4.4)]
    for lb, k, x, y in m:
        add_clean_box(slide, lb, Inches(x), Inches(y), Inches(4.4), Inches(0.35), 12, True, PRIMARY_COLOR, None, BG_LIGHT)
        add_clean_box(slide, data.get(k, 'N/A'), Inches(x), Inches(y+0.4), Inches(4.4), Inches(1.9))

def draw_fiscal(slide, data):
    als = [a for a in data.get('s14_allocations', []) if a.get('category')]
    if not als: als = [{"category": "SYSTEMIC DEVELOPMENT", "amount": "TBD"}]
    rows = len(als) + 1
    t = slide.shapes.add_table(rows, 2, Inches(1), Inches(2.0), Inches(8), Inches(rows*0.6)).table
    t.cell(0,0).text = "ALLOCATION NODE"; t.cell(0,1).text = "VALUATION"
    for r in range(rows):
        for c in range(2):
            cell = t.cell(r,c); cell.fill.solid(); cell.fill.fore_color.rgb = PRIMARY_COLOR if r==0 else (ACCENT_GREY if r%2==0 else WHITE)
            p = cell.text_frame.paragraphs[0]; p.font.size=Pt(12); p.font.bold=(r==0); p.font.color.rgb=(WHITE if r==0 else TEXT_MAIN)
            if r > 0: cell.text = als[r-1]['category'].upper() if c==0 else str(als[r-1]['amount'])

def draw_vision(slide, data):
    add_clean_box(slide, "MACRO IMPACT", Inches(0.5), Inches(1.8), Inches(9), Inches(0.35), 12, True, PRIMARY_COLOR, None, BG_LIGHT)
    add_clean_box(slide, data.get('s15_socialEconomic', 'N/A'), Inches(0.5), Inches(2.2), Inches(9), Inches(2.3))
    add_clean_box(slide, "FUTURE TRAJECTORY", Inches(0.5), Inches(4.8), Inches(9), Inches(0.35), 12, True, PRIMARY_COLOR, None, BG_LIGHT)
    add_clean_box(slide, data.get('s15_vision', 'N/A'), Inches(0.5), Inches(5.2), Inches(9), Inches(1.5))
