# ppt-service/generator.py
from pptx import Presentation
from pptx.util import Inches, Pt
import os

def create_pptx(team_name, college, slides_data):
    prs = Presentation()
    
    # 1. Title Slide
    title_slide_layout = prs.slide_layouts[0]
    slide = prs.slides.add_slide(title_slide_layout)
    title = slide.shapes.title
    subtitle = slide.placeholders[1]
    
    title.text = slides_data.get('title', {}).get('bullets', ['My Project'])[0]
    subtitle.text = f"Team: {team_name}\nCollege: {college}"

    # 2. Add Content Slides
    # We skip 'title' because we already made it
    for key, data in slides_data.items():
        if key == 'title': continue
        
        bullet_slide_layout = prs.slide_layouts[1]
        slide = prs.slides.add_slide(bullet_slide_layout)
        
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
    file_name = f"ppt_outputs/{team_name.replace(' ', '_')}_presentation.pptx"
    
    # Ensure directory exists
    if not os.path.exists('ppt_outputs'):
        os.makedirs('ppt_outputs')
        
    prs.save(file_name)
    return file_name