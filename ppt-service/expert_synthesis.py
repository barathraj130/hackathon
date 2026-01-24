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

    # 1. TITLE & CONTEXT
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_corner_logo(slide)
    tx = slide.shapes.add_textbox(Inches(1), Inches(3), Inches(8), Inches(2))
    tf = tx.text_frame
    tf.text = data.get('projectName', 'VENTURE TITLE')
    tf.paragraphs[0].font.size = Pt(44)
    tf.paragraphs[0].font.bold = True
    tf.paragraphs[0].font.name = "Arial" # Standard clean sans-serif

    p = tf.add_paragraph()
    p.text = f"{college} • Team {team_name}"
    p.font.size = Pt(24)
    p.font.bold = False

    # 2. CONTEXT / BACKGROUND
    slide = add_diagram_slide(prs, "Venture Background: Context Mapping")
    add_corner_logo(slide)
    add_text_to_slide(slide, f"Real-world Context:\n{data.get('s2_context', 'N/A')}", Inches(1), Inches(2), Inches(8), Inches(2), size=20)
    add_text_to_slide(slide, f"Domain / Region: {data.get('s2_domain', 'Global')}", Inches(1), Inches(5), Inches(8), Inches(1), size=18)

    # 3. PROBLEM & IMPACT
    slide = add_diagram_slide(prs, "Problem & Impact Breakdown")
    add_corner_logo(slide)
    # 2-column layout
    add_text_to_slide(slide, "CORE PROBLEM", Inches(1), Inches(1.5), Inches(3.5), Inches(0.5), size=16)
    add_text_to_slide(slide, data.get('s3_problem', 'N/A'), Inches(1), Inches(2.2), Inches(3.5), Inches(3), size=14)
    
    add_text_to_slide(slide, "STAKEHOLDER IMPACT", Inches(5.5), Inches(1.5), Inches(3.5), Inches(0.5), size=16)
    add_text_to_slide(slide, data.get('s3_affected', 'N/A'), Inches(5.5), Inches(2.2), Inches(3.5), Inches(3), size=14)

    # 4. PROBLEM ANALYSIS
    slide = add_diagram_slide(prs, "Root-Cause Analysis")
    add_corner_logo(slide)
    add_text_to_slide(slide, "Primary Root Causes:", Inches(1), Inches(1.5), Inches(8), Inches(0.5), size=16)
    add_text_to_slide(slide, data.get('s4_rootCauses', 'N/A'), Inches(1), Inches(2), Inches(8), Inches(1.5), size=14)
    add_text_to_slide(slide, "Why existing solutions fail:", Inches(1), Inches(4), Inches(8), Inches(0.5), size=16)
    add_text_to_slide(slide, data.get('s4_failureAnalysis', 'N/A'), Inches(1), Inches(4.5), Inches(8), Inches(1.5), size=14)

    # 5. CUSTOMER SEGMENTS
    slide = add_diagram_slide(prs, "Stakeholder Segmentation")
    add_corner_logo(slide)
    segments = data.get('s5_customerSegments', 'N/A').split(',')
    for i, s in enumerate(segments[:4]):
        box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1 + i*2.2), Inches(2.5), Inches(2), Inches(1.5))
        box.fill.solid()
        box.fill.fore_color.rgb = RGBColor(0, 116, 217)
        add_text_to_slide(slide, s.strip(), Inches(1 + i*2.2), Inches(2.8), Inches(2), Inches(1), size=12)

    # 6. USER PERSONA & JTBD
    slide = add_diagram_slide(prs, "Empathy Mapping: Persona & JTBD")
    add_corner_logo(slide)
    table = slide.shapes.add_table(2, 2, Inches(1), Inches(2), Inches(8), Inches(3)).table
    table.cell(0, 0).text = "User Persona"
    table.cell(0, 1).text = data.get('s6_persona', 'N/A')
    table.cell(1, 0).text = "Jobs To Be Done"
    table.cell(1, 1).text = data.get('s6_jtbd', 'N/A')

    # 7. ALTERNATIVES & GAPS
    slide = add_diagram_slide(prs, "Gap Analysis: Alternatives")
    add_corner_logo(slide)
    add_text_to_slide(slide, f"Current Alternatives: {data.get('s7_alternatives', 'N/A')}", Inches(1), Inches(2), Inches(8), Inches(1.5), size=16)
    add_text_to_slide(slide, f"Unaddressed Gaps: {data.get('s7_gaps', 'N/A')}", Inches(1), Inches(4), Inches(8), Inches(1.5), size=16)

    # 8. SOLUTION OVERVIEW
    slide = add_diagram_slide(prs, "Solution Synthesis")
    add_corner_logo(slide)
    add_text_to_slide(slide, f"One-line Solution: {data.get('s8_solution', 'N/A')}", Inches(1), Inches(1.8), Inches(8), Inches(1), size=20)
    draw_flow_diagram(slide, data.get('s8_flow', 'Input->Process->Output'))

    # 9. DESIGN & FEATURES
    add_bullet_slide(prs, "Solution Design & Prioritized Features", [
        f"Key Features: {data.get('s9_features', 'N/A')}",
        f"Differentiation: {data.get('s9_differentiation', 'N/A')}",
        "Venture Edge: Proprietary Workflow Integration"
    ])

    # 10. VALUE IDENTIFICATION (BALLOON)
    slide = add_diagram_slide(prs, "Balloon Activity: Value vs Constraints")
    add_corner_logo(slide)
    draw_hot_air_balloon_detailed(slide, 
        data.get('s10_lifts', 'Value Drivers'),
        data.get('s10_pulls', 'Constraints'),
        data.get('s10_fuels', 'Tech Fuel'),
        data.get('s10_outcome', 'Visionary Altitude'))

    # 11. MARKET & COMPETITORS
    slide = add_diagram_slide(prs, "Market Positioning & Competitors")
    add_corner_logo(slide)
    add_competitor_table(slide, data.get('s11_competitors', []))

    # 12. BUSINESS MODEL
    slide = add_diagram_slide(prs, "Strategic Revenue Model")
    add_corner_logo(slide)
    add_text_to_slide(slide, data.get('s12_revenueModel', 'N/A'), Inches(1), Inches(2), Inches(8), Inches(4), size=18)

    # 13. FINANCIAL EVALUATION
    slide = add_diagram_slide(prs, "Financial Breakdown")
    add_corner_logo(slide)
    add_cost_breakdown_table(slide, 
        data.get('s13_devCost', '$0'), 
        data.get('s13_opsCost', '$0'), 
        data.get('s13_toolsCost', '$0'))

    # 14. METRICS & FUTURE
    add_bullet_slide(prs, "Impact Assessment & Trajectory", [
        f"Success Metrics: {data.get('s14_metrics', 'N/A')}",
        f"Short-term Impact: {data.get('s14_shortTerm', 'N/A')}",
        f"Long-term Vision: {data.get('s14_longTerm', 'N/A')}"
    ])

    # 15. CLOSING / THANK YOU
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_corner_logo(slide)
    add_text_to_slide(slide, "THANK YOU.", Inches(1), Inches(3), Inches(8), Inches(1), size=44)
    add_text_to_slide(slide, "Revolutionizing Venture Potential through Design Synthesis.", Inches(1), Inches(4.2), Inches(8), Inches(1), size=18)

    # Save
    if not os.path.exists('ppt_outputs'):
        os.makedirs('ppt_outputs')
    
    file_path = f"ppt_outputs/{team_name.replace(' ', '_')}_venture_pitch.pptx"
    prs.save(file_path)
    return file_path

    # Save
    if not os.path.exists('ppt_outputs'):
        os.makedirs('ppt_outputs')
    
    file_path = f"ppt_outputs/{team_name.replace(' ', '_')}_expert_pitch.pptx"
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

