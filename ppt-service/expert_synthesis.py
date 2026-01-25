# ppt-service/expert_synthesis.py
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
import os

# --- Visual Identity (Institutional Clean Light Theme) ---
PRIMARY_COLOR = RGBColor(13, 148, 136)   # Teal-600 (Main Action/Title)
SECONDARY_COLOR = RGBColor(71, 85, 105)  # Slate-500 (Sub-details)
BG_LIGHT = RGBColor(255, 255, 255)       # Pure White
ACCENT_GREY = RGBColor(241, 245, 249)    # Slate-100 (Banded/Boxes)
TEXT_MAIN = RGBColor(30, 41, 59)         # Slate-800 (Clean Dark Text)
LINE_COLOR = RGBColor(203, 213, 225)     # Slate-300 (Borders)
ERROR_ZONE = RGBColor(225, 29, 72)       # Rose-600 (Pain/Problems)

def add_footer(slide):
    # Minimal institutional footer
    f_box = slide.shapes.add_textbox(Inches(0.4), Inches(7.1), Inches(9.2), Inches(0.3))
    p = f_box.text_frame.paragraphs[0]
    p.text = "HACK@JIT 1.0"
    p.font.size = Pt(9); p.font.name = 'Arial'; p.font.color.rgb = SECONDARY_COLOR
    p.alignment = PP_ALIGN.RIGHT

def add_header(slide, title):
    # Consistent module header
    branding = slide.shapes.add_textbox(Inches(0.4), Inches(0.2), Inches(4), Inches(0.3))
    p_b = branding.text_frame.paragraphs[0]
    p_b.text = "HACK@JIT 1.0"
    p_b.font.size = Pt(11); p_b.font.bold = True; p_b.font.color.rgb = PRIMARY_COLOR
    
    if os.path.exists("institution_logo.png"):
        slide.shapes.add_picture("institution_logo.png", Inches(8.8), Inches(0.2), width=Inches(0.8))
        
    title_box = slide.shapes.add_textbox(Inches(0.4), Inches(0.6), Inches(9.2), Inches(0.5))
    tf = title_box.text_frame; tf.text = title.upper()
    p = tf.paragraphs[0]; p.font.size = Pt(28); p.font.bold = True; p.font.color.rgb = TEXT_MAIN
    
    # Elegant Underline
    line = slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(0.4), Inches(1.15), Inches(3.0), Inches(1.15))
    line.line.color.rgb = PRIMARY_COLOR; line.line.width = Pt(3)
    add_footer(slide)

def add_clean_box(slide, text, left, top, width, height, size=14, bold=False, color=TEXT_MAIN, borderColor=LINE_COLOR):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    shape.fill.solid(); shape.fill.fore_color.rgb = BG_LIGHT
    shape.line.color.rgb = borderColor; shape.line.width = Pt(1)
    tf = shape.text_frame; tf.word_wrap = True; tf.margin_left = Inches(0.12); tf.margin_top = Inches(0.12)
    p = tf.paragraphs[0]; p.text = str(text) if text else "N/A"
    p.font.size = Pt(size); p.font.bold = bold; p.font.name = 'Arial'; p.font.color.rgb = color

