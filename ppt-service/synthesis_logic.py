# ppt-service/synthesis_logic.py

def polish_content(raw_input):
    """
    Takes raw team input and structures it into 
    professional bullet points for the presentation deck.
    """
    polished = {}
    
    # Mapping the 8 technical fields defined in requirements
    fields = [
        'title', 'abstract', 'problem', 'solution', 
        'architecture', 'technologies', 'impact', 'outcome'
    ]
    
    for field in fields:
        # Get text from raw input
        text = str(raw_input.get(field, ""))
        
        # Split text into sentences for structured representation
        sentences = text.replace('\n', '. ').replace(';', '. ').split('. ')
        
        # Clean and filter
        bullets = [s.strip() for s in sentences if len(s.strip()) > 5]
        
        # Optimization: Limit to top 5 points per slide for clarity
        final_bullets = bullets[:5]
        
        if not final_bullets:
            final_bullets = ["Data points pending submission..."]
            
        polished[field] = {
            "title": field.replace('_', ' ').title(),
            "bullets": final_bullets
        }
        
    return polished