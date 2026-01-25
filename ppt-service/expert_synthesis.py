# ppt-service/expert_synthesis.py
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
import os

def add_footer(slide, text="HACK@JIT 1.0 // PITCH PROTOCOL"):
    footer_box = slide.shapes.add_textbox(Inches(0.4), Inches(7.1), Inches(9.2), Inches(0.3))
    p = footer_box.text_frame.paragraphs[0]
    p.text = text
    p.font.size = Pt(8); p.font.name = 'Arial'; p.font.color.rgb = RGBColor(148, 163, 184)
    p.alignment = PP_ALIGN.RIGHT

def set_dark_bg(slide, color):
    fill = slide.background.fill
    fill.solid(); fill.fore_color.rgb = color

def add_diagram_slide(prs, title_text, font_name):
    slide = prs.slides.add_slide(prs.slide_layouts[6]) 
    title_box = slide.shapes.add_textbox(Inches(0.4), Inches(0.7), Inches(9.2), Inches(0.5))
    tf = title_box.text_frame
    tf.text = title_text.upper()
    p = tf.paragraphs[0]
    p.font.size = Pt(26); p.font.bold = True; p.font.name = font_name
    p.font.color.rgb = RGBColor(2, 6, 23)
    # Highlight accent line
    line = slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(0.4), Inches(1.2), Inches(3.5), Inches(1.2))
    line.line.color.rgb = RGBColor(13, 148, 136); line.line.width = Pt(2.5)
    return slide

def add_text_to_slide(slide, text, left, top, width, height, size=18, color=None, bold=False, boxed=False):
    if boxed:
        shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
        shape.fill.solid(); shape.fill.fore_color.rgb = RGBColor(255, 255, 255)
        shape.line.color.rgb = RGBColor(203, 213, 225); shape.line.width = Pt(1)
        tf = shape.text_frame
    else:
        shape = slide.shapes.add_textbox(left, top, width, height)
        tf = shape.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]; p.text = text
    p.font.size = Pt(size); p.font.bold = bold; p.font.name = 'Arial'
    p.font.color.rgb = color if color else RGBColor(30, 41, 59)

def create_expert_deck(team_name, college, data):
    prs = Presentation()
    GLOBAL_FONT = 'Arial'
    
    def add_branding(slide):
        branding = slide.shapes.add_textbox(Inches(0.4), Inches(0.3), Inches(5), Inches(0.3))
        p = branding.text_frame.paragraphs[0]
        p.text = "ENGINEERING THE FUTURE // EXPERT SYNTHESIS ARCHIVE"
        p.font.size = Pt(10); p.font.bold = True; p.font.color.rgb = RGBColor(148, 163, 184)
        if os.path.exists("institution_logo.png"):
            slide.shapes.add_picture("institution_logo.png", Inches(8.8), Inches(0.2), width=Inches(0.8))
        add_footer(slide)

    # 1. COVER
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_dark_bg(slide, RGBColor(2, 6, 23))
    tx = slide.shapes.add_textbox(Inches(0), Inches(3.0), Inches(10), Inches(1.2))
    tf = tx.text_frame; tf.text = data.get('projectName', 'VENTURE PROTOYPE').upper()
    p = tf.paragraphs[0]; p.font.size = Pt(54); p.font.bold = True; p.font.color.rgb = RGBColor(255,255,255); p.alignment = PP_ALIGN.CENTER
    tx2 = slide.shapes.add_textbox(Inches(0), Inches(4.2), Inches(10), Inches(0.5))
    tf2 = tx2.text_frame; tf2.text = f"ENTITY: {team_name} // NODE: {college}"
    p2 = tf2.paragraphs[0]; p2.font.size = Pt(16); p2.font.color.rgb = RGBColor(13, 148, 136); p2.alignment = PP_ALIGN.CENTER; p2.font.bold = True

    # Systematic Drawer Mappings
    slides = [
        ("02 // STRATEGIC CONTEXT", lambda s: draw_strategic_context(s, data)),
        ("03 // PROBLEM STATEMENT", lambda s: draw_problem_statement(s, data)),
        ("04 // IMPACT MATRIX", lambda s: draw_impact_matrix(s, data)),
        ("05 // SYSTEMIC STAKEHOLDERS", lambda s: draw_stakeholders(s, data)),
        ("06 // TARGET PERSONA", lambda s: draw_persona(s, data)),
        ("07 // GAP ANALYSIS", lambda s: draw_gap_analysis(s, data)),
        ("08 // SOLUTION ARCHITECTURE", lambda s: draw_solution_flow(s, data)),
        ("09 // LEAN OPERATIONAL LOGIC", lambda s: draw_lean_canvas(s, data)),
        ("10 // ALTITUDE METRICS", lambda s: draw_balloon(s, data)),
        ("11 // MARKET POSITIONING", lambda s: draw_market_matrix(s, data)),
        ("12 // REVENUE ARCHITECTURE", lambda s: draw_revenue_model(s, data)),
        ("13 // FISCAL ALLOCATION", lambda s: draw_fiscal_table(s, data)),
        ("14 // FUTURE TRAJECTORY", lambda s: draw_vision(s, data))
    ]

    for title, drawer in slides:
        s = add_diagram_slide(prs, title, GLOBAL_FONT)
        add_branding(s)
        drawer(s)

    # CLOSURE
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_dark_bg(slide, RGBColor(2, 6, 23))
    add_text_to_slide(slide, "SYNTHESIS PROTOCOL COMPLETE.\nTHANK YOU.", Inches(0), Inches(3.2), Inches(10), Inches(2), size=44, color=RGBColor(255,255,255), bold=True)
    
    if not os.path.exists('ppt_outputs'): os.makedirs('ppt_outputs')
    path = f"ppt_outputs/{team_name.lower().replace(' ', '_')}_pitch_artifact.pptx"
    prs.save(path); return path