def create_expert_deck(team_name, college, data):
    prs = Presentation()
    
    # 1. FINAL COVER Architecture
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    
    # Center-v alignment
    tx_title = slide.shapes.add_textbox(Inches(0.5), Inches(1.5), Inches(9), Inches(1.5))
    p_title = tx_title.text_frame.paragraphs[0]
    p_title.text = data.get('projectName', 'VENTURE PROTOYPE').upper()
    p_title.font.size = Pt(54); p_title.font.bold = True; p_title.font.color.rgb = PRIMARY_COLOR; p_title.alignment = PP_ALIGN.CENTER
    
    # Personnel Block
    tx_details = slide.shapes.add_textbox(Inches(1), Inches(3.2), Inches(8), Inches(3))
    tf_d = tx_details.text_frame; tf_d.word_wrap = True
    
    def add_line(label, val, size, bold=True, color=TEXT_MAIN):
        p = tf_d.add_paragraph(); p.alignment = PP_ALIGN.CENTER; p.text = f"{label}: {val}"
        p.font.size = Pt(size); p.font.bold = bold; p.font.color.rgb = color; p.font.name = 'Arial'

    add_line("TEAM NAME", team_name.upper(), 24, True, PRIMARY_COLOR)
    add_line("COLLEGE", college.upper(), 18, False, SECONDARY_COLOR)
    add_line("TEAM LEADER", data.get('leaderName', 'N/A').upper(), 20, True, TEXT_MAIN)
    add_line("MEMBER NAMES", data.get('memberNames', 'N/A').upper(), 16, False, SECONDARY_COLOR)
    add_footer(slide)

    # Modules
    drawers = [
        ("02 // STRATEGIC CONTEXT", lambda s: draw_strategic(s, data)),
        ("03 // PROBLEM STATEMENT", lambda s: draw_problem(s, data)),
        ("04 // IMPACT MATRIX", lambda s: draw_impact(s, data)),
        ("05 // SYSTEMIC STAKEHOLDERS", lambda s: draw_stakeholders(s, data)),
        ("06 // TARGET PERSONA", lambda s: draw_persona(s, data)),
        ("07 // GAP ANALYSIS", lambda s: draw_gap(s, data)),
        ("08 // SOLUTION ARCHITECTURE", lambda s: draw_solution(s, data)),
        ("09 // LEAN OPERATIONAL LOGIC", lambda s: draw_lean(s, data)),
        ("10 // ALTITUDE METRICS", lambda s: draw_balloon(s, data)),
        ("11 // MARKET POSITIONING", lambda s: draw_market(s, data)),
        ("12 // REVENUE ARCHITECTURE", lambda s: draw_revenue(s, data)),
        ("13 // FISCAL ALLOCATION", lambda s: draw_fiscal(s, data)),
        ("14 // FUTURE TRAJECTORY", lambda s: draw_vision(s, data))
    ]

    for title, fn in drawers:
        s = prs.slides.add_slide(prs.slide_layouts[6])
        add_header(s, title)
        fn(s)

    # 15. Minimalist Closure
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    tx_thank = slide.shapes.add_textbox(Inches(0), Inches(3.2), Inches(10), Inches(1.5))
    p_thank = tx_thank.text_frame.paragraphs[0]; p_thank.text = "THANK YOU."
    p_thank.font.size = Pt(60); p_thank.font.bold = True; p_thank.font.color.rgb = PRIMARY_COLOR; p_thank.alignment = PP_ALIGN.CENTER
    add_footer(slide)

    if not os.path.exists('ppt_outputs'): os.makedirs('ppt_outputs')
    out = f"ppt_outputs/{team_name.lower().replace(' ', '_')}_pitch_artifact.pptx"
    prs.save(out); return out

# --- Component Logic ---

def draw_strategic(slide, data):
    parts = [("DOMAIN", 's2_domain', 0.8), ("OPERATIONAL CONTEXT", 's2_context', 1.8), ("ROOT CATALYST", 's2_rootReason', 1.0)]
    y = 1.6
    for t, k, h in parts:
        add_clean_box(slide, t, Inches(0.5), Inches(y), Inches(9), Inches(0.3), 11, True, PRIMARY_COLOR, BG_LIGHT)
        add_clean_box(slide, data.get(k, 'N/A'), Inches(0.5), Inches(y+0.35), Inches(9), Inches(h), 14)
        y += h + 0.6

