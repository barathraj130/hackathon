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

app = FastAPI(title="Institutional Synthesis Hub 4.5")

# USE ABSOLUTE PATHS FOR DISTRIBUTED STABILITY
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(BASE_DIR, "ppt_outputs")
CERTS_DIR = os.path.join(BASE_DIR, "certs_outputs")

if not os.path.exists(OUT_DIR): os.makedirs(OUT_DIR)
if not os.path.exists(CERTS_DIR): os.makedirs(CERTS_DIR)

# --- DIAGNOSTIC TOOLS ---
@app.get("/")
@app.get("/health")
def health():
    files = [f for f in os.listdir(OUT_DIR) if f.endswith('.pptx')]
    cert_files = [f for f in os.listdir(CERTS_DIR) if f.endswith('.pptx')]
    return {
        "status": "online", 
        "artifact_count": len(files),
        "credential_count": len(cert_files),
        "engine": "v4.5.0-PROD"
    }

# --- ARTIFACT DELIVERY ---
@app.get("/outputs/{filename}")
def get_artifact(filename: str):
    file_path = os.path.join(OUT_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail=f"Artifact not found in vault.")

# --- CERTIFICATE SYNTHESIS & DELIVERY ---
@app.post("/generate-certificate")
def certificate_handler(data: dict = Body(...)):
    try:
        p_name = data.get('name', 'Participant')
        p_college = data.get('college', 'Institution')
        p_year = data.get('year', 'N/A')
        p_dept = data.get('dept', 'N/A')
        p_role = data.get('role', 'MEMBER')
        p_date = data.get('submission_date')
        if not p_date or p_date == "None" or p_date == "null":
            p_date = "[Submission Date]"
        
        safe_name = p_name.lower().replace(' ', '_')
        out_filename = f"certificate_{safe_name}.pptx"
        out_path = os.path.join(CERTS_DIR, out_filename)
        
        # Core Synthesis Call
        create_certificate(p_name, p_college, p_year, p_dept, p_role, submission_date=p_date, out_path=out_path)
        
        # Verify serialization
        if not os.path.exists(out_path):
            raise Exception("Synthesis failed to serialize artifact.")

        return {
            "success": True,
            "file_url": out_filename # Return just filename, backend maps to /certs/
        }
    except Exception as e:
        print(f"CRITICAL: {str(e)}")
        return {"success": False, "error": str(e)}

@app.get("/certs/{filename}")
def get_credential(filename: str):
    file_path = os.path.join(CERTS_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    # Attempt legacy cleanup pathing
    legacy_path = os.path.join(BASE_DIR, "certs_outputs", filename)
    if os.path.exists(legacy_path):
        return FileResponse(legacy_path)
    raise HTTPException(status_code=404, detail="Credential not found in institutional vault.")

# --- CORE MISSION SYNTHESIS ---
@app.post("/generate-artifact")
@app.post("/generate-expert-pitch")
def unified_handler(data: dict = Body(...)):
    try:
        team_name = data.get('team_name', 'Unnamed_Team')
        college_name = data.get('college_name', 'Institution')
        payload = data.get('content') or data.get('project_data')
        
        if not payload: return {"success": False, "error": "Context Missing"}

        # Logic Branching
        is_expert = False
        if isinstance(payload, dict) and 'projectName' in payload:
            is_expert = True
        elif isinstance(payload, str) and 'projectName' in payload:
            is_expert = True

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
        traceback.print_exc()
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)