# --- HELPERS ---

def draw_strategic_context(slide, data):
    y = 1.6; inst_teal = RGBColor(13, 148, 136)
    for t, k, h in [("DOMAIN VERTICAL", 's2_domain', 0.8), ("OPERATIONAL CONTEXT", 's2_context', 1.8), ("ROOT CATALYST", 's2_rootReason', 1.0)]:
        add_text_to_slide(slide, t, Inches(0.5), Inches(y), Inches(9), Inches(0.3), size=11, bold=True, color=inst_teal)
        add_text_to_slide(slide, data.get(k, 'N/A'), Inches(0.5), Inches(y+0.35), Inches(9), Inches(h), size(13), boxed=True); y += h + 0.6

def draw_problem_statement(slide, data):
    add_text_to_slide(slide, "CORE PROBLEM", Inches(0.5), Inches(1.6), Inches(9), Inches(0.3), size=11, bold=True, color=RGBColor(244,63,94))
    add_text_to_slide(slide, data.get('s3_coreProblem', 'N/A'), Inches(0.5), Inches(2.0), Inches(9), Inches(2.0), size=15, boxed=True)
    add_text_to_slide(slide, "AFFECTED PERSONNEL", Inches(0.5), Inches(4.5), Inches(4.2), Inches(0.3), size(11), bold=True)
    add_text_to_slide(slide, data.get('s3_affected', 'N/A'), Inches(0.5), Inches(4.9), Inches(4.2), Inches(1.5), size=13, boxed=True)
    add_text_to_slide(slide, "CRITICAL GRAVITY", Inches(5.3), Inches(4.5), Inches(4.2), Inches(0.3), size(11), bold=True)
    add_text_to_slide(slide, data.get('s3_whyItMatters', 'N/A'), Inches(5.3), Inches(4.9), Inches(4.2), Inches(1.5), size=13, boxed=True)

def draw_impact_matrix(slide, data):
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(1), Inches(6.5), Inches(9), Inches(6.5)) # X
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(1), Inches(6.5), Inches(1), Inches(1.8)) # Y
    m = {"Low": 1, "Medium": 2, "High": 3, "Rare": 1, "Occasional": 2, "Frequent": 3}
    for i, p in enumerate(data.get('s4_painPoints', [])[:8]):
        if not p.get('point'): continue
        x, y = 1+m.get(p.get('freq'), 2)*2.4, 6.5-m.get(p.get('impact'), 2)*1.4
        dot = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(x), Inches(y), Inches(0.2), Inches(0.2))
        dot.fill.solid(); dot.fill.fore_color.rgb = RGBColor(13,148,136)
        add_text_to_slide(slide, f"{i+1}. {p['point'][:30]}", Inches(x+0.2), Inches(y), Inches(2.5), Inches(0.3), size=8)

def draw_stakeholders(slide, data):
    for i, (l, k) in enumerate([("PRIMARY NODES", 's5_primaryUsers'), ("SECONDARY NODES", 's5_secondaryUsers')]):
        add_text_to_slide(slide, l, Inches(0.5), Inches(1.8+i*2.6), Inches(9), Inches(0.3), size=12, bold=True, color=RGBColor(13,148,136))
        add_text_to_slide(slide, data.get(k, 'N/A'), Inches(0.5), Inches(2.2+i*2.6), Inches(9), Inches(1.8), size=14, boxed=True)

