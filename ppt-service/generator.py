# ppt-service/generator.py
from pptx import Presentation
from pptx.util import Inches, Pt
import os

def create_pptx(team_name, college, slides_data):
    prs = Presentation()
    
    def add_branding(slide):
        # 1. Top Left - Event Branding
        branding_box = slide.shapes.add_textbox(Inches(0.2), Inches(0.2), Inches(2), Inches(0.4))
        p = branding_box.text_frame.paragraphs[0]
        p.text = "HACK@JIT 1.0"
        p.font.size = Pt(14)
        p.font.bold = True
        
        # 2. Top Right - Logo
        if os.path.exists("institution_logo.png"):
            slide.shapes.add_picture("institution_logo.png", Inches(8.5), Inches(0.2), width=Inches(1.2))

    # 1. Title Slide (Idea and team identification)
    slide = prs.slides.add_slide(prs.slide_layouts[6]) # Blank layout
    add_branding(slide)
    
    # Title Text
    left, top, width, height = Inches(0.5), Inches(0.5), Inches(9), Inches(1)
    tx_title = slide.shapes.add_textbox(left, top, width, height)
    tf_title = tx_title.text_frame
    tf_title.text = "Idea and team identification"
    tf_title.paragraphs[0].font.size = Pt(36)
    tf_title.paragraphs[0].font.bold = True

    # Details Text
    left, top, width, height = Inches(1.5), Inches(2), Inches(7.5), Inches(5)
    tx_details = slide.shapes.add_textbox(left, top, width, height)
    tf_details = tx_details.text_frame
    tf_details.word_wrap = True

    details = [
        ("S. No.", "100"),
        ("Name of the Institution", college),
        ("Faculty Name", slides_data.get('facultyName', 'P. Eswari')),
        ("Idea Description", slides_data.get('title', {}).get('bullets', ['Weather Adaptive System'])[0]),
        ("Student Names", f"• {team_name}\n• Collaborators")
    ]

    for label, value in details:
        p = tf_details.add_paragraph()
        p.text = f"{label} : {value}"
        p.font.size = Pt(24)
        p.space_after = Pt(12)

    # 2. Add Content Slides
    for key, data in slides_data.items():
        if key == 'title': continue
        
        slide = prs.slides.add_slide(prs.slide_layouts[1])
        add_branding(slide)
        
        # Set Header
        title_shape = slide.shapes.title
        title_shape.text = data['title']
        
        # Set Bullets
        body_shape = slide.shapes.placeholders[1]
        tf = body_shape.text_frame
        
        for point in data['bullets']:
            p = tf.add_paragraph()
            p.text = point
            p.level = 0

    # Save the file
    file_name = f"ppt_outputs/{team_name.lower().replace(' ', '_')}_pitch_artifact.pptx"
    
    # Ensure directory exists
    if not os.path.exists('ppt_outputs'):
        os.makedirs('ppt_outputs')
        
    prs.save(file_name)
    return file_name