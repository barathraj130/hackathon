# ppt-service/expert_synthesis.py
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
from pptx.dml.color import RGBColor
import os

def create_expert_deck(team_name, college, data):
    prs = Presentation()
    
    # helper for navy theme
    def set_navy_background(slide):
        background = slide.background
        fill = background.fill
        fill.solid()
        fill.fore_color.rgb = RGBColor(0, 31, 63) # Brand Navy

    # 1. Title Slide
    slide = prs.slides.add_slide(prs.slide_layouts[0])
    title = slide.shapes.title
    subtitle = slide.placeholders[1]
    title.text = data.get('projectName', 'Project Synthesis')
    subtitle.text = f"Team: {team_name}\nInstitution: {college}"

    # 2. Problem Statement
    add_bullet_slide(prs, "Problem Statement", [
        f"Critical Challenge: {data.get('problemDescription', 'N/A')}",
        f"Target User Group: {data.get('targetUsers', 'General Public')}",
        f"Limitations: {data.get('currentLimitations', 'Inefficient manual processes')}"
    ])

    # 3. Solution Overview
    add_bullet_slide(prs, "Solution Overview", [
        f"Core Innovation: {data.get('proposedSolution', 'N/A')}",
        "Methodology: High-precision architectural mapping",
        f"Key Capabilities: {data.get('keyFeatures', 'Scalability, Efficiency, Accuracy')}"
    ])

    # 4. Problem Identification (Graph)
    slide = add_diagram_slide(prs, "Design Thinking: Problem Identification")
    draw_impact_graph(slide)
    add_text_to_slide(slide, "System Analysis: Priority Mapping", Inches(0.5), Inches(5), Inches(8), Inches(1))

    # 5. Solution Mapping (Hot Air Balloon)
    slide = add_diagram_slide(prs, "Design Thinking: Solution Mapping")
    draw_hot_air_balloon(slide, "Proposed Solution", "Market Realities")

    # 6. TAM • SAM • SOM
    slide = add_diagram_slide(prs, "TAM • SAM • SOM Analysis")
    draw_concentric_circles(slide)

    # 7. Market Opportunity
    add_bullet_slide(prs, "Market Opportunity", [
        f"Primary Vertical: {data.get('targetMarket', 'Emerging Markets')}",
        "Growth Trajectory: Logarithmic expansion projected",
        "Economic Reach: Unified global synchronization"
    ])

    # 8. Competitor Analysis
    slide = add_diagram_slide(prs, "Competitor Analysis")
    draw_quadrant(slide, "Standardization", "Efficiency")

    # 11. Tech Stack
    add_bullet_slide(prs, "Technology Stack", [
        f"Component Hierarchy: {data.get('techStack', 'N/A')}",
        "Infrastructure: Cloud-native cluster nodes",
        "Security: Institutional-grade encryption"
    ])

    # 12. System Architecture
    slide = add_diagram_slide(prs, "System Architecture")
    draw_arch_diagram(slide)

    # 13. Roadmap & Future Scope
    slide = add_diagram_slide(prs, "Roadmap & Future Scope")
    draw_timeline(slide)

    # 14. Conclusion & Impact
    add_bullet_slide(prs, "Conclusion & Impact", [
        f"Expected Milestone: {data.get('expectedImpact', 'Operational Excellence')}",
        f"Validation: {data.get('validationMetrics', 'Continuous improvement cycle')}",
        "Status: Synthesis Complete"
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
    slide = prs.slides.add_slide(prs.slide_layouts[6]) # Blank layout
    title_box = slide.shapes.add_textbox(Inches(0.5), Inches(0.2), Inches(9), Inches(1))
    title_box.text_frame.text = title_text
    return slide

def add_text_to_slide(slide, text, left, top, width, height):
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.text = text

# Diagrams

def draw_impact_graph(slide):
    # Axes
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(1), Inches(5), Inches(8), Inches(5)) # X
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(1), Inches(5), Inches(1), Inches(1.5)) # Y
    
    # Labels
    add_text_to_slide(slide, "Frequency", Inches(4), Inches(5.1), Inches(2), Inches(0.5))
    add_text_to_slide(slide, "Impact", Inches(0.2), Inches(3), Inches(1), Inches(0.5))
    
    # Points
    circle = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(6), Inches(2), Inches(0.5), Inches(0.5))
    circle.fill.solid()
    circle.fill.fore_color.rgb = RGBColor(57, 204, 204) # Teal
    add_text_to_slide(slide, "Hurdle identified", Inches(6.5), Inches(2.1), Inches(2), Inches(0.5))

def draw_hot_air_balloon(slide, top_label, bot_label):
    # Balloon
    balloon = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(3.5), Inches(1.5), Inches(3), Inches(3))
    balloon.fill.solid()
    balloon.fill.fore_color.rgb = RGBColor(0, 116, 217) # Royal Blue
    add_text_to_slide(slide, top_label, Inches(4.5), Inches(2.7), Inches(2), Inches(0.5))
    
    # Basket
    basket = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(4.5), Inches(5), Inches(1), Inches(0.8))
    basket.fill.solid()
    basket.fill.fore_color.rgb = RGBColor(100, 100, 100)
    add_text_to_slide(slide, bot_label, Inches(4.2), Inches(5.8), Inches(2), Inches(0.5))
    
    # Ropes
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(4), Inches(4), Inches(4.5), Inches(5))
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(6), Inches(4), Inches(5.5), Inches(5))

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
    # Cross
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(1), Inches(3.5), Inches(9), Inches(3.5))
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(5), Inches(1), Inches(5), Inches(6))
    
    add_text_to_slide(slide, x_label, Inches(8), Inches(3.6), Inches(2), Inches(0.5))
    add_text_to_slide(slide, y_label, Inches(5.1), Inches(1.1), Inches(2), Inches(0.5))
    
    # Points
    star = slide.shapes.add_shape(MSO_SHAPE.STAR_5_POINT, Inches(7), Inches(2), Inches(0.6), Inches(0.6))
    star.fill.solid()
    star.fill.fore_color.rgb = RGBColor(57, 204, 204)
    add_text_to_slide(slide, "Our Venture", Inches(7.7), Inches(2.1), Inches(2), Inches(0.5))

def draw_arch_diagram(slide):
    components = ["Interface", "Logic Tier", "Repository"]
    for i in range(3):
        box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1 + i*3), Inches(3), Inches(2), Inches(1))
        box.fill.solid()
        box.fill.fore_color.rgb = RGBColor(0, 116, 217)
        add_text_to_slide(slide, components[i], Inches(1 + i*3), Inches(3.2), Inches(2), Inches(0.5))
        if i < 2:
            slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(3 + i*3), Inches(3.5), Inches(4 + i*3), Inches(3.5))

def draw_timeline(slide):
    slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(1), Inches(4), Inches(9), Inches(4))
    milestones = ["Phase 1: Alpha", "Phase 2: Sync", "Phase 3: Scale"]
    for i in range(3):
        slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(2 + i*3), Inches(3.8), Inches(2 + i*3), Inches(4.2))
        add_text_to_slide(slide, milestones[i], Inches(1.5 + i*3), Inches(4.3), Inches(2), Inches(0.5))
