from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import shutil
import os
from pathlib import Path

from detection import run_detection

# DATABASE IMPORTS
from database import engine, SessionLocal
from models import Base, Violation

# CREATE TABLES
Base.metadata.create_all(bind=engine)

app = FastAPI()

# =========================
# PATH SETUP
# =========================

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ML_PART_DIR = PROJECT_ROOT / "ML_Part"

OUTPUT_DIR = ML_PART_DIR / "violation_plates_image"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# =========================
# STATIC IMAGE ACCESS
# =========================

app.mount(
    "/images",
    StaticFiles(directory=str(OUTPUT_DIR)),
    name="images"
)

# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# DETECTION API
# =========================

@app.post("/api/detect")
async def detect_violation(file: UploadFile = File(...)):

    # Save uploaded file
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Run ML detection pipeline
    results = run_detection(file_path)

    return {
        "status": "Detection completed",
        "count": len(results["violations"]),
        "violations": results["violations"],
        "final_image": results["final_image"]
    }

# =========================
# GET ALL VIOLATIONS
# =========================

@app.get("/api/violations")
def get_violations():

    db = SessionLocal()

    try:

        violations = db.query(Violation).all()

        return {
            "count": len(violations),
            "violations": [
                {
                    "id": v.id,
                    "plate_number": v.plate_number,
                    "helmet": v.helmet,
                    "ocr_status": v.ocr_status,
                    "confidence": v.confidence,
                    "image_path": v.image_path,
                    "final_image_path": v.final_image_path,
                    "notification": v.notification,
                    "timestamp": v.timestamp
                }
                for v in violations
            ]
        }

    finally:
        db.close()