# ppt-service/expert_synthesis.py
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
import os

def create_expert_deck(team_name, college, data):
    prs = Presentation()
    
    # Global Font Setting
    GLOBAL_FONT = 'Arial'
    
    def add_branding(slide):
        # 1. Top Left - Event Branding
        branding_box = slide.shapes.add_textbox(Inches(0.2), Inches(0.2), Inches(3), Inches(0.4))
        p = branding_box.text_frame.paragraphs[0]
        p.text = "ENGINEERING THE FUTURE // HACK@JIT 1.0"
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.name = GLOBAL_FONT
        p.font.color.rgb = RGBColor(71, 85, 105) # Slate-500
        
        # 2. Top Right - Logo Placeholder
        if os.path.exists("institution_logo.png"):
            slide.shapes.add_picture("institution_logo.png", Inches(8.8), Inches(0.15), width=Inches(1.0))

    # 1. IDENTITY & CONTEXT (Cover)
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_branding(slide)
    
    # Cover Highlight bar
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(2.5), Inches(10), Inches(2.5))
    bar.fill.solid()
    bar.fill.fore_color.rgb = RGBColor(2, 6, 23) # Institutional navy
    bar.line.width = Pt(0)
    
    # PROJECT TITLE
    tx = slide.shapes.add_textbox(Inches(0.5), Inches(2.8), Inches(9.0), Inches(1.2))
    tf = tx.text_frame
    tf.text = data.get('projectName', 'VENTURE ARCHITECT').upper()
    p = tf.paragraphs[0]
    p.font.size = Pt(44); p.font.bold = True; p.font.name = GLOBAL_FONT
    p.font.color.rgb = RGBColor(255, 255, 255)
    p.alignment = PP_ALIGN.CENTER
    
    # SUBTITLE
    tx_sub = slide.shapes.add_textbox(Inches(0.5), Inches(3.8), Inches(9.0), Inches(0.4))
    tf_sub = tx_sub.text_frame
    tf_sub.text = "INTELLIGENCE SYNTHESIS ENGINE V4.1"
    p_s = tf_sub.paragraphs[0]
    p_s.font.size = Pt(14); p_s.font.bold = True; p_s.font.name = GLOBAL_FONT
    p_s.font.color.rgb = RGBColor(13, 148, 136) # Teal-500
    p_s.alignment = PP_ALIGN.CENTER

    # TEAM DETAILS - BOTTOM LEFT
    tx_team = slide.shapes.add_textbox(Inches(0.5), Inches(5.5), Inches(4.5), Inches(1.8))
    tf_team = tx_team.text_frame
    tf_team.word_wrap = True
    
    def add_team_line(text, size=14, bold=False):
        p = tf_team.add_paragraph()
        p.text = text
        p.font.size = Pt(size); p.font.name = GLOBAL_FONT; p.font.bold = bold
    
    add_team_line(f"IDENTIFIER: {team_name}", 16, True)
    add_team_line(f"INSTITUTION: {college}", 14)
    add_team_line(f"LEADER: {data.get('leaderName', 'N/A')}", 12)
    if data.get('memberNames'):
        add_team_line(f"NODES: {data.get('memberNames')}", 11)

    # 2. STRATEGIC CONTEXT
    slide = add_diagram_slide(prs, "Strategic Context & Domain Mapping", GLOBAL_FONT)
    add_branding(slide)
    comp_y = 1.6
    add_text_to_slide(slide, "DOMAIN VERTICAL", Inches(1), Inches(comp_y), Inches(8), Inches(0.4), size=12, bold=True, color=RGBColor(13, 148, 136))
    add_text_to_slide(slide, data.get('s2_domain', 'N/A').upper(), Inches(1), Inches(comp_y+0.4), Inches(8), Inches(0.8), size=20, boxed=True)
    
    add_text_to_slide(slide, "OPERATIONAL CONTEXT", Inches(1), Inches(comp_y+1.5), Inches(8), Inches(0.4), size=12, bold=True, color=RGBColor(13, 148, 136))
    add_text_to_slide(slide, data.get('s2_context', 'N/A'), Inches(1), Inches(comp_y+1.9), Inches(8), Inches(1.5), size=14, boxed=True)
    
    add_text_to_slide(slide, "ROOT CATALYST", Inches(1), Inches(comp_y+3.8), Inches(8), Inches(0.4), size=12, bold=True, color=RGBColor(13, 148, 136))
    add_text_to_slide(slide, data.get('s2_rootReason', 'N/A'), Inches(1), Inches(comp_y+4.2), Inches(8), Inches(0.8), size=16, boxed=True)

    # 3. PROBLEM STATEMENT
    slide = add_diagram_slide(prs, "Problem Statement & Gravity Analysis", GLOBAL_FONT)
    add_branding(slide)
    add_text_to_slide(slide, "CORE ARCHITECTURAL COLLAPSE", Inches(1), Inches(1.5), Inches(8), Inches(0.4), size=14, bold=True, color=RGBColor(244, 63, 94))
    add_text_to_slide(slide, data.get('s3_coreProblem', 'N/A'), Inches(1), Inches(2.0), Inches(8), Inches(1.8), size=16, boxed=True)
    
    left_w = 3.8
    add_text_to_slide(slide, "AFFECTED PERSONNEL", Inches(1), Inches(4.2), Inches(left_w), Inches(0.4), size=12, bold=True)
    add_text_to_slide(slide, data.get('s3_affected', 'N/A'), Inches(1), Inches(4.7), Inches(left_w), Inches(1.2), size=14, boxed=True)
    
    add_text_to_slide(slide, "CRITICAL GRAVITY", Inches(5.2), Inches(4.2), Inches(left_w), Inches(0.4), size=12, bold=True)
    add_text_to_slide(slide, data.get('s3_whyItMatters', 'N/A'), Inches(5.2), Inches(4.7), Inches(left_w), Inches(1.2), size=14, boxed=True)

    # 4. IMPACT MATRIX
    slide = add_diagram_slide(prs, "Impact Matrix: Pain Point Criticality", GLOBAL_FONT)
    add_branding(slide)
    pain_points = data.get('s4_painPoints', [])
    draw_impact_graph_detailed(slide, pain_points, GLOBAL_FONT)

    # 5. STAKEHOLDER MAPPING
    slide = add_diagram_slide(prs, "Systemic Stakeholder Segmentation", GLOBAL_FONT)
    add_branding(slide)
    add_text_to_slide(slide, "PRIMARY NODES", Inches(1), Inches(1.8), Inches(8), Inches(0.4), size=14, bold=True, color=RGBColor(13, 148, 136))
    add_text_to_slide(slide, data.get('s5_primaryUsers', 'N/A'), Inches(1), Inches(2.3), Inches(8), Inches(1.5), size=16, boxed=True)
    add_text_to_slide(slide, "SECONDARY NODES", Inches(1), Inches(4.3), Inches(8), Inches(0.4), size=14, bold=True)
    add_text_to_slide(slide, data.get('s5_secondaryUsers', 'N/A'), Inches(1), Inches(4.8), Inches(8), Inches(1.5), size=16, boxed=True)

    # 6. PERSONA: Target Profile
    slide = add_diagram_slide(prs, f"Target Persona: {data.get('s6_customerName', 'ENTITY_X')}", GLOBAL_FONT)
    add_branding(slide)
    draw_persona_quadrants(slide, data, GLOBAL_FONT)

    # 7. GAP ANALYSIS
    slide = add_diagram_slide(prs, "Gap Analysis & Value Prop Fit", GLOBAL_FONT)
    add_branding(slide)
    draw_gap_analysis_grid(slide, data, GLOBAL_FONT)

    # 8. SOLUTION FLOW
    slide = add_diagram_slide(prs, "Proposed Solution & Execution Path", GLOBAL_FONT)
    add_branding(slide)
    add_text_to_slide(slide, data.get('s8_oneline', 'SOLVING THE IMPOSSIBLE'), Inches(1), Inches(1.4), Inches(8), Inches(0.8), size=22, bold=True, color=RGBColor(13, 148, 136))
    flow_steps = [s for s in data.get('s8_flowSteps', []) if isinstance(s, str) and s.strip()]
    draw_flow_diagram(slide, flow_steps, GLOBAL_FONT)

    # 9. LEAN LOGIC
    slide = add_diagram_slide(prs, "Strategic Framework: Lean Canvas", GLOBAL_FONT)
    add_branding(slide)
    draw_lean_canvas(slide, data, GLOBAL_FONT)

    # 10. VALUE METRICS
    slide = add_diagram_slide(prs, "Value Identification: Altitude Metrics", GLOBAL_FONT)
    add_branding(slide)
    draw_hot_air_balloon_detailed(slide, data, GLOBAL_FONT)

    # 11. MARKET POSITIONING (2 Competitors vs Ours)
    slide = add_diagram_slide(prs, "Competitive Landscape & Unfair Advantage", GLOBAL_FONT)
    add_branding(slide)
    add_competitor_comparison(slide, data, GLOBAL_FONT)

    # 12. REVENUE MODEL
    slide = add_diagram_slide(prs, "Institutional Revenue Architecture", GLOBAL_FONT)
    add_branding(slide)
    draw_revenue_architecture(slide, data, GLOBAL_FONT)

    # 13. FINANCIAL ALLOCATION
    slide = add_diagram_slide(prs, "Fiscal Allocation & Resource Mapping", GLOBAL_FONT)
    add_branding(slide)
    add_fiscal_allocation_table(slide, data, GLOBAL_FONT)

    # 14. IMPACT VISION
    slide = add_diagram_slide(prs, "Future Trajectory & Scaling Impact", GLOBAL_FONT)
    add_branding(slide)
    add_text_to_slide(slide, "BROAD ECONOMIC IMPACT", Inches(1), Inches(1.5), Inches(8), Inches(0.4), size=14, bold=True, color=RGBColor(13, 148, 136))
    add_text_to_slide(slide, data.get('s14_socialEconomic', 'N/A'), Inches(1), Inches(2.0), Inches(2), Inches(2.4), size=14, boxed=True)
    add_text_to_slide(slide, "LONG-TERM VISION", Inches(1), Inches(4.8), Inches(8), Inches(0.4), size=14, bold=True)
    add_text_to_slide(slide, data.get('s14_vision', 'N/A'), Inches(1), Inches(5.3), Inches(8), Inches(1.2), size=16, boxed=True)

    # 15. CLOSURE
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_dark_bg(slide, RGBColor(2, 6, 23))
    tx_last = slide.shapes.add_textbox(Inches(0), Inches(3), Inches(10), Inches(2))
    p_last = tx_last.text_frame.paragraphs[0]
    p_last.text = "SYNTHESIS PROTOCOL COMPLETE.\nTHANK YOU."
    p_last.font.size = Pt(44); p_last.font.bold = True; p_last.font.name = GLOBAL_FONT
    p_last.font.color.rgb = RGBColor(255, 255, 255)
    p_last.alignment = PP_ALIGN.CENTER

    if not os.path.exists('ppt_outputs'): os.makedirs('ppt_outputs')
    file_path = f"ppt_outputs/{team_name.lower().replace(' ', '_')}_pitch_artifact.pptx"
    prs.save(file_path)
    return file_path

