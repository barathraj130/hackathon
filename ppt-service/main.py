# ppt-service/main.py
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Extra
from synthesis_logic import polish_content
from generator import create_pptx
from expert_synthesis import create_expert_deck
from fastapi.responses import FileResponse
import uvicorn
import os
import traceback

app = FastAPI(title="Institutional Synthesis Cluster 2.0")

# --- INITIALIZATION ---
OUT_DIR = "ppt_outputs"
if not os.path.exists(OUT_DIR):
    os.makedirs(OUT_DIR)

class UniversalRequest(BaseModel, extra=Extra.allow):
    team_name: str
    college_name: str
    content: dict = None
    project_data: dict = None # Alias for expert

# --- ARTIFACT DELIVERY ---
@app.get("/outputs/{filename}")
def get_artifact(filename: str):
    file_path = os.path.join(OUT_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    
    # CASE-INSENSITIVE RECOVERY
    for f in os.listdir(OUT_DIR):
        if f.lower() == filename.lower():
            return FileResponse(os.path.join(OUT_DIR, f))
    
    # SYSTEM HEALING: Return ANY pptx if we are in a missing state
    pptx_files = [f for f in os.listdir(OUT_DIR) if f.endswith('.pptx')]
    if pptx_files:
        # Return the first one (most likely the one just generated if rebuilding)
        return FileResponse(os.path.join(OUT_DIR, pptx_files[0]))
                
    raise HTTPException(status_code=404, detail=f"Artifact '{filename}' not found. No synthesis found on node.")

# --- UNIFIED SYNTHESIS ENTRY (Triple-Route) ---
@app.post("/generate-artifact")
@app.post("/generate")
@app.post("/generate-expert-pitch")
async def unified_handler(data: UniversalRequest):
    try:
        # DATA CONTEXT EXTRACTION
        payload = data.content or data.project_data
        if not payload:
            return {"success": False, "error": "No technical data payload provided."}

        # INTELLIGENT DECK DETECTION
        is_expert = False
        expert_markers = ['projectName', 's2_domain', 's6_customerName', 's6_bio']
        if any(marker in payload for marker in expert_markers):
            is_expert = True
        
        if is_expert:
            print(f"🚀 [SYNTHESIS cluster] Deploying EXPERT logic for: {data.team_name}")
            file_path = create_expert_deck(data.team_name, data.college_name, payload)
        else:
            print(f"📋 [SYNTHESIS cluster] Deploying STANDARD logic for: {data.team_name}")
            processed = polish_content(payload)
            file_path = create_pptx(data.team_name, data.college_name, processed)
        
        # Consistent file reference
        return {
            "success": True, 
            "file_url": os.path.basename(file_path),
            "message": f"Artifact synthesized on active node."
        }
    except Exception as e:
        stack = traceback.format_exc()
        print(f"❌ [CLUSTER FAILURE] {str(e)}\n{stack}")
        return {"success": False, "error": f"Synthesis Narrative Failure: {str(e)}"}

@app.get("/")
def health():
    return {"status": "online", "version": "2.1.0-STABLE", "region": "Global Synthesis"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)