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
    slide = add_diagram_slide(prs, "Impact Mapping: Pain Points")
    add_corner_logo(slide)
    draw_impact_graph_detailed(slide, data.get('s4_painPoints', []))

    # 5. STAKEHOLDER SEGMENTS
    slide = add_diagram_slide(prs, "Stakeholder Segmentation")
    add_corner_logo(slide)
    add_text_to_slide(slide, f"Primary Users: {data.get('s5_primaryUsers', 'N/A')}", Inches(1), Inches(2), Inches(8), Inches(1.5), size=16)
    add_text_to_slide(slide, f"Secondary Users: {data.get('s5_secondaryUsers', 'N/A')}", Inches(1), Inches(4), Inches(8), Inches(1.5), size=16)

    # 6. PERSONA & JTBD
    slide = add_diagram_slide(prs, "Empathy Mapping: Persona & JTBD")
    add_corner_logo(slide)
    table = slide.shapes.add_table(2, 2, Inches(1), Inches(2), Inches(8), Inches(3)).table
    table.cell(0, 0).text = "User Persona"
    table.cell(0, 1).text = data.get('s6_personaDetails', 'N/A')
    table.cell(1, 0).text = "Jobs, Pains & Gains"
    table.cell(1, 1).text = data.get('s6_jobsPainsGains', 'N/A')

    # 7. GAP ANALYSIS
    slide = add_diagram_slide(prs, "Gap Analysis: Alternatives")
    add_corner_logo(slide)
    add_text_to_slide(slide, f"Alternatives: {data.get('s7_alternatives', 'N/A')}", Inches(1), Inches(2), Inches(8), Inches(1.5), size=16)
    add_text_to_slide(slide, f"Limitations: {data.get('s7_limitations', 'N/A')}", Inches(1), Inches(4), Inches(8), Inches(1.5), size=16)

    # 8. PROPOSED SOLUTION
    slide = add_diagram_slide(prs, "Proposed Solution: Synthesis")
    add_corner_logo(slide)
    add_text_to_slide(slide, data.get('s8_oneline', 'N/A'), Inches(1), Inches(1.5), Inches(8), Inches(1), size=24)
    add_text_to_slide(slide, f"Mechanism: {data.get('s8_howItWorks', 'N/A')}", Inches(1), Inches(3), Inches(8), Inches(1.5), size=14)
    draw_flow_diagram(slide, data.get('s8_flow', 'Input->Process->Output'))

    # 9. CORE FEATURES
    add_bullet_slide(prs, "Prioritized Features & Differentiators", [
        f"Core Features: {data.get('s9_coreFeatures', 'N/A')}",
        f"Differentiators: {data.get('s9_differentiators', 'N/A')}",
        "Venture Edge: Integrated Design Synthesis"
    ])

    # 10. VALUE BALLOON
    slide = add_diagram_slide(prs, "Value Identification: Balloon Activity")
    add_corner_logo(slide)
    draw_hot_air_balloon_detailed(slide, 
        data.get('s10_lifts', 'Value'), 
        data.get('s10_pulls', 'Risks'), 
        data.get('s10_fuels', 'Tech'), 
        data.get('s10_outcome', 'Vision'))

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
    
    file_path = f"ppt_outputs/{team_name.replace(' ', '_')}_venture_journey.pptx"
    prs.save(file_path)
    return file_path

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