# --- High Fidelity Component Drawers ---

def add_diagram_slide(prs, title_text, font_name):
    slide = prs.slides.add_slide(prs.slide_layouts[6]) 
    title_box = slide.shapes.add_textbox(Inches(0.2), Inches(0.8), Inches(9.6), Inches(0.6))
    tf = title_box.text_frame
    tf.text = title_text.upper()
    p = tf.paragraphs[0]
    p.font.size = Pt(28); p.font.bold = True; p.font.name = font_name
    p.font.color.rgb = RGBColor(2, 6, 23)
    p.alignment = PP_ALIGN.LEFT
    # Add bottom border to title
    line = slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(0.2), Inches(1.4), Inches(4), Inches(1.4))
    line.line.color.rgb = RGBColor(13, 148, 136)
    line.line.width = Pt(3)
    return slide

def add_text_to_slide(slide, text, left, top, width, height, size=18, color=None, bold=False, boxed=False):
    if boxed:
        shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
        shape.fill.solid(); shape.fill.fore_color.rgb = RGBColor(255, 255, 255)
        shape.line.color.rgb = RGBColor(226, 232, 240); shape.line.width = Pt(1)
        tf = shape.text_frame
    else:
        shape = slide.shapes.add_textbox(left, top, width, height)
        tf = shape.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(size); p.font.bold = bold; p.font.name = 'Arial'
    p.font.color.rgb = color if color else RGBColor(15, 23, 42)

