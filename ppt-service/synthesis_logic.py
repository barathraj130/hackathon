# ppt-service/synthesis_logic.py

def polish_content(raw_input):
    """
    Takes raw team input (now slide-by-slide) and structures it 
    into professional bullet points for each slide.
    """
    polished = {}
    
    # 1. Handle new "Slide-by-Slide" format
    if "slides" in raw_input and isinstance(raw_input["slides"], list):
        for i, slide in enumerate(raw_input["slides"]):
            title = slide.get("title", f"Slide {i+1}")
            text = str(slide.get("content", ""))
            
            # Split text into sentences for structured representation
            sentences = text.replace('\n', '. ').replace(';', '. ').split('. ')
            bullets = [s.strip() for s in sentences if len(s.strip()) > 5]
            
            if not bullets:
                bullets = ["Details pending team synthesis..."]
                
            polished[f"slide_{i+1}"] = {
                "title": title,
                "bullets": bullets[:6] # Professional limit
            }
        return polished

    # 2. Migration: Handle legacy mapping (fallback)
    fields = ['title', 'abstract', 'problem', 'solution', 'architecture', 'technologies', 'impact', 'outcome']
    for field in fields:
        text = str(raw_input.get(field, ""))
        sentences = text.replace('\n', '. ').replace(';', '. ').split('. ')
        bullets = [s.strip() for s in sentences if len(s.strip()) > 5]
            
        polished[field] = {
            "title": field.replace('_', ' ').title(),
            "bullets": bullets[:5] if bullets else ["Data points pending..."]
        }
        
    return polished