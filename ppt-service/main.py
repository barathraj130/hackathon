# ppt-service/main.py
from fastapi import FastAPI
from pydantic import BaseModel
from synthesis_logic import polish_content
from generator import create_pptx
import uvicorn
import os
import traceback
from fastapi.responses import FileResponse
from fastapi import HTTPException

app = FastAPI()

# Ensure output directory exists at startup
if not os.path.exists("ppt_outputs"):
    os.makedirs("ppt_outputs")

@app.get("/outputs/{filename}")
def get_artifact(filename: str):
    base_dir = "ppt_outputs"
    file_path = os.path.join(base_dir, filename)
    
    # 1. High-Priority Direct Match
    if os.path.exists(file_path):
        return FileResponse(file_path)
    
    # 2. Case-Insensitive Recovery Logic
    if os.path.exists(base_dir):
        existing_files = os.listdir(base_dir)
        for f in existing_files:
            if f.lower() == filename.lower():
                return FileResponse(os.path.join(base_dir, f))
                
    # 3. Cluster Metadata 404
    raise HTTPException(status_code=404, detail=f"Artifact '{filename}' not found on this node. State may have been reset by deployment.")

@app.get("/")
def health_check():
    return {"status": "online", "service": "Synthesis Engine"}

class PPTRequest(BaseModel):
    team_name: str
    college_name: str
    content: dict

class ExpertPPTRequest(BaseModel):
    team_name: str
    college_name: str
    project_data: dict

@app.post("/generate")
def generate_ppt(data: PPTRequest):
    # 1. Format the content using our logic engine
    processed_content = polish_content(data.content)
    
    # 2. Create the actual .pptx file
    file_path = create_pptx(data.team_name, data.college_name, processed_content)
    
    return {
        "success": True, 
        "file_url": file_path,
        "message": "PPT Generated successfully"
    }

@app.post("/generate-expert-pitch")
def generate_expert_pitch(data: ExpertPPTRequest):
    try:
        from expert_synthesis import create_expert_deck
        # This calls the advanced synthesis engine with diagrams
        file_path = create_expert_deck(data.team_name, data.college_name, data.project_data)
        
        # Return only the filename for the frontend to construct the URL
        filename = os.path.basename(file_path)
        
        return {
            "success": True, 
            "file_url": filename,
            "message": "Expert Pitch Deck Generated"
        }
    except Exception as e:
        error_msg = str(e)
        stack = traceback.format_exc()
        print(f"!!! SYNTHESIS CRITICAL FAILURE !!!\n{error_msg}\n{stack}")
        return {
            "success": False,
            "error": f"Synthesis Narrative Problem: {error_msg}. Check inputs.",
            "trace": stack
        }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)