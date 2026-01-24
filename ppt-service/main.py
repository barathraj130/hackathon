# ppt-service/main.py
from fastapi import FastAPI
from pydantic import BaseModel
from synthesis_logic import polish_content
from generator import create_pptx
import uvicorn

app = FastAPI()

from expert_synthesis import create_expert_deck
from fastapi.staticfiles import StaticFiles
import os

if not os.path.exists("ppt_outputs"):
    os.makedirs("ppt_outputs")

app.mount("/outputs", StaticFiles(directory="ppt_outputs"), name="outputs")

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
    # This calls the advanced synthesis engine with diagrams
    file_path = create_expert_deck(data.team_name, data.college_name, data.project_data)
    
    return {
        "success": True, 
        "file_url": file_path,
        "message": "Expert Pitch Deck Generated"
    }

@app.get("/")
def health_check():
    return {"status": "online"}

if __name__ == "__main__":
    import os
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)