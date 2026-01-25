# ppt-service/expert_synthesis.py
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
from pptx.dml.color import RGBColor
import os

def create_expert_deck(team_name, college, data):
    prs = Presentation()
    
    def add_corner_logo(slide):
        if os.path.exists("institution_logo.png"):
            slide.shapes.add_picture("institution_logo.png", Inches(8.5), Inches(0.2), width=Inches(1.2))

    # 1. IDENTITY & CONTEXT
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_corner_logo(slide)
    tx = slide.shapes.add_textbox(Inches(1), Inches(3), Inches(8), Inches(2))
    tf = tx.text_frame
    tf.text = data.get('projectName', 'VENTURE TITLE')
    tf.paragraphs[0].font.size = Pt(44)
    tf.paragraphs[0].font.bold = True
    
    p = tf.add_paragraph()
    p.text = f"{college} • Team {team_name}"
    p.font.size = Pt(24)

    # 2. VENTURE BACKGROUND
    slide = add_diagram_slide(prs, "Venture Background: Context Mapping")
    add_corner_logo(slide)
    add_text_to_slide(slide, f"Domain: {data.get('s2_domain', 'N/A')}", Inches(1), Inches(1.5), Inches(8), Inches(1), size=20)
    add_text_to_slide(slide, f"Context:\n{data.get('s2_context', 'N/A')}", Inches(1), Inches(2.5), Inches(8), Inches(2), size=14)
    add_text_to_slide(slide, f"Root Driver: {data.get('s2_rootReason', 'N/A')}", Inches(1), Inches(5), Inches(8), Inches(1), size=16)

    # 3. PROBLEM FRAMING
    slide = add_diagram_slide(prs, "Problem Framing & Stakeholders")
    add_corner_logo(slide)
    add_text_to_slide(slide, "CORE CHALLENGE", Inches(1), Inches(1.5), Inches(8), Inches(0.5), size=16)
    add_text_to_slide(slide, data.get('s3_coreProblem', 'N/A'), Inches(1), Inches(2.2), Inches(8), Inches(1.5), size=14)
    add_text_to_slide(slide, f"Affected: {data.get('s3_affected', 'N/A')}", Inches(1), Inches(4), Inches(8), Inches(0.5), size=14)
    add_text_to_slide(slide, f"Significance: {data.get('s3_whyItMatters', 'N/A')}", Inches(1), Inches(5), Inches(8), Inches(0.5), size=14)

    # 4. IMPACT MAPPING
    slide = add_diagram_slide(prs, "Impact Mapping: Pain Points (Expanded)")
    add_corner_logo(slide)
    pain_points = data.get('s4_painPoints', [])
    if not isinstance(pain_points, list): pain_points = []
    draw_impact_graph_detailed(slide, pain_points)

    # 5. STAKEHOLDER SEGMENTS
    slide = add_diagram_slide(prs, "Stakeholder Segmentation")
    add_corner_logo(slide)
    add_text_to_slide(slide, f"Primary Users: {data.get('s5_primaryUsers', 'N/A')}", Inches(1), Inches(2), Inches(8), Inches(1.5), size=16)
    add_text_to_slide(slide, f"Secondary Users: {data.get('s5_secondaryUsers', 'N/A')}", Inches(1), Inches(4), Inches(8), Inches(1.5), size=16)

    # 6. PERSONA & JTBD (High Fidelity)
    slide = add_diagram_slide(prs, "Customer Persona: Empathy Spectrum")
    add_corner_logo(slide)
    
    # Left Sidebar - Demographics
    sidebar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.5), Inches(1.0), Inches(2.5), Inches(6.0))
    sidebar.fill.solid()
    sidebar.fill.fore_color.rgb = RGBColor(245, 158, 11) # Orange
    sidebar.line.color.rgb = RGBColor(245, 158, 11)
    
    # Placeholder for Photo
    photo_box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.7), Inches(1.2), Inches(2.1), Inches(1.8))
    photo_box.fill.solid()
    photo_box.fill.fore_color.rgb = RGBColor(255, 255, 255)
    
    # Name & Ethos
    add_text_to_slide(slide, data.get('s6_customerName', 'PERSONA'), Inches(0.5), Inches(3.1), Inches(2.5), Inches(0.5), size=14, bold=True, color=RGBColor(255,255,255))
    add_text_to_slide(slide, data.get('s6_customerEthos', 'Contextual Identity'), Inches(0.5), Inches(3.4), Inches(2.5), Inches(0.4), size=10, italic=True, color=RGBColor(255,255,255))
    
    # Demographics
    demo_text = f"Age: {data.get('s6_customerAge', 'N/A')}\nJob: {data.get('s6_customerJob', 'N/A')}\nLoc: {data.get('s6_customerLocation', 'N/A')}"
    add_text_to_slide(slide, demo_text, Inches(0.6), Inches(3.9), Inches(2.3), Inches(1), size=11, color=RGBColor(255,255,255))
    
    # Personality Sliders
    add_text_to_slide(slide, "Personality", Inches(0.6), Inches(5.1), Inches(2.3), Inches(0.3), size=10, bold=True, color=RGBColor(255,255,255))
    persistence = data.get('s6_personality', {})
    if not isinstance(persistence, dict): persistence = {}
    
    for i, lab in enumerate(pers_labels):
        y = 5.4 + (i*0.35)
        slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(0.7), Inches(y), Inches(2.3), Inches(y)).line.color.rgb = RGBColor(255,255,255)
        dot = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(1.5), Inches(y-0.05), Inches(0.1), Inches(0.1))
        dot.fill.solid()
        dot.fill.fore_color.rgb = RGBColor(255,255,255)

    # Top Content Boxes
    goal_box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(3.2), Inches(1.0), Inches(4.5), Inches(1.2))
    goal_box.fill.solid()
    goal_box.fill.fore_color.rgb = RGBColor(245, 158, 11)
    add_text_to_slide(slide, f"Core Goals:\n{data.get('s6_goals', 'N/A')}", Inches(3.3), Inches(1.1), Inches(4.3), Inches(1.0), size=11, color=RGBColor(255,255,255), bold=True)
    
    frust_box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(3.2), Inches(2.4), Inches(4.5), Inches(1.2))
    frust_box.fill.solid()
    frust_box.fill.fore_color.rgb = RGBColor(253, 186, 116)
    add_text_to_slide(slide, f"Frustrations:\n{data.get('s6_pains', 'N/A')}", Inches(3.3), Inches(2.5), Inches(4.3), Inches(1.0), size=11, color=RGBColor(255,255,255), bold=True)
    
    # Bio
    add_text_to_slide(slide, f"Bio:\n{data.get('s6_bio', 'N/A')}", Inches(3.2), Inches(3.8), Inches(4.5), Inches(3.0), size=11)

    # Motivations (Right)
    add_text_to_slide(slide, "Motivations", Inches(8.0), Inches(1.0), Inches(1.5), Inches(0.4), size=12, bold=True, color=RGBColor(245, 158, 11))
    for i, label in enumerate(["Growth", "Fear", "Security", "Recognition", "Funding"]):
        y = 1.4 + (i*0.8)
        add_text_to_slide(slide, label, Inches(8.0), Inches(y), Inches(1.5), Inches(0.3), size=8)
        bar_bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(8.0), Inches(y+0.25), Inches(1.5), Inches(0.12))
        bar_bg.fill.solid()
        bar_bg.fill.fore_color.rgb = RGBColor(230,230,230)
        
        bar_val = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(8.0), Inches(y+0.25), Inches(0.8), Inches(0.12))
        bar_val.fill.solid()
        bar_val.fill.fore_color.rgb = RGBColor(245, 158, 11)

    # 7. VALUE PROPOSITION CANVAS (High Fidelity)
    slide = add_diagram_slide(prs, "Value Proposition Canvas")
    add_corner_logo(slide)
    
    # Left Square - Value Map
    v_map = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.5), Inches(1.5), Inches(4.0), Inches(4.0))
    v_map.line.color.rgb = RGBColor(13, 148, 136) # Teal
    v_map.fill.background()
    # Cross
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(0.5), Inches(3.5), Inches(4.5), Inches(3.5)).line.color.rgb = RGBColor(13, 148, 136)
    
    add_text_to_slide(slide, "GAIN CREATORS", Inches(0.6), Inches(1.6), Inches(3.8), Inches(0.3), size=11, color=RGBColor(13, 148, 136), bold=True)
    add_text_to_slide(slide, data.get('s6_gains', 'Proactive benefits...'), Inches(0.6), Inches(1.9), Inches(3.8), Inches(1.5), size=10)
    
    add_text_to_slide(slide, "PAIN KILLERS", Inches(0.6), Inches(3.6), Inches(3.8), Inches(0.3), size=11, color=RGBColor(13, 148, 136), bold=True)
    add_text_to_slide(slide, data.get('s6_pains', 'Risk mitigation...'), Inches(0.6), Inches(3.9), Inches(3.8), Inches(1.5), size=10)
    
    # Right Circle - Customer Profile
    c_prof = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(5.5), Inches(1.5), Inches(4.0), Inches(4.0))
    c_prof.line.color.rgb = RGBColor(245, 158, 11) # Orange
    c_prof.fill.background()
    # Cross in circle
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(5.5), Inches(3.5), Inches(7.5), Inches(3.5)).line.color.rgb = RGBColor(245, 158, 11)
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(7.5), Inches(1.5), Inches(7.5), Inches(5.5)).line.color.rgb = RGBColor(245, 158, 11)
    
    add_text_to_slide(slide, "GAINS", Inches(5.8), Inches(1.6), Inches(1.5), Inches(0.3), size=11, color=RGBColor(245, 158, 11), bold=True)
    add_text_to_slide(slide, "PAINS", Inches(5.8), Inches(3.6), Inches(1.5), Inches(0.3), size=11, color=RGBColor(245, 158, 11), bold=True)
    add_text_to_slide(slide, "CUSTOMER JOBS", Inches(7.7), Inches(2.5), Inches(1.6), Inches(0.5), size=11, color=RGBColor(245, 158, 11), bold=True)

    # 8. PROPOSED SOLUTION
    slide = add_diagram_slide(prs, "Proposed Solution & Sequential Logic")
    add_corner_logo(slide)
    add_text_to_slide(slide, data.get('s8_oneline', 'N/A'), Inches(1), Inches(1.2), Inches(8), Inches(0.8), size=24)
    add_text_to_slide(slide, f"Mechanism: {data.get('s8_howItWorks', 'N/A')}", Inches(1), Inches(2.2), Inches(8), Inches(0.8), size=14)
    # Draw flow
    raw_flow = data.get('s8_flowSteps', [])
    if not isinstance(raw_flow, list): raw_flow = []
    flow_steps = [s for s in raw_flow if isinstance(s, str) and s.strip()]
    if flow_steps:
        draw_flow_diagram(slide, " -> ".join(flow_steps))
    elif data.get('s8_flow'): # Legacy fallback
        draw_flow_diagram(slide, data.get('s8_flow'))

    # 9. LEAN CANVAS (High Fidelity Grid)
    slide = add_diagram_slide(prs, "Strategic Framework: Lean Canvas")
    add_corner_logo(slide)
    
    width_col = 1.8
    config = [
        ("PROBLEM", 's9_leanProblem', 0.5, 4.0),
        ("SOLUTION", 's9_leanSolution', 0.5+width_col, 2.0),
        ("USP", 's9_leanUSP', 0.5+2*width_col, 4.0),
        ("UNFAIR ADV", 's9_leanUnfair', 0.5+3*width_col, 2.0),
        ("CUSTOMER SEG", 's9_leanSegments', 0.5+4*width_col, 4.0)
    ]
    
    for label, key, x, h in config:
        box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(1.2), Inches(width_col-0.1), Inches(h))
        box.line.color.rgb = RGBColor(15, 23, 42) # Navy
        box.fill.background()
        add_text_to_slide(slide, label, Inches(x+0.1), Inches(1.25), Inches(width_col-0.2), Inches(0.3), size=9, bold=True, color=RGBColor(15, 23, 42))
        add_text_to_slide(slide, data.get(key, 'N/A'), Inches(x+0.1), Inches(1.6), Inches(width_col-0.2), Inches(h-0.5), size=8)

    # Sub-boxes (Metrics & Channels)
    add_text_to_slide(slide, "METRICS", Inches(0.5+width_col), Inches(3.3), Inches(width_col-0.1), Inches(0.2), size=8, bold=True, color=RGBColor(15, 23, 42))
    add_text_to_slide(slide, data.get('s9_leanMetrics', 'N/A'), Inches(0.5+width_col), Inches(3.6), Inches(width_col-0.1), Inches(1.5), size=7)
    
    add_text_to_slide(slide, "CHANNELS", Inches(0.5+3*width_col), Inches(3.3), Inches(width_col-0.1), Inches(0.2), size=8, bold=True, color=RGBColor(15, 23, 42))
    add_text_to_slide(slide, data.get('s9_leanChannels', 'N/A'), Inches(0.5+3*width_col), Inches(3.6), Inches(width_col-0.1), Inches(1.5), size=7)

    # Bottom Row
    add_text_to_slide(slide, "COST STRUCTURE", Inches(0.5), Inches(5.3), Inches(4.5), Inches(0.3), size=9, bold=True, color=RGBColor(244, 63, 94))
    add_text_to_slide(slide, data.get('s9_leanCosts', 'N/A'), Inches(0.6), Inches(5.6), Inches(4), Inches(0.8), size=8)
    
    add_text_to_slide(slide, "REVENUE STREAMS", Inches(5.0), Inches(5.3), Inches(4.5), Inches(0.3), size=9, bold=True, color=RGBColor(16, 185, 129))
    add_text_to_slide(slide, data.get('s9_leanRevenue', 'N/A'), Inches(5.1), Inches(5.6), Inches(4), Inches(0.8), size=8)

    # 10. VALUE BALLOON
    slide = add_diagram_slide(prs, "Value Identification: Advanced Balloon")
    add_corner_logo(slide)
    
    def format_list(val):
        if isinstance(val, list): return "\n".join([f"• {x}" for x in val if x.strip()])
        return str(val) if val else "N/A"

    lifts = format_list(data.get('s10_lifts', []))
    pulls = format_list(data.get('s10_pulls', []))
    fuels = format_list(data.get('s10_fuels', []))
    outcomes = format_list(data.get('s10_outcomes', []))
    draw_hot_air_balloon_detailed(slide, lifts, pulls, fuels, outcomes)

    # 11. MARKET POSITIONING
    slide = add_diagram_slide(prs, "Market Positioning Matrix")
    add_corner_logo(slide)
    add_competitor_table(slide, data.get('s11_competitors', []))

    # 12. REVENUE MODEL
    slide = add_diagram_slide(prs, "Business & Revenue Model")
    add_corner_logo(slide)
    add_text_to_slide(slide, f"Revenue Model: {data.get('s12_revenueModel', 'N/A')}", Inches(1), Inches(2), Inches(8), Inches(1.5), size=18)
    add_text_to_slide(slide, f"Pricing Logic: {data.get('s12_pricingLogic', 'N/A')}", Inches(1), Inches(4), Inches(8), Inches(1), size=16)

    # 13. FINANCIAL ANALYSIS
    slide = add_diagram_slide(prs, "Financial Analysis & Costs")
    add_corner_logo(slide)
    add_cost_breakdown_table(slide, 
        data.get('s13_devCost', '$0'), 
        data.get('s13_opsCost', '$0'), 
        data.get('s13_toolsCost', '$0'))

    # 14. SUCCESS & VISION
    add_bullet_slide(prs, "Impact Assessment & Trajectory", [
        f"Social/Economic: {data.get('s14_socialEconomic', 'N/A')}",
        f"Key Metrics: {data.get('s14_metrics', 'N/A')}",
        f"Future Vision: {data.get('s14_vision', 'N/A')}"
    ])

    # 15. SYNTHESIS CLOSURE
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_corner_logo(slide)
    add_text_to_slide(slide, "VENTURE SYNTHESIS COMPLETE.", Inches(1), Inches(2.5), Inches(8), Inches(1), size=36)
    add_text_to_slide(slide, "A professional investor-grade artifact generated by the Institutional Standard Engine.", Inches(1), Inches(4), Inches(8), Inches(1), size=18)

    # Save
    if not os.path.exists('ppt_outputs'):
        os.makedirs('ppt_outputs')
    
    file_path = f"ppt_outputs/{team_name.lower().replace(' ', '_')}_pitch_artifact.pptx"
    prs.save(file_path)
    return file_path