def set_dark_bg(slide, color):
    fill = slide.background.fill
    fill.solid(); fill.fore_color.rgb = color

def draw_persona_quadrants(slide, data, font):
    q_w, q_h = 4.2, 2.2
    coords = [(0.6, 1.8), (5.2, 1.8), (0.6, 4.4), (5.2, 4.4)]
    titles = ["PERSONAL CORE", "PAIN POINTS", "STRATEGIC GOALS", "MOTIVATION INDEX"]
    inst_teal = RGBColor(13, 148, 136)
    
    for i, (x, y) in enumerate(coords):
        box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(q_w), Inches(q_h))
        box.fill.background(); box.line.color.rgb = inst_teal; box.line.width = Pt(1.5)
        add_text_to_slide(slide, titles[i], Inches(x+0.1), Inches(y+0.1), Inches(q_w-0.2), Inches(0.3), size=11, bold=True, color=inst_teal)
        
    # Data Fill
    personal = f"Name: {data.get('s6_customerName', 'N/A')}\nAge: {data.get('s6_customerAge', 'N/A')}\nLocality: {data.get('s6_customerLocation', 'N/A')}\nIdentity: {data.get('s6_customerGender', 'N/A')}"
    add_text_to_slide(slide, personal, Inches(0.75), Inches(2.2), Inches(3.8), Inches(1.5), size=11)
    add_text_to_slide(slide, data.get('s6_pains', 'N/A'), Inches(5.35), Inches(2.2), Inches(3.8), Inches(1.5), size=11)
    add_text_to_slide(slide, data.get('s6_goals', 'N/A'), Inches(0.75), Inches(4.8), Inches(3.8), Inches(1.5), size=11)
    
    mots = data.get('s6_motivations', {})
    if isinstance(mots, dict):
        mot_str = " | ".join([f"{k.upper()}: {v}%" for k,v in mots.items() if k != 'fear'][:4])
        add_text_to_slide(slide, mot_str, Inches(5.35), Inches(4.8), Inches(3.8), Inches(1.5), size=10, bold=True)

