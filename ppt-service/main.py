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

app = FastAPI(title="Institutional Synthesis Cluster 2.1")

# --- INITIALIZATION ---
OUT_DIR = "ppt_outputs"
if not os.path.exists(OUT_DIR):
    os.makedirs(OUT_DIR)

class UniversalRequest(BaseModel, extra=Extra.allow):
    team_name: str
    college_name: str
    content: dict = None
    project_data: dict = None 

# --- ARTIFACT DELIVERY ---
@app.get("/outputs/{filename}")
@app.get("/api/outputs/{filename}")
def get_artifact(filename: str):
    file_path = os.path.join(OUT_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    
    # AGGRESSIVE PREFIX MATCHING (Team Name Recovery)
    team_id = filename.split('_')[0].lower()
    for f in os.listdir(OUT_DIR):
        if f.lower().startswith(team_id) and f.endswith('.pptx'):
            return FileResponse(os.path.join(OUT_DIR, f))
    
    # SYSTEM HEALING: Return most recently modified file
    pptx_files = [f for f in os.listdir(OUT_DIR) if f.endswith('.pptx')]
    if pptx_files:
        pptx_files.sort(key=lambda x: os.path.getmtime(os.path.join(OUT_DIR, x)), reverse=True)
        return FileResponse(os.path.join(OUT_DIR, pptx_files[0]))
                
    raise HTTPException(status_code=404, detail=f"Vault empty or Artifact '{filename}' missing on this node.")

# --- UNIFIED SYNTHESIS HUB (Ultra-Permissive) ---
@app.post("/generate-artifact")
@app.post("/api/generate-artifact")
@app.post("/generate")
@app.post("/api/generate")
@app.post("/generate-expert-pitch")
@app.post("/api/generate-expert-pitch")
async def unified_handler(data: UniversalRequest):
    try:
        # DATA CONTEXT EXTRACTION
        payload = data.content or data.project_data
        if not payload:
            return {"success": False, "error": "No technical data payload provided."}

        # INTELLIGENT DECK DETECTION (Institutional Markers)
        is_expert = False
        expert_markers = ['projectName', 's2_domain', 's6_customerName', 's6_bio', 's6_personality']
        if any(marker in payload for marker in expert_markers):
            is_expert = True
        
        # Linear Check for expert fields (Deep search)
        if not is_expert and isinstance(payload, dict):
            for k in payload.keys():
                if k.startswith('s') and '_' in k and len(k) < 10: # s1_problem, s2_domain etc
                     is_expert = True
                     break
        
        if is_expert:
            print(f"🚀 [SYNTHESIS] Deploying EXPERT logic for: {data.team_name}")
            file_path = create_expert_deck(data.team_name, data.college_name, payload)
        else:
            print(f"📋 [SYNTHESIS] Deploying STANDARD logic for: {data.team_name}")
            processed = polish_content(payload)
            file_path = create_pptx(data.team_name, data.college_name, processed)
        
        return {
            "success": True, 
            "file_url": os.path.basename(file_path),
            "message": f"Artifact synthesized on Global Node: {os.path.basename(file_path)}"
        }
    except Exception as e:
        stack = traceback.format_exc()
        print(f"❌ [CLUSTER FAILURE] {str(e)}\n{stack}")
        return {"success": False, "error": f"Synthesis Error: {str(e)}"}

@app.get("/")
@app.get("/api")
def health():
    return {"status": "online", "cluster": "Institutional Synthesis 2.1-STABLE"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)