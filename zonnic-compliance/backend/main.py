import os
import json
import base64
import cv2
import numpy as np
import easyocr
import zipfile
import io
import asyncio
import sqlite3
import csv
from datetime import datetime
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
reader = easyocr.Reader(['en'])

# ==========================================
# SQLITE DATABASE SETUP
# ==========================================
DB_FILE = "zonnic_audit_history.db"

def init_db():
    """Creates the local SQLite database and table if they don't exist."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS evaluations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT,
            status TEXT,
            issues TEXT,
            rules_violated TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# Run DB initialization on startup
init_db()

def log_evaluation(filename, status, issues, rules_violated):
    """Saves the AI result to the SQLite database."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO evaluations (filename, status, issues, rules_violated, timestamp)
        VALUES (?, ?, ?, ?, ?)
    ''', (
        filename, 
        status, 
        json.dumps(issues), 
        json.dumps(rules_violated), 
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ))
    conn.commit()
    conn.close()

# ==========================================
# EVALUATION LOGIC & RULES
# ==========================================
zonnic_rules = {
    "brand_colors": {
        "primary_dark_navy": "#242c65",
        "secondary_light_mint": "#b7da9b",
        "primary_flavor_mint": "#007e47"
    },
    "typography": {
        "primary_font": "Santral",
        "lockup_format": "Uppercase Santral Semi Bold | Uppercase Santral Book"
    },
    "logo_rules": {
        "single_line": "The logo must ALWAYS be a single horizontal line. Never stacked (ZON over NIC).",
        "clear_space": "Maintain a safety zone equal to 50% of the height of the C.",
        "halo_requirement": "The C must always have a circular halo.",
        "distortions": "Never outline the logo, place inside a shape, or apply gradients to the text."
    },
    "background_rules": {
        "flavour_gradient": "Approximate 70% dark primary top to 30% light secondary bottom.",
        "educational": "Use signature grey-to-white gradient, solid white, solid light grey, or photography."
    }
}

def process_bounding_boxes(image_bytes: bytes):
    """
    Runs EasyOCR to find 'ZONNIC'. If found, draws a clean green box using OpenCV.
    Returns the modified image bytes and a boolean flag.
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        print("Warning: OpenCV could not decode image format. Bypassing OCR.")
        return image_bytes, False
        
    results = reader.readtext(img)
    logo_found = False
    
    for (bbox, text, prob) in results:
        if 'zonnic' in text.lower() and prob > 0.5:
            logo_found = True
            (tl, tr, br, bl) = bbox
            tl = (int(tl[0]), int(tl[1]))
            br = (int(br[0]), int(br[1]))
            cv2.rectangle(img, tl, br, (0, 255, 0), 2)

    _, buffer = cv2.imencode('.jpg', img)
    return buffer.tobytes(), logo_found

def encode_image(image_bytes: bytes):
    return base64.b64encode(image_bytes).decode('utf-8')

async def analyze_image_logic(image_bytes: bytes, filename: str):
    """Core Async function utilizing Structured Chain-of-Thought prompting."""
    annotated_bytes, logo_found = process_bounding_boxes(image_bytes)
    base64_image = encode_image(annotated_bytes)

    vision_context = "A green bounding box has been drawn around the detected ZONNIC logo." if logo_found else "No ZONNIC logo was detected by the pre-processor."

    system_prompt = f"""
    You are a Senior Compliance AI evaluating ZONNIC assets. 
    Source of truth: {json.dumps(zonnic_rules)}
    {vision_context}

    STEP 1: CLASSIFY THE ASSET
    A) FLAVOUR-LED VISUAL: Focuses on specific flavors (Mint, Tropic Breeze).
    B) EDUCATIONAL / BRAND PURPOSE: Focuses on quitting smoking, lifestyle, hands/pouches, or general brand messaging.

    STEP 2: APPLY SPECIFIC RULES BASED ON CATEGORY
    ▶ IF FLAVOUR-LED:
    - BACKGROUND: MUST use a top-to-bottom flavour gradient (approx 70% dark primary top, 30% light secondary bottom). NEVER use solid white, solid grey, or inverted gradients.
    ▶ IF EDUCATIONAL / BRAND PURPOSE:
    - BACKGROUND: MUST use a neutral light grey, white, or the signature grey-to-white gradient, OR a photographic image.

    STEP 3: APPLY UNIVERSAL RULES (Applies to ALL assets)
    - THE "NO LOGO" RULE: A standalone ZONNIC logo is completely OPTIONAL for Educational/Brand Purpose assets. If an image just shows hands/pouches and has NO ZONNIC text, it is 100% VALID. Do NOT fail the image for missing a logo.
    - THE "CAN" RULE: Physical cans are exempt from 2D safety zones, BUT stacked logos ("ZON" over "NIC") printed on cans are a STRICT FAIL. The logo must ALWAYS be a single horizontal line.
    - TEXT VS LOGO: If "ZONNIC" is used in a sentence, treat it as typography, not a graphic logo.

    - STANDALONE 2D LOGO RULES (Only apply if a flat graphic logo is actually present):
        * CONTRAST: The word "ZONNIC" MUST be Navy Blue on pure white/bright backgrounds. It MUST be White on dark backgrounds AND medium-grey studio photography backgrounds. Give the image the benefit of the doubt on grey backgrounds.
        * HALO: The 'C' halo MUST have a visible 2-tone colour gradient. Accept any visible 2-tone transition. 
        * INTEGRITY: The logo must be a single horizontal line (Never stacked). It must NEVER be outlined, placed inside an arbitrary shape, or have gradients within the letters.
        * SAFETY ZONE: 50% clear space around the 'C'.
    
    - TYPOGRAPHY & LOCKUPS: 
        * Brand Font: All text must be Santral.
        * Lockups: Any NRT text following the logo MUST be Uppercase Santral Semi Bold, followed by a vertical bar (|), followed by Uppercase Santral Book.

    You MUST process the image logically. Output your analysis strictly in this JSON format, exactly in this order:
    {{
      "step_1_classification": "Identify if the asset is Flavour-Led, Educational/Lifestyle, or Product Photography.",
      "step_2_logo_presence": "Explicitly state if a standalone 2D logo is present. If it is just a can or hands, write 'No standalone logo'.",
      "step_3_background": "Identify the background type (Grey, White, Gradient, Photo).",
      "step_4_logic_gate": "Based on steps 1-3 and the core directives, explain if the image passes or fails.",
      "status": "PASS" | "FAIL" | "WARNING",
      "issues": ["List violations, or 'None'"],
      "rules_violated": ["Specific rules broken, or 'None'"],
      "suggestions": ["Actionable steps to fix, or 'None'"]
    }}
    """

    response = await client.chat.completions.create(
        model="gpt-4o",
        response_format={ "type": "json_object" },
        seed=42,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": [
                {"type": "text", "text": "Evaluate this asset strictly based on the rules."},
                {
                    "type": "image_url", 
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{base64_image}",
                        "detail": "high"
                    }
                }
            ]}
        ],
        temperature=0.0 
    )

    ai_result = json.loads(response.choices[0].message.content)
    ai_result["annotated_image"] = base64_image
    ai_result["filename"] = filename
    
    log_evaluation(
        filename=filename,
        status=ai_result.get("status", "ERROR"),
        issues=ai_result.get("issues", []),
        rules_violated=ai_result.get("rules_violated", [])
    )
    
    return ai_result


# ==========================================
# API ENDPOINTS
# ==========================================

@app.post("/api/evaluate")
async def evaluate_single(file: UploadFile = File(...)):
    """Handles a single image upload."""
    image_bytes = await file.read()
    result = await analyze_image_logic(image_bytes, file.filename)
    return result

@app.post("/api/evaluate/batch")
async def evaluate_batch(file: UploadFile = File(...)):
    """Extracts a ZIP file in memory and processes all images concurrently."""
    zip_bytes = await file.read()
    tasks = []
    
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
        for filename in z.namelist():
            if filename.startswith("__MACOSX") or filename.startswith("."):
                continue
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                with z.open(filename) as img_file:
                    img_bytes = img_file.read()
                    tasks.append(analyze_image_logic(img_bytes, filename))
    
    if not tasks:
        return {"error": "No valid images found in the zip file."}

    batch_results = await asyncio.gather(*tasks)
    return {"batch_results": batch_results}

@app.get("/api/history")
async def get_history():
    """Fetches the last 50 evaluations from the database."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM evaluations ORDER BY timestamp DESC LIMIT 50')
    rows = cursor.fetchall()
    conn.close()
    
    history = [dict(row) for row in rows]
    for item in history:
        item["issues"] = json.loads(item["issues"])
        item["rules_violated"] = json.loads(item["rules_violated"])
        
    return {"history": history}

@app.get("/api/history/export")
async def export_history_csv():
    """Generates a downloadable CSV report of the audit history."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM evaluations ORDER BY timestamp DESC')
    rows = cursor.fetchall()
    conn.close()

    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["Evaluation ID", "Timestamp", "Filename", "Compliance Status", "Issues Identified", "Rules Violated"])
    
    for row in rows:
        writer.writerow([
            row["id"],
            row["timestamp"],
            row["filename"],
            row["status"],
            row["issues"],
            row["rules_violated"]
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=zonnic_compliance_report.csv"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)