def draw_problem(slide, data):
    add_clean_box(slide, "CORE ARCHITECTURAL CHALLENGE", Inches(0.5), Inches(1.6), Inches(9), Inches(0.3), 11, True, ERROR_ZONE, BG_LIGHT)
    add_clean_box(slide, data.get('s3_coreProblem', 'N/A'), Inches(0.5), Inches(2.0), Inches(9), Inches(2.1), 16)
    add_clean_box(slide, "AFFECTED NODES", Inches(0.5), Inches(4.6), Inches(4.3), Inches(0.3), 11, True, TEXT_MAIN, BG_LIGHT)
    add_clean_box(slide, data.get('s3_affected', 'N/A'), Inches(0.5), Inches(5.0), Inches(4.3), Inches(1.5), 13)
    add_clean_box(slide, "SYSTEMIC IMPACT", Inches(5.2), Inches(4.6), Inches(4.3), Inches(0.3), 11, True, TEXT_MAIN, BG_LIGHT)
    add_clean_box(slide, data.get('s3_whyItMatters', 'N/A'), Inches(5.2), Inches(5.0), Inches(4.3), Inches(1.5), 13)

def draw_impact(slide, data):
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(1), Inches(6.5), Inches(9), Inches(6.5)).line.color.rgb = TEXT_MAIN
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(1), Inches(6.5), Inches(1), Inches(1.8)).line.color.rgb = TEXT_MAIN
    m = {"Low": 1, "Medium": 2, "High": 3, "Rare": 1, "Occasional": 2, "Frequent": 3}
    valid = [p for p in data.get('s4_painPoints', []) if p.get('point')]
    for i, p in enumerate(valid[:8]):
        x, y = 1+m.get(p.get('freq'), 2)*2.4, 6.5-m.get(p.get('impact'), 2)*1.4
        dot = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(x-0.1), Inches(y-0.1), Inches(0.25), Inches(0.25))
        dot.fill.solid(); dot.fill.fore_color.rgb = ERROR_ZONE; dot.line.width = 0
        y_list = 6.4 - (i * 0.5)
        txt = slide.shapes.add_textbox(Inches(5.5), Inches(y_list), Inches(4), Inches(0.4))
        p_t = txt.text_frame.paragraphs[0]; p_t.text = f"{i+1}. {p['point'][:65]}"; p_t.font.size=Pt(10); p_t.font.bold=True; p_t.font.color.rgb=TEXT_MAIN

def draw_stakeholders(slide, data):
    for i, (l, k) in enumerate([("PRIMARY SEGMENT", 's5_primaryUsers'), ("SECONDARY SEGMENT", 's5_secondaryUsers')]):
        y = 1.8 + i*2.6
        add_clean_box(slide, l, Inches(0.5), Inches(y), Inches(9), Inches(0.3), 12, True, PRIMARY_COLOR, BG_LIGHT)
        add_clean_box(slide, data.get(k, 'N/A'), Inches(0.5), Inches(y+0.4), Inches(9), Inches(1.8), 14)

def draw_persona(slide, data):
    inst_teal = PRIMARY_COLOR; coords = [(0.5, 1.8), (5.1, 1.8), (0.5, 4.4), (5.1, 4.4)]; titles = ["PERSONA IDENTITY", "PAIN POINTS", "STRATEGIC GOALS", "SUCCESS INDEX"]
    for i, (x, y) in enumerate(coords):
        h = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(4.4), Inches(2.4))
        h.fill.background(); h.line.color.rgb = LINE_COLOR
        txt = slide.shapes.add_textbox(Inches(x+0.1), Inches(y+0.1), Inches(4), Inches(0.3))
        p = txt.text_frame.paragraphs[0]; p.text=titles[i]; p.font.size=Pt(11); p.font.bold=True; p.font.color.rgb=inst_teal
    add_clean_box(slide, f"Name: {data.get('s6_customerName','X')}\nAge: {data.get('s6_customerAge','X')}\nLoc: {data.get('s6_customerLocation','X')}", Inches(0.6), Inches(2.3), Inches(4), Inches(1.8), 11, False, TEXT_MAIN, BG_LIGHT)
    add_clean_box(slide, data.get('s6_pains','N/A'), Inches(5.2), Inches(2.3), Inches(4), Inches(1.8), 11, False, TEXT_MAIN, BG_LIGHT)
    add_clean_box(slide, data.get('s6_goals','N/A'), Inches(0.6), Inches(4.9), Inches(4), Inches(1.8), 11, False, TEXT_MAIN, BG_LIGHT)
    add_clean_box(slide, data.get('s6_howWeHelp','N/A'), Inches(5.2), Inches(4.9), Inches(4), Inches(1.8), 11, False, TEXT_MAIN, BG_LIGHT)