def add_text_to_slide(slide, text, left, top, width, height, size=18):
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(size)

def draw_impact_graph_detailed(slide, pain_points):
    # Axes
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(1), Inches(4.5), Inches(8), Inches(4.5))
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(1), Inches(4.5), Inches(1), Inches(1.5))
    add_text_to_slide(slide, "Frequency", Inches(4), Inches(4.6), Inches(2), Inches(0.5))
    add_text_to_slide(slide, "Impact", Inches(0.2), Inches(3), Inches(1), Inches(0.5), size=14)
    
    mapping = {"Low": 1, "Medium": 2, "High": 3, "Rare": 1, "Occasional": 2, "Frequent": 3}
    colors = [RGBColor(57, 204, 204), RGBColor(0, 116, 217), RGBColor(1, 22, 39)]

    for i, pp in enumerate(pain_points[:3]):
        x = mapping.get(pp.get('freq'), 2) * 2
        y = 4.5 - (mapping.get(pp.get('impact'), 2))
        dot = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(1+x), Inches(y), Inches(0.4), Inches(0.4))
        dot.fill.solid()
        dot.fill.fore_color.rgb = colors[i % 3]
        add_text_to_slide(slide, pp.get('point', 'Point'), Inches(1.2+x), Inches(y), Inches(2), Inches(0.5), size=10)