# --- Helper Functions ---

def add_bullet_slide(prs, title_text, bullets):
    slide = prs.slides.add_slide(prs.slide_layouts[1])
    slide.shapes.title.text = title_text
    tf = slide.placeholders[1].text_frame
    for b in bullets:
        p = tf.add_paragraph()
        p.text = str(b)
        p.level = 0

def add_diagram_slide(prs, title_text):
    slide = prs.slides.add_slide(prs.slide_layouts[6]) 
    title_box = slide.shapes.add_textbox(Inches(0.5), Inches(0.2), Inches(9), Inches(0.8))
    tf = title_box.text_frame
    tf.text = title_text
    tf.paragraphs[0].font.size = Pt(28)
    tf.paragraphs[0].font.bold = True
    return slide

def add_text_to_slide(slide, text, left, top, width, height, size=18, color=None, bold=False, italic=False):
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(size)
    p.font.bold = bold
    p.font.italic = italic
    if color:
        p.font.color.rgb = color

def draw_impact_graph_detailed(slide, pain_points):
    # Axes
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(1), Inches(6), Inches(9), Inches(6)) # X
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(1), Inches(6), Inches(1), Inches(1.5)) # Y
    add_text_to_slide(slide, "Probability / Frequency", Inches(4), Inches(6.1), Inches(4), Inches(0.5), size=12)
    add_text_to_slide(slide, "Impact Severity", Inches(0.1), Inches(3), Inches(0.8), Inches(1), size=10)
    
    mapping = {"Low": 1, "Medium": 2, "High": 3, "Rare": 1, "Occasional": 2, "Frequent": 3}
    colors = [RGBColor(57, 204, 204), RGBColor(0, 116, 217), RGBColor(1, 22, 39)]

    for i, pp in enumerate(pain_points[:10]):
        if not isinstance(pp, dict) or not pp.get('point'): continue
        x_val = mapping.get(pp.get('freq'), 2) * 2.5
        y_val = 6 - (mapping.get(pp.get('impact'), 2) * 1.4)
        dot = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(1+x_val), Inches(y_val), Inches(0.3), Inches(0.3))
        dot.fill.solid()
        dot.fill.fore_color.rgb = colors[i % 3]
        add_text_to_slide(slide, f"{i+1}", Inches(1+x_val), Inches(y_val), Inches(0.4), Inches(0.4), size=8)
        # Add legend or small text
        add_text_to_slide(slide, f"{i+1}. {pp.get('point')[:20]}...", Inches(1.3+x_val), Inches(y_val), Inches(2), Inches(0.5), size=7)

