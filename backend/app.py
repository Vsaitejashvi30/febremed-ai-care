import json
import logging
import os
from pathlib import Path
from typing import Any, Dict

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from PIL import Image
from google.api_core import exceptions as google_exceptions
import google.generativeai as genai
import pytesseract

load_dotenv()

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Gemini once during startup
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY is not set. /api/extract-medication will return an error until configured.")
else:
    genai.configure(api_key=GEMINI_API_KEY)

# Optional override for Tesseract executable path (useful on Windows installations)
TESSERACT_CMD = os.getenv("TESSERACT_CMD")
if TESSERACT_CMD:
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD
    logger.info("Using custom Tesseract command: %s", TESSERACT_CMD)
elif os.name == "nt":
    potential_paths = [
        Path("C:/Program Files/Tesseract-OCR/tesseract.exe"),
        Path("C:/Program Files (x86)/Tesseract-OCR/tesseract.exe"),
    ]
    for candidate in potential_paths:
        if candidate.exists():
            pytesseract.pytesseract.tesseract_cmd = str(candidate)
            logger.info("Detected Tesseract installation at %s", candidate)
            break
    else:
        logger.warning("Tesseract executable not found. Set TESSERACT_CMD in .env if installed elsewhere.")
else:
    logger.debug("Using system PATH to locate Tesseract executable.")

try:
    pytesseract.get_tesseract_version()
except pytesseract.TesseractNotFoundError:
    logger.warning("pytesseract could not locate Tesseract. Ensure it is installed and accessible.")

DEFAULT_MODEL = "models/gemini-flash-latest"
MODEL_NAME = os.getenv("GEMINI_MODEL", DEFAULT_MODEL)

if MODEL_NAME == DEFAULT_MODEL:
    logger.info("Using default Gemini model: %s", MODEL_NAME)
else:
    logger.info("Using custom Gemini model: %s", MODEL_NAME)


def _build_gemini_prompt(extracted_text: str) -> str:
    return (
        "You are a medical text analyzer. Analyze this prescription text and extract medication information.\n\n"
        "PRESCRIPTION TEXT:\n"
        f"{extracted_text}\n\n"
        "TASK:\n"
        "1. Identify the medication name\n"
        "2. Classify medication type:\n"
        "   - Antipyretic (fever reducers: Paracetamol, Ibuprofen, Aspirin)\n"
        "   - Antibiotic (bacteria killers: Amoxicillin, Azithromycin, etc.)\n"
        "   - Antiviral (virus fighters: Oseltamivir, Acyclovir, etc.)\n"
        "   - Other\n"
        "3. Extract dosage, frequency, duration if present\n\n"
        "RESPOND ONLY in valid JSON (no markdown, no extra text):\n"
        "{\n"
        "    \"medication_name\": \"exact name from prescription\",\n"
        "    \"medication_type\": \"Antipyretic|Antibiotic|Antiviral|Other\",\n"
        "    \"dosage\": \"amount and unit or null\",\n"
        "    \"frequency\": \"times per day or schedule or null\",\n"
        "    \"duration_days\": \"number of days or null\",\n"
        "    \"confidence\": \"high|medium|low\",\n"
        "    \"extracted_text\": \"the raw OCR text\"\n"
        "}"
    )


def _parse_gemini_response(response: Any) -> Dict[str, Any]:
    """Safely extract JSON payload from Gemini response."""
    raw_text = getattr(response, "text", "")

    if not raw_text and hasattr(response, "candidates"):
        # Fall back to candidates structure if text is not populated
        for candidate in response.candidates:
            content = getattr(candidate, "content", None)
            parts = getattr(content, "parts", []) if content else []
            for part in parts:
                if hasattr(part, "text"):
                    raw_text = part.text
                    break
            if raw_text:
                break

    if not raw_text:
        raise ValueError("Empty response from Gemini model")

    cleaned = raw_text.strip()
    # Remove backticks if Gemini wrapped the JSON in a code block
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        cleaned = cleaned.replace("json\n", "", 1).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse Gemini response: %s", cleaned)
        raise ValueError("Failed to parse Gemini response as JSON") from exc


@app.route("/api/extract-medication", methods=["POST"])
def extract_medication():
    if request.method != "POST":
        return jsonify({"error": "Method not allowed"}), 405

    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    if not GEMINI_API_KEY:
        return jsonify({"error": "GEMINI_API_KEY is not configured"}), 500

    try:
        image_file = request.files["image"]
        image = Image.open(image_file.stream)
        image = image.convert("RGB")  # Normalize to avoid mode-related OCR issues

        logger.info("Running OCR on uploaded image")
        extracted_text = pytesseract.image_to_string(image)

        if not extracted_text or not extracted_text.strip():
            return jsonify({"error": "Could not extract text from image. Please use a clearer photo."}), 400

        logger.info("Extracted text length: %d", len(extracted_text))

        logger.info("Calling Gemini model: %s", MODEL_NAME)
        model = genai.GenerativeModel(MODEL_NAME)
        prompt = _build_gemini_prompt(extracted_text)
        response = model.generate_content(prompt)

        medication_data = _parse_gemini_response(response)

        if "extracted_text" not in medication_data or not medication_data["extracted_text"]:
            medication_data["extracted_text"] = extracted_text

        return (
            jsonify(
                {
                    "success": True,
                    "medication_data": medication_data,
                    "extracted_text": extracted_text,
                }
            ),
            200,
        )
    except pytesseract.TesseractNotFoundError:
        logger.exception("Tesseract executable not found")
        return jsonify({"error": "Tesseract OCR is not installed or not found in PATH."}), 500
    except google_exceptions.ResourceExhausted:
        logger.exception("Gemini quota exceeded")
        return (
            jsonify(
                {
                    "error": "Gemini quota exceeded. Please wait a moment or switch to a lighter model such as models/gemini-flash-lite-latest."
                }
            ),
            429,
        )
    except google_exceptions.GoogleAPIError as exc:
        logger.exception("Gemini API error")
        return jsonify({"error": f"Gemini API error: {exc}"}), 502
    except ValueError as exc:
        logger.exception("Validation error during extraction")
        return jsonify({"error": str(exc)}), 500
    except Exception as exc:
        logger.exception("Unexpected error during extraction")
        return jsonify({"error": str(exc)}), 500


@app.get("/api/health")
def health_check():
    return jsonify({"status": "healthy"}), 200


if __name__ == "__main__":
    app.run(debug=os.getenv("FLASK_ENV") == "development", port=int(os.getenv("PORT", 5000)))
