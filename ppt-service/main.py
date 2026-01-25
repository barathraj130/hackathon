# ppt-service/main.py
from fastapi import FastAPI, HTTPException, Request, Body
from pydantic import BaseModel
from synthesis_logic import polish_content
from generator import create_pptx
from expert_synthesis import create_expert_deck
from fastapi.responses import FileResponse
import uvicorn
import os
import traceback

app = FastAPI(title="Institutional Synthesis Hub 3.0")

OUT_DIR = "ppt_outputs"
if not os.path.exists(OUT_DIR):
    os.makedirs(OUT_DIR)

# --- DIAGNOSTIC TOOLS ---
@app.get("/")
@app.get("/health")
def health():
    files = [f for f in os.listdir(OUT_DIR) if f.endswith('.pptx')]
    return {
        "status": "online", 
        "artifact_count": len(files),
        "node_vault": files[:10], # Show first 10 for quick audit
        "engine": "v3.0.0-PROD"
    }

@app.get("/api/v1/vault-explorer")
def vault_explorer():
    files = []
    for f in os.listdir(OUT_DIR):
        if f.endswith('.pptx'):
            path = os.path.join(OUT_DIR, f)
            files.append({"name": f, "size": os.path.getsize(path), "modified": os.path.getmtime(path)})
    return {"vault_contents": sorted(files, key=lambda x: x['modified'], reverse=True)}

# --- ARTIFACT DELIVERY ---
@app.get("/outputs/{filename}")
@app.get("/api/outputs/{filename}")
def get_artifact(filename: str):
    file_path = os.path.join(OUT_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    
    # PREFIX TEAM RECOVERY (Aggressive)
    team_id = filename.split('_')[0].split('-')[0].lower() # Handle complex slugs
    for f in os.listdir(OUT_DIR):
        if team_id in f.lower() and f.endswith('.pptx'):
            return FileResponse(os.path.join(OUT_DIR, f))
    
    # ABSOLUTE LAST RESORT: Newest PPT on node
    pptx_files = [f for f in os.listdir(OUT_DIR) if f.endswith('.pptx')]
    if pptx_files:
        pptx_files.sort(key=lambda x: os.path.getmtime(os.path.join(OUT_DIR, x)), reverse=True)
        return FileResponse(os.path.join(OUT_DIR, pptx_files[0]))
                
    raise HTTPException(status_code=404, detail=f"Institutional Vault empty at this node location.")

# --- CORE SYNTHESIS ENGINE ---
@app.post("/generate-artifact")
@app.post("/generate")
@app.post("/api/generate")
@app.post("/generate-expert-pitch")
@app.post("/api/generate-artifact")
async def unified_handler(data: dict = Body(...)):
    try:
        team_name = data.get('team_name', 'Unnamed_Team')
        college_name = data.get('college_name', 'Institution')
        payload = data.get('content') or data.get('project_data')
        
        if not payload:
            return {"success": False, "error": "Synthesis Context Missing: 'content' or 'project_data' required."}

        # INTELLIGENT EXPERT DETECTION
        is_expert = False
        expert_markers = ['projectName', 's2_domain', 's6_customerName', 's6_bio']
        if any(marker in payload for marker in expert_markers):
            is_expert = True
        
        if is_expert:
            print(f"🚀 [SYNTHESIS cluster] Running High-Fidelity Expert Engine: {team_name}")
            file_path = create_expert_deck(team_name, college_name, payload)
        else:
            print(f"📋 [SYNTHESIS cluster] Running Standard Institutional Engine: {team_name}")
            processed = polish_content(payload)
            file_path = create_pptx(team_name, college_name, processed)
        
        return {
            "success": True, 
            "file_url": os.path.basename(file_path),
            "node_artifact_id": f"synthesis_{os.path.basename(file_path)}"
        }
    except Exception as e:
        print(f"❌ [CLUSTER FAILURE] {traceback.format_exc()}")
        return {"success": False, "error": f"Synthesis Narrative Problem: {str(e)}"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)