from ultralytics import YOLO
import cv2
import os
import time
import easyocr
import re
from database import SessionLocal
from models import Vehicle, Violation
from pathlib import Path
from cloudinary_utils import upload_image
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# ML/ML_Part
ML_PART_DIR = PROJECT_ROOT / "ML_Part"

OUTPUT_DIR = ML_PART_DIR / "violation_plates_image"

# Sanity check (VERY IMPORTANT)
if not ML_PART_DIR.exists():
    raise FileNotFoundError(f"ML_Part not found at {ML_PART_DIR}")

helmet_model = YOLO(
    ML_PART_DIR / "runs/detect/train2/weights/best.pt"
)

plate_model = YOLO(
    ML_PART_DIR / "runs/detect/train3/weights/best.pt"
)
# =========================
# OCR SETUP
# =========================

reader = easyocr.Reader(['en'])

def clean_plate_text(text):
    text = text.upper()
    text = re.sub(r'[^A-Z0-9]', '', text)
    return text

def extract_full_plate_text(ocr_results):
    parts = []
    for _, text, conf in ocr_results:
        if conf < 0.4:
            continue
        cleaned = clean_plate_text(text)
        if len(cleaned) >= 2:
            parts.append(cleaned)

    plate = "".join(parts)
    if len(plate) < 8:
        return ""
    return plate



def preprocess_plate_image(plate_img):
    # Convert to grayscale
    gray = cv2.cvtColor(plate_img, cv2.COLOR_BGR2GRAY)

    # Reduce noise while keeping edges
    gray = cv2.bilateralFilter(gray, 11, 17, 17)

    # Increase contrast using adaptive threshold
    thresh = cv2.adaptiveThreshold(
        gray,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        11,
        2
    )

    return thresh

def remove_leading_noise(plate):
    # Remove leading non-letter characters
    while plate and not plate[0].isalpha():
        plate = plate[1:]
    return plate




LETTER_MAP = {
    '0': 'D',
    '1': 'I',
    '2': 'Z',
    '5': 'S',
    '8': 'B'
}

DIGIT_MAP = {
    'O': '0',
    'D': '0',
    'I': '1',
    'L': '1',
    'Z': '2',
    'S': '5',
    'B': '8'
}


def enforce_indian_plate_format(plate):
    """
    Strict Indian number plate format:
    [0–1] Letters
    [2–3] Digits
    [4–5] Letters
    [6–9] Digits
    """

    if len(plate) < 10:
        return ""

    plate = list(plate[:10])  # Only first 10 chars matter

    # [0–1] STATE CODE → LETTER LETTER
    for i in [0, 1]:
        if not plate[i].isalpha():
            plate[i] = LETTER_MAP.get(plate[i], plate[i])
        if not plate[i].isalpha():
            return ""

    # [2–3] DISTRICT CODE → DIGIT DIGIT
    for i in [2, 3]:
        if not plate[i].isdigit():
            plate[i] = DIGIT_MAP.get(plate[i], plate[i])
        if not plate[i].isdigit():
            return ""

    # [4–5] SERIES CODE → LETTER LETTER
    for i in [4, 5]:
        if not plate[i].isalpha():
            plate[i] = LETTER_MAP.get(plate[i], plate[i])
        if not plate[i].isalpha():
            return ""

    # [6–9] VEHICLE NUMBER → DIGIT DIGIT DIGIT DIGIT
    for i in [6, 7, 8, 9]:
        if not plate[i].isdigit():
            plate[i] = DIGIT_MAP.get(plate[i], plate[i])
        if not plate[i].isdigit():
            return ""

    return "".join(plate)


# =========================
# DATABASE + MESSAGE HELPERS
# =========================

FINE_AMOUNT = 500

def get_vehicle_details(plate_number):

    db = SessionLocal()

    try:

        vehicle = db.query(Vehicle).filter(
            Vehicle.plate_number == plate_number
        ).first()

        if vehicle:
            return {
                "owner": vehicle.owner_name,
                "mobile": vehicle.mobile_number
            }

        return None

    finally:
        db.close()


def generate_violation_message(owner, plate):
    return (
        "🚨 Traffic Violation Alert 🚨\n\n"
        f"Dear {owner},\n"
        f"Vehicle Number: {plate}\n"
        "Violation: Riding without helmet\n"
        f"Fine Amount: ₹{FINE_AMOUNT}\n\n"
        "Please pay the fine within the due date to avoid penalties."
    )

def save_violation_to_db(v, final_image):

    db = SessionLocal()

    try:

        new_violation = Violation(
            plate_number=v["plate"],
            helmet=v["helmet"],
            ocr_status=v["ocrStatus"],
            confidence=str(v["confidence"]),
            image_path=v["image"],
            final_image_path=final_image,
            notification=v.get("notification", "pending"),
            timestamp=v["time"]
        )

        db.add(new_violation)
        db.commit()

    finally:
        db.close()



# =========================
# IMAGE INPUT
# =========================

