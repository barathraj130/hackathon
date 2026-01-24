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

    # --- 1. Organizational Identity ---
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_corner_logo(slide)
    tx_title = slide.shapes.add_textbox(Inches(0.5), Inches(0.5), Inches(9), Inches(1))
    tf = tx_title.text_frame
    tf.text = "Organizational Identity"
    tf.paragraphs[0].font.size = Pt(36)
    tf.paragraphs[0].font.bold = True

    left, top, width, height = Inches(1.5), Inches(2), Inches(7.5), Inches(5)
    tx_details = slide.shapes.add_textbox(left, top, width, height)
    tf_details = tx_details.text_frame
    tf_details.word_wrap = True

    details = [
        ("Product Name", data.get('projectName', 'N/A')),
        ("Team Name", f"• {team_name}"),
        ("College Name", college),
        ("Institutional Status", "Operational Hub v4.0")
    ]
    for label, value in details:
        p = tf_details.add_paragraph()
        p.text = f"{label} : {value}"
        p.font.size = Pt(28)
        p.space_after = Pt(14)

    # --- 2. Problem Statement (Design Activity: Problem Framing) ---
    add_bullet_slide(prs, "Problem Framing & Impact Mapping", [
        f"Core Inefficiency: {data.get('problemDescription', 'N/A')}",
        f"Stakeholder Impact: {data.get('targetUsers', 'General Public')}",
        "Criticality Index: High Infrastructure Dependency"
    ])

    # --- 3. Problem Identification (Visual: Impact Graph) ---
    slide = add_diagram_slide(prs, "Problem-Impact Grid")
    add_corner_logo(slide)
    draw_impact_graph(slide)
    add_text_to_slide(slide, "Design Context: Frequency vs Global Impact", Inches(0.5), Inches(5), Inches(8), Inches(1))

    # --- 4. Existing Limitations ---
    add_bullet_slide(prs, "Market Research: Existing Limitations", [
        f"Current Hurdles: {data.get('existingLimitations', 'N/A')}",
        "Shortcoming: Scalability & Dynamic Sync issues",
        "Result: Systemic technical debt"
    ])

    # --- 5. Proposed Solution (Visual: Flow Diagram) ---
    slide = add_diagram_slide(prs, "Proposed Solution: System Synthesis")
    add_corner_logo(slide)
    draw_arch_diagram(slide) # Using arch diagram for flow concept
    add_text_to_slide(slide, f"Solution: {data.get('proposedSolution', 'N/A')}", Inches(0.5), Inches(5.5), Inches(9), Inches(1))

    # --- 6. Value Identification (Design Activity: Balloon Activity) ---
    slide = add_diagram_slide(prs, "Balloon Activity: Value Identification")
    add_corner_logo(slide)
    # drivers (top), constraints (bottom), fuel (side), outcome (far top)
    draw_hot_air_balloon_labeled(slide, 
        data.get('drivers', 'Value Drivers'),
        data.get('constraints', 'System Weights'),
        data.get('fuel', 'Tech Fuel'),
        data.get('futureOutcome', 'Future Altitude'))

    # --- 7. Market Strategic Positioning ---
    slide = add_diagram_slide(prs, "TAM • SAM • SOM Analysis")
    add_corner_logo(slide)
    draw_concentric_circles(slide)
    add_text_to_slide(slide, f"Sector: {data.get('industrySegment', 'N/A')}", Inches(0.5), Inches(0.8), Inches(4), Inches(0.5))

    # --- 8. Competitive Landscape (Visual: Quadrant) ---
    slide = add_diagram_slide(prs, "Competitive Differentiation Matrix")
    add_corner_logo(slide)
    draw_quadrant(slide, "Integration", "Efficiency")
    add_text_to_slide(slide, f"Landscape: {data.get('competitors', 'Traditional Methods')}", Inches(0.5), Inches(6), Inches(9), Inches(1))

    # --- 9. Economic Model ---
    add_bullet_slide(prs, "Strategic Economic Strategy", [
        f"Revenue Methodology: {data.get('revenueModel', 'N/A')}",
        "Monetization: Scalable licensing & API access",
        "Market Expansion: Unified global sync"
    ])

    # --- 10. Cost & Value Analysis (Visual: Breakdown Table) ---
    slide = add_diagram_slide(prs, "Cost-Value Assessment Table")
    add_corner_logo(slide)
    add_cost_table(slide, data.get('costComponents', 'Development, Ops'), data.get('totalEstimatedCost', '$0'))
    add_text_to_slide(slide, f"Value Projection: {data.get('valueVsCost', 'High return')}", Inches(0.5), Inches(5.5), Inches(9), Inches(1))

    # --- 11. Technology Stack ---
    add_bullet_slide(prs, "High-Fidelity Technology Stack", [
        f"Primary Frameworks: {data.get('techStack', 'React, Node, Prisma')}",
        "Infrastructure: Serverless cloud nodes with SSL/TLS",
        "Intelligence: Behavioral data synthesis"
    ])

    # --- 12. System Architecture (Visual: Block Diagram) ---
    slide = add_diagram_slide(prs, "Technical Architecture Blueprint")
    add_corner_logo(slide)
    draw_arch_diagram(slide)
    add_text_to_slide(slide, data.get('architectureExplanation', 'System flow overview...'), Inches(0.5), Inches(5.5), Inches(9), Inches(1.5))

    # --- 13. Validation & Evidence ---
    add_bullet_slide(prs, "Validation & Quantifiable Metrics", [
        f"Evidence: {data.get('dataMetrics', 'N/A')}",
        f"Performance Indicator: {data.get('validationMetrics', 'Reliable synthesis')}",
        "Status: Prototype Verification Complete"
    ])

    # --- 14. Final Synthesis & Pitch Outlook ---
    add_bullet_slide(prs, "Strategic Conclusion & Next Step", [
        "Final Synthesis: System state stabilized",
        "Future Roadmap: Global scale & deployment",
        "Final Pitch: Professional Artifact Locked"
    ])

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

