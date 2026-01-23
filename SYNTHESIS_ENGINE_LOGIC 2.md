# AI Prompt Logic for PPT & Certificate Generation

## 🎯 PPT Generation AI Flow

### Step 1: Content Enhancement Prompt

```
You are a professional presentation content writer for a college hackathon.
Constraint: Follow this EXACT 7-slide structure. NO deviation.

Input Data:
- Title: {title}
- Abstract: {abstract}
- Problem Statement: {problem}
- Existing System: {existing_system}
- Solution: {solution}
- Architecture: {architecture_text}
- Technologies: {tech_stack}
- Use Case: {use_case}
- Team: {team_details}
- Admin Event Name: {event_name}
- College Name: {college_name}

Task:
1.  **Strictly** generate content for the 7 slides below.
2.  Do NOT add any other slides.
3.  Do NOT change slide titles.
4.  Enhance content to be professional, academic, and technically sound.
5.  Use short, punchy bullet points.

Output Format (JSON):
{
  "slides": [
    {
      "slide_number": 1,
      "title": "{title}",
      "subtitle": "{team_details} | {college_name}",
      "footer": "{event_name}",
      "content": [] 
    },
    {
      "slide_number": 2,
      "title": "Problem Statement",
      "content": [
        "Transform {problem} into 3-4 clear pain points.",
        "Focus on the urgency and impact of the problem."
      ]
    },
    {
      "slide_number": 3,
      "title": "Existing System",
      "content": [
        "Transform {existing_system} into current limitations.",
        "Why are current solutions failing?"
      ]
    },
    {
      "slide_number": 4,
      "title": "Proposed Solution",
      "content": [
        "Transform {solution} into key innovation points.",
        "How does it solve the problem effectively?"
      ]
    },
    {
      "slide_number": 5,
      "title": "System Architecture",
      "content": [
         "Create a text-based representation of the flow from {architecture_text}.",
         "Example: User -> Frontend -> API Gateway -> Microservices -> Database"
      ]
    },
    {
      "slide_number": 6,
      "title": "Technology Stack",
      "content": [
        "Categorize {tech_stack} clearly.",
        "Frontend: ...",
        "Backend: ...",
        "Database: ...",
        "AI/ML: ..."
      ]
    },
    {
      "slide_number": 7,
      "title": "Conclusion",
      "content": [
        "Transform {use_case} into future scope and impact.",
        "Summary of the project's value.",
        "Thank you."
      ]
    }
  ]
}
```

### Step 2: Template Application (Python-pptx)

```python
# Pseudo-code for backend service using python-pptx
from pptx import Presentation

def generate_strict_ppt(ai_content, template_path):
    prs = Presentation(template_path)
    
    # We assume the template has a Master Slide layout that we use
    # Or we build from blank using placeholders
    
    for slide_data in ai_content['slides']:
        layout = prs.slide_layouts[1] # Title and Content layout usually
        if slide_data['slide_number'] == 1:
            layout = prs.slide_layouts[0] # Title Slide layout
            
        slide = prs.slides.add_slide(layout)
        
        # Set Title
        if slide.shapes.title:
            slide.shapes.title.text = slide_data['title']
            
        # Set Content (Shape 1 usually body)
        if len(slide.placeholders) > 1:
            body = slide.placeholders[1]
            tf = body.text_frame
            tf.clear()
            
            # Special handling for subtitle on slide 1
            if slide_data['slide_number'] == 1:
                 tf.text = slide_data['subtitle']
            else:
                for point in slide_data['content']:
                    p = tf.add_paragraph()
                    p.text = point
                    p.level = 0
                    
        # Add Footer (Strict Control)
        # Add Logo (Strict Control)
        
    return prs
```

---

## 📜 Certificate Generation Logic

### Prompt for Certificate Text
```
Generate specific text for a hackathon certificate based on type.

Input:
- Name: {candidate_name}
- Type: {certificate_type} (Participation, Winner, Runner-up, Merit)
- Event: {event_name}
- Date: {date}
- College: {college_name}

Rules:
1. Strict formal tone.
2. No hallucinations.
```

### PDF Generation Logic
(Uses PDFKit as previously defined, but ensures strict layout with Admin Signature and College Logo)