def draw_gap_analysis_grid(slide, data, font):
    inst_teal = RGBColor(13, 148, 136)
    boxes = [
        ("STATUS QUO (AS-IS)", 's7_alternatives', 0.6, 1.8),
        ("LIMITATIONS (GAPS)", 's7_limitations', 5.2, 1.8),
        ("GAINS (VALUE RECOGNITION)", 's7_gainCreators', 0.6, 4.4),
        ("RELIEF (PAIN MITIGATION)", 's7_painKillers', 5.2, 4.4)
    ]
    for title, key, x, y in boxes:
        box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(4.2), Inches(2.4))
        box.fill.background(); box.line.color.rgb = inst_teal; box.line.width = Pt(1)
        add_text_to_slide(slide, title, Inches(x+0.1), Inches(y+0.1), Inches(4), Inches(0.3), size=11, bold=True, color=inst_teal)
        add_text_to_slide(slide, data.get(key, 'N/A'), Inches(x+0.2), Inches(y+0.5), Inches(3.8), Inches(1.7), size=11)

def draw_lean_canvas(slide, data, font):
    width_col = 1.85
    config = [
        ("PROBLEM", 's9_leanProblem', 0.4, 4.2, RGBColor(244, 63, 94)), # Rose
        ("SOLUTION", 's9_leanSolution', 0.4+width_col, 2.1, RGBColor(13, 148, 136)), # Teal
        ("USP", 's9_leanUSP', 0.4+2*width_col, 4.2, RGBColor(2, 6, 23)), # Navy
        ("ADVANAGE", 's9_leanUnfair', 0.4+3*width_col, 2.1, RGBColor(13, 148, 136)),
        ("SEGMENTS", 's9_leanSegments', 0.4+4*width_col, 4.2, RGBColor(2, 6, 23))
    ]
    for label, key, x, h, color in config:
        box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(1.6), Inches(width_col-0.1), Inches(h))
        box.fill.background(); box.line.color.rgb = color; box.line.width = Pt(1.5)
        add_text_to_slide(slide, label, Inches(x), Inches(1.65), Inches(width_col-0.1), Inches(0.3), size=9, bold=True, color=color)
        add_text_to_slide(slide, data.get(key, 'N/A'), Inches(x+0.1), Inches(2.0), Inches(width_col-0.3), Inches(h-0.5), size=9)