def draw_gap(slide, data):
    pts = [((0.5, 1.8), "STATUS QUO", 's7_alternatives'), ((5.1, 1.8), "SYSTEMIC GAPS", 's7_limitations'), ((0.5, 4.4), "VALUE GAINS", 's7_gainCreators'), ((5.1, 4.4), "PAIN RELIEF", 's7_painKillers')]
    for (x,y), t, k in pts:
        box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(4.4), Inches(2.4))
        box.fill.background(); box.line.color.rgb = SECONDARY_COLOR
        add_clean_box(slide, t, Inches(x+0.1), Inches(y+0.1), Inches(4.2), Inches(0.3), 11, True, PRIMARY_COLOR, BG_LIGHT)
        add_clean_box(slide, data.get(k, 'N/A'), Inches(x+0.15), Inches(y+0.5), Inches(4.1), Inches(1.7), 11, False, TEXT_MAIN, BG_LIGHT)

def draw_solution(slide, data):
    add_clean_box(slide, data.get('s8_oneline', 'SOLVING THE IMPOSSIBLE'), Inches(0.5), Inches(1.5), Inches(9), Inches(0.6), 22, True, PRIMARY_COLOR, BG_LIGHT)
    sps = [s for s in data.get('s8_flowSteps', []) if s.strip()][:6]
    for i, s in enumerate(sps):
        x, y = 0.5 + (i%3)*3.2, 3.2 + (i//3)*1.6
        box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(2.8), Inches(1.3))
        box.fill.solid(); box.fill.fore_color.rgb = ACCENT_GREY; box.line.color.rgb = PRIMARY_COLOR; box.line.width = Pt(1.5)
        add_clean_box(slide, f"{i+1}. {s}", Inches(x+0.1), Inches(y+0.1), Inches(2.6), Inches(1.1), 10, True, TEXT_MAIN, ACCENT_GREY)

def draw_lean(slide, data):
    w = 1.9; cfg = [('PROBLEM', 's9_leanProblem', 0.4, 4.0), ('SOLUTION', 's9_leanSolution', 0.4+w, 2.0), ('USP', 's9_leanUSP', 0.4+2*w, 4.0), ('ADVANTAGE', 's9_leanUnfair', 0.4+3*w, 2.0), ('SEGMENTS', 's9_leanSegments', 0.4+4*w, 4.0)]
    for t, k, x, h in cfg:
        b = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(1.6), Inches(w-0.1), Inches(h))
        b.fill.solid(); b.fill.fore_color.rgb = BG_LIGHT; b.line.color.rgb = TEXT_MAIN
        add_clean_box(slide, t, Inches(x), Inches(1.65), Inches(w-0.1), Inches(0.3), 9, True, TEXT_MAIN, BG_LIGHT)
        add_clean_box(slide, data.get(k, 'N/A'), Inches(x+0.05), Inches(2.0), Inches(w-0.2), Inches(h-0.5), 8, False, TEXT_MAIN, BG_LIGHT)
    # Metrics & Channels Sub-boxes (The missing half boxes)
    for t, k, x, y in [("METRICS", "s9_leanMetrics", 0.4+w, 3.6), ("CHANNELS", "s9_leanChannels", 0.4+3*w, 3.6)]:
        sb = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(w-0.1), Inches(1.9))
        sb.fill.solid(); sb.fill.fore_color.rgb = BG_LIGHT; sb.line.color.rgb = PRIMARY_COLOR
        add_clean_box(slide, t, Inches(x), Inches(y+0.05), Inches(w-0.1), Inches(0.3), 8, True, PRIMARY_COLOR, BG_LIGHT)
        add_clean_box(slide, data.get(k, 'N/A'), Inches(x+0.05), Inches(y+0.4), Inches(w-0.2), Inches(1.4), 8, False, TEXT_MAIN, BG_LIGHT)
    # Bottom Costs/Revenue
    for t, k, x in [("COST STRUCTURE", "s9_leanCosts", 0.4), ("REVENUE STREAMS", "s9_leanRevenue", 0.4+2.5*w)]:
        box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(5.7), Inches(w*2), Inches(1.2))
        box.fill.solid(); box.fill.fore_color.rgb = ACCENT_GREY; box.line.width = 0
        add_clean_box(slide, t, Inches(x+0.1), Inches(5.7), Inches(w*2-0.2), Inches(0.3), 9, True, PRIMARY_COLOR, ACCENT_GREY)
        add_clean_box(slide, data.get(k, 'N/A'), Inches(x+0.1), Inches(6.0), Inches(w*2-0.2), Inches(0.8), 8, False, TEXT_MAIN, ACCENT_GREY)