def run_detection(image_path: str):
    
    img = cv2.imread(image_path)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    if img is None:
        print("❌ Image not found")
        exit()

    
    
    violations = []
    
    # =========================
    # HELMET DETECTION
    # =========================
    
    helmet_results = helmet_model(img, imgsz=640, verbose=False)
    
    for box in helmet_results[0].boxes:
        conf = float(box.conf.item())
        if conf < 0.3:
            continue
    
        cls_id = int(box.cls.item())
        label = helmet_model.names[cls_id]
    
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        rider_center_x = (x1 + x2) // 2
        rider_width = x2 - x1
    
        # Draw helmet box
        if label == "no_helmet":
            color = (0, 0, 255)
            text = "NO HELMET"
        else:
            color = (0, 255, 0)
            text = "HELMET"
    
        cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
        cv2.putText(
            img, text, (x1, y1 - 10),
            cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2
        )
    
        # =========================
        # NUMBER PLATE (ONLY IF NO HELMET)
        # =========================
    
        if label != "no_helmet":
            continue
    
        roi_top = y2
        roi_bottom = img.shape[0]
    
        roi_left = max(0, x1 - int(0.3 * rider_width))
        roi_right = min(img.shape[1], x2 + int(0.3 * rider_width))
    
        roi = img[roi_top:roi_bottom, roi_left:roi_right]
        if roi.size == 0:
            continue
    
        plate_results = plate_model(roi, imgsz=640, conf=0.4, verbose=False)
    
        best_plate = None
        min_dist = float("inf")
    
        for pbox in plate_results[0].boxes:
            px1, py1, px2, py2 = map(int, pbox.xyxy[0])
    
            px1 += roi_left
            px2 += roi_left
            py1 += roi_top
            py2 += roi_top
    
            plate_center_x = (px1 + px2) // 2
            dist = abs(plate_center_x - rider_center_x)
    
            if dist < min_dist:
                min_dist = dist
                best_plate = (px1, py1, px2, py2)
    
        plate_text = ""
        plate_path = None
        plate_cloud_url = None
    
        if best_plate:
            px1, py1, px2, py2 = best_plate
            plate_crop = img[py1:py2, px1:px2]
    
            if plate_crop.size > 0:
                timestamp = int(time.time() * 1000)
                plate_path = OUTPUT_DIR / f"plate_{timestamp}.jpg"
                cv2.imwrite(str(plate_path), plate_crop)
                print("stored cropped images")
                # Upload to Cloudinary
                plate_cloud_url = upload_image(str(plate_path))
                
                # Optional cleanup
                os.remove(plate_path)
                    
                processed_plate = preprocess_plate_image(plate_crop)
                ocr_results = reader.readtext(processed_plate)
    
                plate_text = extract_full_plate_text(ocr_results)
                plate_text = enforce_indian_plate_format(plate_text)
    
                
    
    
                cv2.rectangle(img, (px1, py1), (px2, py2), (255, 0, 0), 2)
                cv2.putText(
                    img, "PLATE (VIOLATION)", (px1, py1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2
                )
    
        # =========================
        # DATABASE + MESSAGE
        # =========================
        notification_status = "not_sent"

    
        vehicle_info = get_vehicle_details(plate_text) if plate_text else None
    
        if plate_text == "":
            message = (
                "Helmet violation detected\n"
                "Plate unreadable (manual verification required)"
            )
    
        elif vehicle_info:
            sms_text = generate_violation_message(
                vehicle_info["owner"], plate_text
            )
        
            print("\n📩 SMS SENT TO:", vehicle_info["mobile"])
            print(sms_text)
        
            notification_status = "sent"
        
            message = (
                "Helmet violation detected\n"
                f"Vehicle: {plate_text}\n"
                f"Fine: ₹{FINE_AMOUNT}\n"
                "Notification sent to registered mobile number"
            )

    
        else:
            notification_status = "vehicle_not_found"
            message = (
                "Helmet violation detected\n"
                f"Vehicle: {plate_text}\n"
                "Vehicle not found in database"
            )

    
        print(message)
    
        violations.append({
        "id": str(len(violations) + 1),
        "plate": plate_text if plate_text else "UNREADABLE",
        "helmet": "no_helmet",
        "ocrStatus": "readable" if plate_text else "unreadable",
        "confidence": round(conf, 2),
        "image": plate_cloud_url if plate_path else None,
        "notification": notification_status,


        "time": time.strftime("%Y-%m-%dT%H:%M:%S")
         })
    # inside run_detection(), BEFORE return
    timestamp = int(time.time())
    final_image_name = f"final_{timestamp}.jpg"
    final_image_path = OUTPUT_DIR / final_image_name

    cv2.imwrite(str(final_image_path), img)
    final_image_url = upload_image(str(final_image_path))

    # Optional cleanup
    os.remove(final_image_path)
    # -------------------------
    # SAVE VIOLATIONS TO DB
    # -------------------------
    for v in violations:
        save_violation_to_db(v, final_image_url)

    return {
    "violations": violations,
    "final_image": final_image_url
}