def draw_persona(slide, data):
    inst_teal = RGBColor(13,148,136)
    coords = [(0.5, 1.8), (5.1, 1.8), (0.5, 4.4), (5.1, 4.4)]
    titles = ["PERSONA IDENTITY", "PAIN POINTS", "STRATEGIC GOALS", "SUCCESS INDEX"]
    for i, (x, y) in enumerate(coords):
        box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(4.4), Inches(2.4))
        box.fill.background(); box.line.color.rgb = inst_teal; box.line.width = Pt(1)
        add_text_to_slide(slide, titles[i], Inches(x+0.1), Inches(y+0.1), Inches(4), Inches(0.3), size=11, bold=True, color=inst_teal)
    add_text_to_slide(slide, f"Name: {data.get('s6_customerName', 'X')}\nAge: {data.get('s6_customerAge', 'X')}\nGender: {data.get('s6_customerGender', 'X')}\nLoc: {data.get('s6_customerLocation', 'X')}", Inches(0.6), Inches(2.2), Inches(4), Inches(1.8), size=11)
    add_text_to_slide(slide, data.get('s6_pains', 'N/A'), Inches(5.2), Inches(2.2), Inches(4), Inches(1.8), size=11)
    add_text_to_slide(slide, data.get('s6_goals', 'N/A'), Inches(0.6), Inches(4.8), Inches(4), Inches(1.8), size=11)
    add_text_to_slide(slide, data.get('s6_howWeHelp', 'N/A'), Inches(5.2), Inches(4.8), Inches(4), Inches(1.8), size=11)

def draw_gap_analysis(slide, data):
    inst_teal = RGBColor(13,148,136)
    parts = [("STATUS QUO", 's7_alternatives', 0.5, 1.8), ("LIMITATIONS", 's7_limitations', 5.1, 1.8), ("GAINS", 's7_gainCreators', 0.5, 4.4), ("RELIEF", 's7_painKillers', 5.1, 4.4)]
    for t, k, x, y in parts:
        box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(4.4), Inches(2.4))
        box.fill.background(); box.line.color.rgb = inst_teal; box.line.width = Pt(1)
        add_text_to_slide(slide, t, Inches(x+0.1), Inches(y+0.1), Inches(4), Inches(0.3), size=11, bold=True, color=inst_teal)
        add_text_to_slide(slide, data.get(k, 'N/A'), Inches(x+0.2), Inches(y+0.5), Inches(4), Inches(1.6), size=11)

def draw_solution_flow(slide, data):
    add_text_to_slide(slide, data.get('s8_oneline', 'SOLVING THE IMPOSSIBLE'), Inches(0.5), Inches(1.6), Inches(9), Inches(0.6), size=20, bold=True, color=RGBColor(13,148,136))
    steps = [s for s in data.get('s8_flowSteps', []) if s.strip()][:6]
    for i, s in enumerate(steps):
        x, y = 0.5 + (i%3)*3.2, 3.2 + (i//3)*1.6
        box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(2.8), Inches(1.2))
        box.fill.solid(); box.fill.fore_color.rgb = RGBColor(248, 250, 252); box.line.color.rgb = RGBColor(13,148,136); box.line.width = Pt(1.5)
        add_text_to_slide(slide, f"{i+1}. {s}", Inches(x+0.1), Inches(y+0.1), Inches(2.6), Inches(1), size=10, bold=True)

def draw_lean_canvas(slide, data):
    w = 1.9; c = [(0.4, 4.2), (0.4+w, 2.1), (0.4+2*w, 4.2), (0.4+3*w, 2.1), (0.4+4*w, 4.2)]
    keys = [('PROBLEM', 's9_leanProblem'), ('SOLUTION', 's9_leanSolution'), ('USP', 's9_leanUSP'), ('ADVANTAGE', 's9_leanUnfair'), ('SEGMENTS', 's9_leanSegments')]
    for i, (t, k) in enumerate(keys):
        x, h = c[i]
        box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(1.6), Inches(w-0.1), Inches(h))
        box.fill.background(); box.line.color.rgb = RGBColor(15, 23, 42); box.line.width = Pt(1)
        add_text_to_slide(slide, t, Inches(x), Inches(1.65), Inches(w-0.1), Inches(0.3), size=9, bold=True)
        add_text_to_slide(slide, data.get(k, 'N/A'), Inches(x+0.1), Inches(2.0), Inches(w-0.3), Inches(h-0.5), size=9)

