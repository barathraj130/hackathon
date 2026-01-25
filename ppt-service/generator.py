# ppt-service/generator.py
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
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
        p.font.color.rgb = RGBColor(0, 0, 0)
        
        # 2. Top Right - Logo
        if os.path.exists("institution_logo.png"):
            slide.shapes.add_picture("institution_logo.png", Inches(8.5), Inches(0.2), width=Inches(1.2))

    def set_dark_bg(slide):
        background = slide.background
        fill = background.fill
        fill.solid()
        fill.fore_color.rgb = RGBColor(15, 23, 42) # Premium Navy/Black

    # 1. Title Slide (Idea and team identification)
    slide = prs.slides.add_slide(prs.slide_layouts[6]) # Blank layout
    add_branding(slide)
    
    # Title Text
    left, top, width, height = Inches(0.5), Inches(0.5), Inches(9), Inches(1)
    tx_title = slide.shapes.add_textbox(left, top, width, height)
    tf_title = tx_title.text_frame
    tf_title.text = "Idea and team identification".upper()
    p = tf_title.paragraphs[0]
    p.font.size = Pt(40); p.font.bold = True; p.font.name = 'Times New Roman'
    p.font.color.rgb = RGBColor(0, 0, 0)
    p.alignment = PP_ALIGN.CENTER

    # Details Text - BOTTOM RIGHT
    left, top, width, height = Inches(5.0), Inches(5.0), Inches(4.5), Inches(3.5)
    tx_details = slide.shapes.add_textbox(left, top, width, height)
    tf_details = tx_details.text_frame
    tf_details.word_wrap = True
    
    details = [
        ("S. No.", "100"),
        ("Name of the Institution", college),
        ("Faculty Name", slides_data.get('facultyName', 'P. Eswari')),
        ("Idea Description", slides_data.get('title', {}).get('bullets', ['Weather Adaptive System'])[0]),
        ("Team Name", team_name),
        ("Team Leader", slides_data.get('leaderName', 'N/A')),
        ("Team Members", slides_data.get('memberNames', 'N/A'))
    ]

    for label, value in details:
        p = tf_details.add_paragraph()
        p.text = f"{label} : {value}"
        p.font.size = Pt(16)
        p.font.name = 'Times New Roman'
        p.font.color.rgb = RGBColor(0, 0, 0)
        p.alignment = PP_ALIGN.RIGHT
        p.space_after = Pt(6)

    # 2. Add Content Slides
    from pptx.enum.shapes import MSO_SHAPE
    from pptx.dml.color import RGBColor
    
    for key, data in slides_data.items():
        if key == 'title': continue
        
        slide = prs.slides.add_slide(prs.slide_layouts[6]) # Blank
        add_branding(slide)
        
        # Title - Centered
        title_box = slide.shapes.add_textbox(Inches(0.5), Inches(0.6), Inches(9), Inches(0.8))
        tf_t = title_box.text_frame
        tf_t.text = data['title']
        p_t = tf_t.paragraphs[0]
        p_t.font.size = Pt(28); p_t.font.bold = True; p_t.font.name = 'Times New Roman'; p_t.alignment = PP_ALIGN.CENTER
        p_t.font.color.rgb = RGBColor(0, 0, 0)
        
        # Content - Box containment
        content_box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.6), Inches(8.4), Inches(5.2))
        content_box.fill.background()
        content_box.line.color.rgb = RGBColor(13, 148, 136) # Institutional Teal
        content_box.line.width = Pt(1.5)
        
        tf = content_box.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.2); tf.margin_top = Inches(0.2)
        
        for point in data['bullets']:
            p = tf.add_paragraph()
            p.text = f"• {point}"
            p.font.name = 'Times New Roman'
            p.font.size = Pt(22)
            p.font.color.rgb = RGBColor(0, 0, 0)
            p.space_after = Pt(12)

    # Save the file
    file_name = f"ppt_outputs/{team_name.lower().replace(' ', '_')}_pitch_artifact.pptx"
    
    # Ensure directory exists
    if not os.path.exists('ppt_outputs'):
        os.makedirs('ppt_outputs')
        
    prs.save(file_name)
    return file_name