def draw_balloon(slide, data):
    # Main Envelope (The Balloon)
    env = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(3.2), Inches(1.5), Inches(3.6), Inches(3.6))
    env.fill.solid(); env.fill.fore_color.rgb = PRIMARY_COLOR; env.line.color.rgb = SECONDARY_COLOR; env.line.width = Pt(1)
    add_clean_box(slide, "LIFTS (DRIVERS)", Inches(3.5), Inches(2.0), Inches(3.0), Inches(0.4), 12, True, BG_LIGHT, PRIMARY_COLOR)
    ls = "\n".join([f"• {x}" for x in data.get('s10_lifts', []) if x.strip()][:4])
    add_clean_box(slide, ls, Inches(3.5), Inches(2.5), Inches(3.0), Inches(1.5), 10, False, BG_LIGHT, PRIMARY_COLOR)
    # The Basket
    bk = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(4.2), Inches(5.6), Inches(1.6), Inches(1.0))
    bk.fill.solid(); bk.fill.fore_color.rgb = SECONDARY_COLOR; bk.line.width = 0
    add_clean_box(slide, "VENTURE CORE", Inches(4.2), Inches(5.8), Inches(1.6), Inches(0.4), 11, True, BG_LIGHT, SECONDARY_COLOR)
    # Connecting Ropes
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(3.7), Inches(4.8), Inches(4.2), Inches(5.6)).line.color.rgb=SECONDARY_COLOR
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(6.3), Inches(4.8), Inches(5.8), Inches(5.6)).line.color.rgb=SECONDARY_COLOR
    # Lateral Quadrants
    add_clean_box(slide, "PULLS (ANCHORS)", Inches(0.4), Inches(4.0), Inches(2.7), Inches(0.3), 11, True, ERROR_ZONE, BG_LIGHT)
    pl = "\n".join([f"• {x}" for x in data.get('s10_pulls', []) if x.strip()][:4])
    add_clean_box(slide, pl, Inches(0.4), Inches(4.4), Inches(2.7), Inches(1.6), 10)
    add_clean_box(slide, "OUTCOMES (ALTITUDE)", Inches(6.9), Inches(4.0), Inches(2.7), Inches(0.3), 11, True, PRIMARY_COLOR, BG_LIGHT)
    os = "\n".join([f"• {x}" for x in data.get('s10_outcomes', []) if x.strip()][:4])
    add_clean_box(slide, os, Inches(6.9), Inches(4.4), Inches(2.7), Inches(1.6), 10)