def draw_hot_air_balloon_labeled(slide, drivers, constraints, fuel, outcome):
    # Balloon (Drivers)
    balloon = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(3.5), Inches(1.5), Inches(3), Inches(3))
    balloon.fill.solid()
    balloon.fill.fore_color.rgb = RGBColor(0, 116, 217)
    add_text_to_slide(slide, f"Drivers (UP):\n{drivers}", Inches(3.7), Inches(2.2), Inches(2.6), Inches(1.5), size=14)
    
    # Basket (Constraints)
    basket = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(4.5), Inches(5), Inches(1), Inches(0.8))
    basket.fill.solid()
    basket.fill.fore_color.rgb = RGBColor(100, 100, 100)
    add_text_to_slide(slide, f"Weights (Constraints):\n{constraints}", Inches(3.5), Inches(6), Inches(3), Inches(0.8), size=14)
    
    # Fuel (Side Indicator)
    fuel_box = slide.shapes.add_shape(MSO_SHAPE.HEXAGON, Inches(7), Inches(3), Inches(1.8), Inches(1.2))
    fuel_box.fill.solid()
    fuel_box.fill.fore_color.rgb = RGBColor(57, 204, 204)
    add_text_to_slide(slide, f"FUEL:\n{fuel}", Inches(7.1), Inches(3.2), Inches(1.6), Inches(0.8), size=12)

    # Future Outcome (Top)
    add_text_to_slide(slide, f"Target Outcome: {outcome}", Inches(3), Inches(0.8), Inches(4), Inches(0.5), size=16)

    # Ropes
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(4), Inches(4), Inches(4.5), Inches(5))
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(6), Inches(4), Inches(5.5), Inches(5))

def add_cost_table(slide, components, total):
    rows, cols = 5, 2
    left, top, width, height = Inches(1), Inches(1.8), Inches(8), Inches(3)
    table_shape = slide.shapes.add_table(rows, cols, left, top, width, height)
    table = table_shape.table
    table.columns[0].width = Inches(5)
    table.columns[1].width = Inches(3)
    
    table.cell(0, 0).text = "Cost Component"
    table.cell(0, 1).text = "Estimated Budget"
    
    comp_list = components.split(',')[:3]
    for i, name in enumerate(comp_list):
        table.cell(i+1, 0).text = name.strip()
        table.cell(i+1, 1).text = "High Impact Allocation"
        
    table.cell(4, 0).text = "TOTAL ESTIMATED COST"
    table.cell(4, 1).text = total

def draw_impact_graph(slide):
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(1), Inches(4.5), Inches(8), Inches(4.5))
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(1), Inches(4.5), Inches(1), Inches(1.5))
    add_text_to_slide(slide, "Frequency", Inches(4), Inches(4.6), Inches(2), Inches(0.5))
    add_text_to_slide(slide, "Impact", Inches(0.2), Inches(3), Inches(1), Inches(0.5))
    circle = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(6), Inches(2), Inches(0.4), Inches(0.4))
    circle.fill.solid()
    circle.fill.fore_color.rgb = RGBColor(57, 204, 204)
    add_text_to_slide(slide, "Hurdle identified", Inches(6.5), Inches(2.1), Inches(2), Inches(0.5))

def draw_concentric_circles(slide):
    labels = ["TAM", "SAM", "SOM"]
    sizes = [4, 2.5, 1.2]
    colors = [RGBColor(0, 31, 63), RGBColor(0, 116, 217), RGBColor(57, 204, 204)]
    for i in range(3):
        s = Inches(sizes[i])
        shp = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(5 - sizes[i]/2), Inches(3.5 - sizes[i]/2), s, s)
        shp.fill.solid()
        shp.fill.fore_color.rgb = colors[i]
        add_text_to_slide(slide, labels[i], Inches(5 - 0.5), Inches(3.5 - sizes[i]/2 + 0.2), Inches(1), Inches(0.5))

def draw_quadrant(slide, x_label, y_label):
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(1), Inches(3.5), Inches(9), Inches(3.5))
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(5), Inches(1), Inches(5), Inches(6))
    add_text_to_slide(slide, x_label, Inches(8), Inches(3.6), Inches(2), Inches(0.5))
    add_text_to_slide(slide, y_label, Inches(5.1), Inches(1.1), Inches(2), Inches(0.5))
    star = slide.shapes.add_shape(MSO_SHAPE.STAR_5_POINT, Inches(7), Inches(2), Inches(0.5), Inches(0.5))
    star.fill.solid()
    star.fill.fore_color.rgb = RGBColor(57, 204, 204)
    add_text_to_slide(slide, "Our Enterprise", Inches(7.6), Inches(2.1), Inches(2), Inches(0.5))

def draw_arch_diagram(slide):
    components = ["Client Interface", "Synthesis Logic", "Repository"]
    for i in range(3):
        box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1 + i*3), Inches(3), Inches(2), Inches(0.8))
        box.fill.solid()
        box.fill.fore_color.rgb = RGBColor(0, 116, 217)
        add_text_to_slide(slide, components[i], Inches(1 + i*3), Inches(3.2), Inches(2), Inches(0.5), size=12)
        if i < 2:
            slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(3 + i*3), Inches(3.4), Inches(4 + i*3), Inches(3.4))
