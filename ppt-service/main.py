# ppt-service/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from synthesis_logic import polish_content
from generator import create_pptx
from expert_synthesis import create_expert_deck
from fastapi.responses import FileResponse
import uvicorn
import os
import traceback

app = FastAPI(title="Institutional Synthesis Engine")

# --- INITIALIZATION ---
OUT_DIR = "ppt_outputs"
if not os.path.exists(OUT_DIR):
    os.makedirs(OUT_DIR)

class SynthesisRequest(BaseModel):
    team_name: str
    college_name: str
    content: dict = None
    project_data: dict = None # Backward compat for expert

# --- ARTIFACT DELIVERY ---
@app.get("/outputs/{filename}")
def get_artifact(filename: str):
    file_path = os.path.join(OUT_DIR, filename)
    
    # Direct Match
    if os.path.exists(file_path):
        return FileResponse(file_path)
    
    # Case-Insensitive Deep Recovery
    for f in os.listdir(OUT_DIR):
        if f.lower() == filename.lower():
            return FileResponse(os.path.join(OUT_DIR, f))
                
    raise HTTPException(status_code=404, detail=f"Artifact '{filename}' not found. Node state Reset.")

# --- CORE SYNTHESIS ENGINE ---
@app.post("/generate-artifact")
@app.post("/generate")
@app.post("/generate-expert-pitch")
def unified_synthesis(data: SynthesisRequest):
    try:
        # 1. Route Intelligence: Detect standard vs expert
        # Use content if available, otherwise project_data
        payload = data.content or data.project_data
        
        # EXPERT LOGIC: If it has structured persona field or no 'slides' array
        is_expert = False
        if payload:
            if 'projectName' in payload or 's6_customerName' in payload:
                is_expert = True
            elif 'slides' not in payload:
                is_expert = True
        
        if is_expert:
            print(f"🚀 [SYNTHESIS] Executing EXPERT logic for {data.team_name}")
            file_path = create_expert_deck(data.team_name, data.college_name, payload)
        else:
            print(f"📋 [SYNTHESIS] Executing STANDARD logic for {data.team_name}")
            processed = polish_content(payload)
            file_path = create_pptx(data.team_name, data.college_name, processed)
        
        return {
            "success": True, 
            "file_url": os.path.basename(file_path),
            "message": "Artifact synthesized successfully"
        }
    except Exception as e:
        stack = traceback.format_exc()
        print(f"❌ [CRITICAL] Synthesis Failure: {str(e)}\n{stack}")
        return {"success": False, "error": f"Synthesis Error: {str(e)}"}

@app.get("/")
def health():
    return {"status": "online", "engine": "Institutional Synthesis 2.0"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)