def draw_impact_graph_detailed(slide, pain_points, font):
    # Standard 2x2 Impact/Frequency chart
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(1), Inches(6.5), Inches(9.5), Inches(6.5)) # X
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(1), Inches(6.5), Inches(1), Inches(1.8)) # Y
    mapping = {"Low": 1, "Medium": 2, "High": 3, "Rare": 1, "Occasional": 2, "Frequent": 3}
    for i, pp in enumerate(pain_points[:8]):
        if not pp.get('point'): continue
        x_p = mapping.get(pp.get('freq'), 2); y_p = mapping.get(pp.get('impact'), 2)
        dot = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(1 + x_p*2.4), Inches(6.5 - y_p*1.3), Inches(0.25), Inches(0.25))
        dot.fill.solid(); dot.fill.fore_color.rgb = RGBColor(13, 148, 136)
        add_text_to_slide(slide, f"{i+1}. {pp['point'][:30]}", Inches(1.3 + x_p*2.4), Inches(6.5 - y_p*1.3), Inches(3), Inches(0.3), size=8)

def draw_hot_air_balloon_detailed(slide, data, font):
    # Advanced visualization
    balloon = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(3.2), Inches(1.8), Inches(3.6), Inches(3.2))
    balloon.fill.solid(); balloon.fill.fore_color.rgb = RGBColor(2, 6, 23)
    add_text_to_slide(slide, "LIFTS (DRIVERS)", Inches(3.5), Inches(2.3), Inches(3), Inches(0.3), size=12, bold=True, color=RGBColor(255,255,255))
    lifts = "\n".join([f"• {x}" for x in data.get('s10_lifts', []) if x.strip()][:4])
    add_text_to_slide(slide, lifts, Inches(3.5), Inches(2.7), Inches(3), Inches(1.5), size=10, color=RGBColor(255,255,255))
    
    basket = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(4.3), Inches(5.6), Inches(1.4), Inches(1.0))
    basket.fill.solid(); basket.fill.fore_color.rgb = RGBColor(13, 148, 136)
    add_text_to_slide(slide, "VENTURE CORE", Inches(4.3), Inches(5.9), Inches(1.4), Inches(0.4), size=10, bold=True, color=RGBColor(255,255,255))

def add_competitor_comparison(slide, data, font):
    competitors = data.get('s11_competitors', [])
    our = data.get('s11_ourVenture', {})
    
    # 3-Column Comparison Matrix
    c_w = 2.8
    xs = [0.8, 0.8+c_w+0.4, 0.8+2*c_w+0.8]
    inst_navy = RGBColor(2, 6, 23); inst_teal = RGBColor(13, 148, 136)
    
    for i, c in enumerate(competitors[:2]):
        box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(xs[i]), Inches(1.8), Inches(c_w), Inches(4.5))
        box.fill.background(); box.line.color.rgb = RGBColor(226, 232, 240); box.line.width = Pt(1)
        add_text_to_slide(slide, f"COMPETITOR: {c.get('name', 'N/A').upper()}", Inches(xs[i]), Inches(2.0), Inches(c_w), Inches(0.4), size=11, bold=True, color=inst_navy)
        add_text_to_slide(slide, f"STRENGTHS:\n{c.get('strength', 'N/A')}", Inches(xs[i]+0.2), Inches(2.6), Inches(c_w-0.4), Inches(1.2), size=10)
        add_text_to_slide(slide, f"WEAKNESSES:\n{c.get('weakness', 'N/A')}", Inches(xs[i]+0.2), Inches(4.0), Inches(c_w-0.4), Inches(1.2), size=10, color=RGBColor(244, 63, 94))

    # Our Venture Node
    box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(xs[2]), Inches(1.8), Inches(c_w), Inches(4.5))
    box.fill.solid(); box.fill.fore_color.rgb = inst_navy
    add_text_to_slide(slide, "OUR VENTURE", Inches(xs[2]), Inches(2.0), Inches(c_w), Inches(0.4), size=11, bold=True, color=inst_teal)
    add_text_to_slide(slide, f"UNFAIR ADVANTAGE:\n{our.get('strength', 'N/A')}", Inches(xs[2]+0.2), Inches(2.6), Inches(c_w-0.4), Inches(1.2), size=10, color=RGBColor(255,255,255))
    add_text_to_slide(slide, f"GAP BRIDGED:\n{our.get('weakness', 'N/A')}", Inches(xs[2]+0.2), Inches(4.0), Inches(c_w-0.4), Inches(1.2), size=10, color=inst_teal)

