# ppt-service/main.py
from fastapi import FastAPI, HTTPException, Request, Body
from pydantic import BaseModel
from synthesis_logic import polish_content
from generator import create_pptx
from expert_synthesis import create_expert_deck
from certificate_engine import create_certificate
from fastapi.responses import FileResponse
import uvicorn
import os
import traceback

app = FastAPI(title="Institutional Synthesis Hub 4.0")

OUT_DIR = "ppt_outputs"
if not os.path.exists(OUT_DIR):
    os.makedirs(OUT_DIR)

CERTS_DIR = "certs_outputs"
if not os.path.exists(CERTS_DIR):
    os.makedirs(CERTS_DIR)

# --- DIAGNOSTIC TOOLS ---
@app.get("/")
@app.get("/health")
def health():
    files = [f for f in os.listdir(OUT_DIR) if f.endswith('.pptx')]
    return {
        "status": "online", 
        "artifact_count": len(files),
        "engine": "v4.0.0-PROD"
    }

# --- ARTIFACT DELIVERY ---
@app.get("/outputs/{filename}")
@app.get("/api/outputs/{filename}")
def get_artifact(filename: str):
    file_path = os.path.join(OUT_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail=f"Institutional Vault empty.")

# --- CERTIFICATE SYNTHESIS ---
@app.post("/generate-certificate")
def certificate_handler(data: dict = Body(...)):
    try:
        p_name = data.get('name', 'Participant')
        p_college = data.get('college', 'Institution')
        p_year = data.get('year', 'N/A')
        p_dept = data.get('dept', 'N/A')
        p_role = data.get('role', 'MEMBER')
        
        file_path = create_certificate(p_name, p_college, p_year, p_dept, p_role)
        return {
            "success": True,
            "file_url": f"certs/{os.path.basename(file_path)}"
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/certs/{filename}")
def get_certificate(filename: str):
    file_path = os.path.join(CERTS_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="Credential not found.")

# --- CORE SYNTHESIS ENGINE ---
@app.post("/generate-artifact")
@app.post("/generate-expert-pitch")
def unified_handler(data: dict = Body(...)):
    try:
        team_name = data.get('team_name', 'Unnamed_Team')
        college_name = data.get('college_name', 'Institution')
        payload = data.get('content') or data.get('project_data')
        
        if not payload:
            return {"success": False, "error": "Context Missing"}

        is_expert = 'projectName' in payload
        if is_expert:
            file_path = create_expert_deck(team_name, college_name, payload)
        else:
            processed = polish_content(payload)
            file_path = create_pptx(team_name, college_name, processed)
        
        return {
            "success": True, 
            "file_url": os.path.basename(file_path)
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)