def draw_hot_air_balloon_detailed(slide, lifts, pulls, fuels, outcomes):
    balloon = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(3.5), Inches(1.5), Inches(3), Inches(2.5))
    balloon.fill.solid()
    balloon.fill.fore_color.rgb = RGBColor(0, 116, 217)
    add_text_to_slide(slide, f"LIFTS:\n{lifts}", Inches(3.7), Inches(1.8), Inches(2.6), Inches(1.2), size=10)
    
    basket = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(4.5), Inches(4.5), Inches(1), Inches(0.8))
    basket.fill.solid()
    basket.fill.fore_color.rgb = RGBColor(100, 100, 100)
    add_text_to_slide(slide, f"PULLS:\n{pulls}", Inches(3.5), Inches(5.4), Inches(3), Inches(1.2), size=10)
    
    fuel_box = slide.shapes.add_shape(MSO_SHAPE.HEXAGON, Inches(1.0), Inches(2.5), Inches(2.2), Inches(1.5))
    fuel_box.fill.solid()
    fuel_box.fill.fore_color.rgb = RGBColor(57, 204, 204)
    add_text_to_slide(slide, f"FUEL STR:\n{fuels}", Inches(1.1), Inches(2.6), Inches(2), Inches(1.2), size=9)

    add_text_to_slide(slide, f"ALTITUDE / OUTCOMES:\n{outcomes}", Inches(7.0), Inches(2.5), Inches(2.5), Inches(1.5), size=10)
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(4), Inches(3.8), Inches(4.5), Inches(4.5))
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(6), Inches(3.8), Inches(5.5), Inches(4.5))

