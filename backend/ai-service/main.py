from fastapi import FastAPI
from pydantic import BaseModel
import random

app = FastAPI()

class SensorData(BaseModel):
    methaneGasLevel: float
    temperature: float
    vibration: float
    structuralStress: float
    crackProbability: float

class PredictionRequest(BaseModel):
    sensors: SensorData
    tunnel: str

@app.post("/predict")
async def predict_risk(request: PredictionRequest):
    # Simulated AI logic
    # Higher vibration and structural stress increase collapse risk
    base_risk = (request.sensors.vibration * 0.4) + (request.sensors.structuralStress / 100 * 0.4) + (request.sensors.crackProbability * 0.2)
    
    # Add a bit of randomness
    collapse_risk = min(1.0, max(0.0, base_risk + (random.random() * 0.1 - 0.05)))
    
    return {
        "collapseRisk": round(collapse_risk, 4),
        "dangerZone": request.tunnel
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