def draw_revenue_architecture(slide, data, font):
    inst_teal = RGBColor(13, 148, 136)
    add_text_to_slide(slide, "PRIMARY REVENUE STREAM", Inches(1), Inches(1.8), Inches(3.8), Inches(0.4), size=12, bold=True, color=inst_teal)
    add_text_to_slide(slide, data.get('s12_primaryStream', 'N/A').upper(), Inches(1), Inches(2.3), Inches(3.8), Inches(1.0), size=16, boxed=True)
    
    add_text_to_slide(slide, "SECONDARY STREAM", Inches(5.2), Inches(1.8), Inches(3.8), Inches(0.4), size=12, bold=True)
    add_text_to_slide(slide, data.get('s12_secondaryStream', 'N/A').upper(), Inches(5.2), Inches(2.3), Inches(3.8), Inches(1.0), size=14, boxed=True)
    
    add_text_to_slide(slide, "PRICING STRATEGY", Inches(1), Inches(3.8), Inches(3.8), Inches(0.4), size=12, bold=True, color=inst_teal)
    add_text_to_slide(slide, data.get('s12_pricingStrategy', 'N/A'), Inches(1), Inches(4.3), Inches(3.8), Inches(1.5), size=14, boxed=True)

    add_text_to_slide(slide, "ECONOMIC LOGIC & SCALING", Inches(5.2), Inches(3.8), Inches(3.8), Inches(0.4), size=12, bold=True)
    add_text_to_slide(slide, data.get('s12_revenueLogic', 'N/A'), Inches(5.2), Inches(4.3), Inches(3.8), Inches(1.5), size=11, boxed=True)

def add_fiscal_allocation_table(slide, data, font):
    allocs = [a for a in data.get('s13_allocations', []) if a.get('category')]
    if not allocs: allocs = [{"category": "INITIAL R&D", "amount": "TBD"}]
    
    rows = len(allocs) + 1
    table = slide.shapes.add_table(rows, 2, Inches(1), Inches(1.8), Inches(8), Inches(rows * 0.6)).table
    
    # Header
    table.cell(0, 0).text = "ALLOCATION CATEGORY"; table.cell(0, 1).text = "VALUATION / PRICING"
    for c in range(2):
        cell = table.cell(0, c)
        cell.fill.solid(); cell.fill.fore_color.rgb = RGBColor(2, 6, 23)
        p = cell.text_frame.paragraphs[0]
        p.font.color.rgb = RGBColor(255,255,255); p.font.bold = True; p.font.size = Pt(11)
        
    for i, a in enumerate(allocs):
        table.cell(i+1, 0).text = a['category'].upper()
        table.cell(i+1, 1).text = a['amount']
        for c in range(2):
            p = table.cell(i+1, c).text_frame.paragraphs[0]
            p.font.size = Pt(10); p.font.name = font

def draw_flow_diagram(slide, steps, font):
    inst_teal = RGBColor(13, 148, 136)
    for i, step in enumerate(steps[:6]):
        x = 0.5 + (i % 3) * 3.1
        y = 3.0 + (i // 3) * 1.5
        box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(2.8), Inches(0.8))
        box.fill.solid(); box.fill.fore_color.rgb = RGBColor(255, 255, 255)
        box.line.color.rgb = inst_teal; box.line.width = Pt(1.5)
        add_text_to_slide(slide, f"{i+1}. {step}", Inches(x+0.1), Inches(y+0.1), Inches(2.6), Inches(0.6), size=10, bold=True)