def add_competitor_table(slide, competitors):
    table = slide.shapes.add_table(3, 3, Inches(0.5), Inches(1.5), Inches(9), Inches(3)).table
    headers = ["Competitor", "Strengths", "Weaknesses / Edge"]
    for i, h in enumerate(headers):
        table.cell(0, i).text = h
    
    for i, c in enumerate(competitors[:2]):
        table.cell(i+1, 0).text = c.get('name', 'N/A')
        table.cell(i+1, 1).text = c.get('strength', 'N/A')
        table.cell(i+1, 2).text = c.get('weakness', 'N/A')

def add_cost_breakdown_table(slide, dev, ops, tools):
    table = slide.shapes.add_table(4, 2, Inches(2), Inches(1.5), Inches(6), Inches(3)).table
    rows = [("Development", dev), ("Operational", ops), ("Infrastructure", tools), ("TOTAL ESTIMATED", "PROJECT SUM")]
    for i, (l, v) in enumerate(rows):
        table.cell(i, 0).text = l
        table.cell(i, 1).text = v

def draw_flow_diagram(slide, flow):
    components = flow.split(' -> ')[:10]
    for i, comp in enumerate(components):
        row = i // 5
        col = i % 5
        box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.5 + col*1.9), Inches(3.5 + row*1.5), Inches(1.7), Inches(0.8))
        box.fill.solid()
        box.fill.fore_color.rgb = RGBColor(0, 116, 217)
        add_text_to_slide(slide, comp.strip(), Inches(0.5 + col*1.9), Inches(3.6 + row*1.5), Inches(1.7), Inches(0.6), size=9)
        if i < len(components)-1 and (i+1)%5 != 0:
            slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(2.2 + col*1.9), Inches(3.9 + row*1.5), Inches(2.4 + col*1.9), Inches(3.9 + row*1.5))
