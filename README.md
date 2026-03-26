***

```markdown
# 🚀 ZONNIC AI Compliance Engine

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.10%2B-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-teal)

An enterprise-grade, full-stack AI pipeline designed to automate marketing asset compliance. This engine uses a combination of traditional Computer Vision and advanced Large Language Models (LLMs) to verify brand guidelines, enforce safety zones, and log telemetry for marketing audits.

## ✨ Key Features

* **🤖 Zero-Shot Visual Reasoning:** Utilizes OpenAI's GPT-4o with strict "Structured Chain-of-Thought" (CoT) prompting to evaluate complex, subjective design rules without hallucination.
* **👁️ Computer Vision Pre-processing:** Integrates `EasyOCR` and `OpenCV` to detect, localize, and draw bounding boxes around brand logos *before* LLM evaluation, increasing AI accuracy.
* **⚡ Asynchronous Batch Processing:** Leverages `asyncio` and in-memory zip extraction to evaluate batches of images concurrently, drastically reducing processing latency.
* **🗄️ Immutable Audit Logging:** Persists all AI decisions, rule violations, and timestamps to a local SQLite database for compliance tracking and stakeholder reporting (Includes CSV Export).
* **🧪 MLOps Evaluation Harness:** Features a standalone Continuous Integration (CI) testing script (`eval_harness.py`) to prevent "prompt drift" by measuring system accuracy against a ground-truth dataset.
* **💎 Premium Executive UI:** A modern, glassmorphism-styled Next.js frontend featuring drag-and-drop uploads, dynamic routing, and interactive data tables.

## 🛠️ Technology Stack

**Frontend:**
* React / Next.js (App Router)
* Tailwind CSS
* Lucide React (Icons)

**Backend:**
* Python / FastAPI
* AsyncIO / Uvicorn
* SQLite3 (Telemetry persistence)

**AI & Machine Learning:**
* OpenAI API (GPT-4o Vision)
* EasyOCR (Optical Character Recognition)
* OpenCV & NumPy (Image processing)

---

## 🚀 Getting Started (Local Development)

### 1. Clone the Repository
```bash
git clone [https://github.com/YOUR_USERNAME/zonnic-compliance.git](https://github.com/YOUR_USERNAME/zonnic-compliance.git)
cd zonnic-compliance
```

### 2. Backend Setup (FastAPI)
Navigate to the root directory where `main.py` is located. Create a virtual environment and install the dependencies.

```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn python-multipart openai opencv-python-headless numpy easyocr python-dotenv requests
```

**Environment Variables:**
Create a `.env` file in the same directory as `main.py` and add your OpenAI API Key:
```env
OPENAI_API_KEY=your_api_key_here
```

**Start the Server:**
```bash
python main.py
```
*The backend will now be running at `http://localhost:8000`. On first run, it will automatically generate the `zonnic_audit_history.db` SQLite file.*

### 3. Frontend Setup (Next.js)
Open a new terminal window and navigate to the `frontend` directory.

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
*The frontend will now be running at `http://localhost:3000`.*

---

## 🧪 Running the MLOps Evaluation Harness

To ensure the AI's logic remains accurate after prompt updates, you can run the automated regression testing suite.

1. Ensure the FastAPI backend (`main.py`) is currently running.
2. Ensure you have a folder named `test_assets` in your root directory containing the ground-truth images.
3. Open a new terminal and run:

```bash
python eval_harness.py
```

The script will batch-process the test assets, compare the AI's output to the hardcoded `EXPECTED_RESULTS` matrix, and output a system accuracy report.

---

## 🏗️ Architecture & Logic Flow
<pre><code>```mermaid
graph TD
    classDef frontend fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#fff;
    classDef backend fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#fff;
    classDef ai fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#fff;
    classDef db fill:#451a03,stroke:#fbbf24,stroke-width:2px,color:#fff;
    classDef mlops fill:#312e81,stroke:#a78bfa,stroke-width:2px,color:#fff,stroke-dasharray: 5 5;

    subgraph Client ["🖥️ Presentation Layer (Next.js)"]
        UI["React Web UI"]:::frontend
    end

    subgraph Server ["⚙️ Application Layer (FastAPI)"]
        API_EVAL["POST /api/evaluate"]:::backend
        API_BATCH["POST /api/evaluate/batch"]:::backend
        API_HIST["GET /api/history"]:::backend
        
        CV["Computer Vision (OpenCV + EasyOCR)"]:::ai
        LLM["AI Logic Engine (OpenAI GPT-4o)"]:::ai
    end

    subgraph Storage ["🗄️ Data Layer"]
        SQL[("SQLite Database")]:::db
    end

    subgraph Testing ["🧪 MLOps Layer"]
        EVAL["eval_harness.py (Automated Testing)"]:::mlops
    end

    UI -->|1. Upload Asset| API_EVAL
    UI -->|1. Upload .ZIP| API_BATCH
    UI -->|Fetch Audit Log| API_HIST
    
    API_EVAL -->|2. Image Bytes| CV
    API_BATCH -->|Async Tasks| CV
    
    CV -->|3. Bounding Box Image| LLM
    LLM -->|4. Strict JSON Output| SQL
    
    API_HIST -->|Query History| SQL
    
    EVAL -.->|Regression Test Images| API_EVAL
```</code></pre>




1. **Ingestion:** User uploads a `.jpg`, `.png`, `.webp`, or a `.zip` batch via the Next.js UI.
2. **Pre-Processing (CV):** The image is converted to a NumPy array. EasyOCR scans for the brand name. If found, OpenCV draws a 2px green bounding box to guide the LLM's attention.
3. **Reasoning (AI):** The annotated image is encoded to Base64 and sent to GPT-4o alongside a JSON-enforced Chain-of-Thought prompt containing the extracted brand master guidelines.
4. **Auditing (Data Engineering):** The JSON response is parsed, and the results (PASS/FAIL/WARNING, specific issues, timestamp) are committed to the SQLite database.
5. **Delivery:** The structured data and annotated image are returned to the frontend for executive display.

---
*Developed as an architectural demonstration of integrating Generative AI into enterprise compliance workflows.*
```