def draw_market(slide, data):
    xs = [0.5, 3.6, 6.7]; comps = data.get('s11_competitors', [])
    for i, c in enumerate(comps[:2]):
        add_clean_box(slide, f"INCUMBENT: {c.get('name','X').upper()}", Inches(xs[i]), Inches(1.8), Inches(2.9), Inches(0.4), 10, True, SECONDARY_COLOR, BG_LIGHT)
        add_clean_box(slide, f"STR: {c.get('strength','N/A')}\nWEAK: {c.get('weakness','N/A')}", Inches(xs[i]), Inches(2.4), Inches(2.9), Inches(4.2))
    # Highlighted Disruptor Box
    box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(xs[2]), Inches(1.8), Inches(2.9), Inches(4.8))
    box.fill.solid(); box.fill.fore_color.rgb = PRIMARY_COLOR; box.line.width = 0
    o = data.get('s11_ourVenture', {})
    add_clean_box(slide, "OUR DISRUPTOR", Inches(xs[2]), Inches(2.0), Inches(2.9), Inches(0.4), 12, True, BG_LIGHT, PRIMARY_COLOR)
    add_clean_box(slide, f"EDGE:\n{o.get('strength','N/A')}\n\nGAP:\n{o.get('weakness','N/A')}", Inches(xs[2]+0.1), Inches(2.6), Inches(2.7), Inches(3.8), 11, True, BG_LIGHT, PRIMARY_COLOR)

def draw_revenue(slide, data):
    m = [("PRIMARY STREAM", 's12_primaryStream', 0.5, 1.8), ("SECONDARY STREAM", 's12_secondaryStream', 5.1, 1.8), ("PRICING LOGIC", 's12_pricingStrategy', 0.5, 4.4), ("ECONOMIC LOGIC", 's12_revenueLogic', 5.1, 4.4)]
    for lb, k, x, y in m:
        add_clean_box(slide, lb, Inches(x), Inches(y), Inches(4.4), Inches(0.3), 12, True, PRIMARY_COLOR, BG_LIGHT)
        add_clean_box(slide, data.get(k, 'N/A'), Inches(x), Inches(y+0.4), Inches(4.4), Inches(1.9))

def draw_fiscal(slide, data):
    als = [a for a in data.get('s13_allocations', []) if a.get('category')]
    if not als: als = [{"category": "SYSTEMIC DEVELOPMENT", "amount": "TBD"}]
    rows = len(als) + 1
    t = slide.shapes.add_table(rows, 2, Inches(1), Inches(2.0), Inches(8), Inches(rows*0.6)).table
    t.cell(0,0).text = "ALLOCATION NODE"; t.cell(0,1).text = "VALUATION"
    for r in range(rows):
        for c in range(2):
            cell = t.cell(r,c); cell.fill.solid(); cell.fill.fore_color.rgb = PRIMARY_COLOR if r==0 else (ACCENT_GREY if r%2==0 else BG_LIGHT)
            p = cell.text_frame.paragraphs[0]; p.font.size=Pt(12); p.font.bold=(r==0); p.font.color.rgb=(BG_LIGHT if r==0 else TEXT_MAIN)
            if r > 0:
                cell.text = als[r-1]['category'].upper() if c==0 else str(als[r-1]['amount'])

def draw_vision(slide, data):
    add_clean_box(slide, "MACRO IMPACT", Inches(0.5), Inches(1.8), Inches(9), Inches(0.3), 12, True, PRIMARY_COLOR, BG_LIGHT)
    add_clean_box(slide, data.get('s14_socialEconomic', 'N/A'), Inches(0.5), Inches(2.2), Inches(9), Inches(2.3))
    add_clean_box(slide, "FUTURE TRAJECTORY", Inches(0.5), Inches(4.9), Inches(9), Inches(0.3), 12, True, PRIMARY_COLOR, BG_LIGHT)
    add_clean_box(slide, data.get('s14_vision', 'N/A'), Inches(0.5), Inches(5.3), Inches(9), Inches(1.5))