def draw_balloon(slide, data):
    b = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(3.2), Inches(1.8), Inches(3.6), Inches(3.2))
    b.fill.solid(); b.fill.fore_color.rgb = RGBColor(2, 6, 23)
    add_text_to_slide(slide, "LIFTS", Inches(3.5), Inches(2.3), Inches(3), Inches(0.3), size=12, bold=True, color=RGBColor(255,255,255))
    l = "\n".join([f"• {x}" for x in data.get('s10_lifts', []) if x.strip()][:4])
    add_text_to_slide(slide, l, Inches(3.5), Inches(2.7), Inches(3), Inches(1.5), size=10, color=RGBColor(255,255,255))
    bk = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(4.3), Inches(5.6), Inches(1.4), Inches(1.0))
    bk.fill.solid(); bk.fill.fore_color.rgb = RGBColor(13, 148, 136)
    add_text_to_slide(slide, "VENTURE CORE", Inches(4.3), Inches(5.9), Inches(1.4), Inches(0.4), size=10, bold=True, color=RGBColor(255,255,255))

def draw_market_matrix(slide, data):
    xs = [0.5, 3.6, 6.7]; inst_navy = RGBColor(2, 6, 23); inst_teal = RGBColor(13, 148, 136)
    comp = data.get('s11_competitors', [])
    for i, c in enumerate(comp[:2]):
        add_text_to_slide(slide, f"COMPETITOR: {c.get('name', 'N/A').upper()}", Inches(xs[i]), Inches(1.8), Inches(2.8), Inches(0.4), size=11, bold=True, color=inst_navy)
        add_text_to_slide(slide, f"STR: {c.get('strength', 'N/A')}\nWEAK: {c.get('weakness', 'N/A')}", Inches(xs[i]), Inches(2.4), Inches(2.8), Inches(4.0), size=10, boxed=True)
    box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(xs[2]), Inches(1.8), Inches(2.8), Inches(4.8))
    box.fill.solid(); box.fill.fore_color.rgb = RGBColor(241, 245, 249); box.line.color.rgb = inst_teal; box.line.width = Pt(2)
    add_text_to_slide(slide, "OUR VENTURE", Inches(xs[2]), Inches(2.0), Inches(2.8), Inches(0.4), size=12, bold=True, color=inst_teal)
    o = data.get('s11_ourVenture', {})
    add_text_to_slide(slide, f"ADVANTAGE:\n{o.get('strength', 'N/A')}\n\nGAP BRIDGED:\n{o.get('weakness', 'N/A')}", Inches(xs[2]+0.1), Inches(2.6), Inches(2.6), Inches(3.8), size=11, bold=True)

def draw_revenue_model(slide, data):
    parts = [("PRIMARY STREAM", 's12_primaryStream', 0.5, 1.8), ("SECONDARY STREAM", 's12_secondaryStream', 5.1, 1.8), ("PRICING LOGIC", 's12_pricingStrategy', 0.5, 4.4), ("ECONOMIC LOGIC", 's12_revenueLogic', 5.1, 4.4)]
    for t, k, x, y in parts:
        add_text_to_slide(slide, t, Inches(x), Inches(y), Inches(4.4), Inches(0.3), size=12, bold=True, color=RGBColor(13,148,136))
        add_text_to_slide(slide, data.get(k, 'N/A'), Inches(x), Inches(y+0.4), Inches(4.4), Inches(1.8), size=14, boxed=True)

def draw_fiscal_table(slide, data):
    als = [a for a in data.get('s13_allocations', []) if a.get('category')]
    if not als: als = [{"category": "R&D", "amount": "TBD"}]
    rows = len(als) + 1
    t = slide.shapes.add_table(rows, 2, Inches(1), Inches(1.8), Inches(8), Inches(rows*0.6)).table
    t.cell(0,0).text = "ALLOCATION ITEM"; t.cell(0,1).text = "VALUATION"
    for r in range(rows):
        for c in range(2):
            cell = t.cell(r,c); cell.fill.solid(); cell.fill.fore_color.rgb = RGBColor(255,255,255) if r > 0 else RGBColor(2,6,23)
            p = cell.text_frame.paragraphs[0]; p.font.size = Pt(11); p.font.color.rgb = RGBColor(0,0,0) if r > 0 else RGBColor(255,255,255)
    for i, a in enumerate(als):
        t.cell(i+1, 0).text = a['category'].upper(); t.cell(i+1, 1).text = a['amount']

def draw_vision(slide, data):
    add_text_to_slide(slide, "ECONOMIC IMPACT", Inches(0.5), Inches(1.8), Inches(9), Inches(0.3), size=12, bold=True, color=RGBColor(13,148,136))
    add_text_to_slide(slide, data.get('s14_socialEconomic', 'N/A'), Inches(0.5), Inches(2.2), Inches(9), Inches(2.2), size=14, boxed=True)
    add_text_to_slide(slide, "LONG-TERM VISION", Inches(0.5), Inches(4.8), Inches(9), Inches(0.3), size=12, bold=True)
    add_text_to_slide(slide, data.get('s14_vision', 'N/A'), Inches(0.5), Inches(5.2), Inches(9), Inches(1.4), size=16, boxed=True)

import sys
def size(px): return px