def draw_hot_air_balloon_detailed(slide, lifts, pulls, fuels, outcome):
    balloon = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(3.5), Inches(1.5), Inches(3), Inches(3))
    balloon.fill.solid()
    balloon.fill.fore_color.rgb = RGBColor(0, 116, 217)
    add_text_to_slide(slide, f"LIFTS:\n{lifts}", Inches(3.7), Inches(2.2), Inches(2.6), Inches(1.5), size=12)
    
    basket = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(4.5), Inches(5), Inches(1), Inches(0.8))
    basket.fill.solid()
    basket.fill.fore_color.rgb = RGBColor(100, 100, 100)
    add_text_to_slide(slide, f"PULLS:\n{pulls}", Inches(4.2), Inches(5.8), Inches(1.6), Inches(1), size=12)
    
    fuel_box = slide.shapes.add_shape(MSO_SHAPE.HEXAGON, Inches(1.5), Inches(3), Inches(1.8), Inches(1.2))
    fuel_box.fill.solid()
    fuel_box.fill.fore_color.rgb = RGBColor(57, 204, 204)
    add_text_to_slide(slide, f"FUEL:\n{fuels}", Inches(1.6), Inches(3.2), Inches(1.6), Inches(0.8), size=11)

    add_text_to_slide(slide, f"OUTCOME: {outcome}", Inches(3.5), Inches(0.8), Inches(3), Inches(0.4), size=14)
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(4), Inches(4), Inches(4.5), Inches(5))
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(6), Inches(4), Inches(5.5), Inches(5))

def draw_concentric_circles_labeled(slide, tam, sam, som):
    labels = [tam, sam, som]
    sizes = [4.5, 3.0, 1.5]
    colors = [RGBColor(0, 31, 63), RGBColor(0, 116, 217), RGBColor(57, 204, 204)]
    for i in range(3):
        s = Inches(sizes[i])
        shp = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(5 - sizes[i]/2), Inches(3.8 - sizes[i]/2), s, s)
        shp.fill.solid()
        shp.fill.fore_color.rgb = colors[i]
        text = ["TAM", "SAM", "SOM"][i]
        add_text_to_slide(slide, f"{text}:\n{labels[i]}", Inches(5 - sizes[i]/2 + 0.2), Inches(3.8 - sizes[i]/2 + 0.5), Inches(2), Inches(1), size=12)

def add_competitor_table(slide, competitors):
    table = slide.shapes.add_table(3, 3, Inches(0.5), Inches(1.5), Inches(9), Inches(3)).table
    headers = ["Competitor", "Strengths", "Gaps / Your Edge"]
    for i, h in enumerate(headers):
        table.cell(0, i).text = h
    
    for i, c in enumerate(competitors[:2]):
        table.cell(i+1, 0).text = c.get('name', 'N/A')
        table.cell(i+1, 1).text = c.get('strength', 'N/A')
        table.cell(i+1, 2).text = c.get('gap', 'N/A')

def add_cost_breakdown_table(slide, dev, ops, tools):
    table = slide.shapes.add_table(4, 2, Inches(2), Inches(1.5), Inches(6), Inches(3)).table
    rows = [("Development", dev), ("Operational", ops), ("Infrastructure", tools), ("TOTAL ESTIMATED", "PROJECT SUM")]
    for i, (l, v) in enumerate(rows):
        table.cell(i, 0).text = l
        table.cell(i, 1).text = v

def draw_growth_chart(slide, reason):
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(1), Inches(4.5), Inches(8), Inches(2))
    add_text_to_slide(slide, f"Market Growth Axis: {reason}", Inches(1.5), Inches(2.2), Inches(6), Inches(1), size=14)

def draw_flow_diagram(slide, flow):
    components = flow.split('->')[:4]
    for i, comp in enumerate(components):
        box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1 + i*2.2), Inches(3), Inches(1.8), Inches(1))
        box.fill.solid()
        box.fill.fore_color.rgb = RGBColor(0, 116, 217)
        add_text_to_slide(slide, comp.strip(), Inches(1 + i*2.2), Inches(3.2), Inches(1.8), Inches(0.6), size=11)
        if i < len(components)-1:
            slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(2.8 + i*2.2), Inches(3.5), Inches(3.2 + i*2.2), Inches(3.5))
