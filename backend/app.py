from flask import Flask, request, jsonify
from flask_cors import CORS
import email
import re
import tldextract
import PyPDF2
import docx
from io import BytesIO


app = Flask(__name__)
CORS(app)

history = []   # <<< Thêm dòng này

def scan_attachment(filename, content, mime):
    warnings = []

    dangerous_ext = ["exe","js","vbs","scr","bat","cmd","jar"]
    ext = filename.split(".")[-1].lower()

    # Check file nguy hiểm
    if ext in dangerous_ext:
        warnings.append("File dạng thực thi – rất nguy hiểm!")

    text = ""

    # Extract nội dung PDF
    if ext == "pdf":
        try:
            reader = PyPDF2.PdfReader(BytesIO(content))
            for page in reader.pages:
                text += page.extract_text() or ""
        except:
            text += ""

    # Extract DOCX
    elif ext == "docx":
        try:
            doc = docx.Document(BytesIO(content))
            text = "\n".join([p.text for p in doc.paragraphs])
        except:
            text = ""

    # Extract TXT
    elif ext == "txt":
        try:
            text = content.decode(errors="ignore")
        except:
            text = ""

    # Scan keyword phishing trong attachment
    keywords = ["password", "verify", "OTP", "login", "xác minh"]
    for kw in keywords:
        if kw.lower() in text.lower():
            warnings.append(f"Tìm thấy từ khóa nguy hiểm trong file: {kw}")

    return {
        "filename": filename,
        "mime": mime,
        "size": len(content),
        "text_preview": text[:500],
        "warnings": warnings
    }



def analyze(text):
    signs = []

    keyword_patterns = {
        "Spam": r"(free|giảm giá|khuyến mãi)",
        "Phishing": r"(verify|login|xác minh|OTP)",
        "Hoax": r"(tin nóng|khẩn cấp|share ngay)"
    }

    highlighted_text = text

    for label, pattern in keyword_patterns.items():
        matches = re.findall(pattern, text, re.I)
        if matches:
            signs.append(f"{label}: phát hiện từ khóa {', '.join(set(matches))}")

            highlighted_text = re.sub(
                pattern,
                lambda m: f"<mark style='background-color: yellow; font-weight: bold'>{m.group(0)}</mark>",
                highlighted_text,
                flags=re.I
            )

    if any("Phishing" in s for s in signs):
        label = "Phishing"
    elif any("Spam" in s for s in signs):
        label = "Spam"
    elif any("Hoax" in s for s in signs):
        label = "Hoax"
    else:
        label = "Clean"

    return label, signs, highlighted_text


@app.post("/upload")
def upload():
    file = request.files["file"]
    msg = email.message_from_bytes(file.read())

    headers = {
        "from": msg.get("From"),
        "to": msg.get("To"),
        "subject": msg.get("Subject"),
        "reply_to": msg.get("Reply-To"),
        "return_path": msg.get("Return-Path")
    }

    spoof_warnings = []

    if headers["reply_to"] and headers["reply_to"] != headers["from"]:
        spoof_warnings.append("Reply-To khác From → có thể là email lừa đảo.")

    try:
        sender_domain = tldextract.extract(headers["from"]).registered_domain
        fake_domains = ["gmail-confrim.com", "facebook-alert.net"]
        if sender_domain in fake_domains:
            spoof_warnings.append("Domain gửi tương tự domain thật → nghi ngờ phishing")
    except:
        pass

    # -------- Lấy body + attachments --------
    body = ""
    attachments = []

    if msg.is_multipart():
        for part in msg.walk():

            # Attachment detect
            filename = part.get_filename()
            if filename:
                content = part.get_payload(decode=True)
                mime = part.get_content_type()

                att_info = scan_attachment(filename, content, mime)
                attachments.append(att_info)
                continue

            # Normal email content
            if part.get_content_type() in ["text/plain", "text/html"]:
                body = part.get_payload(decode=True).decode(errors="ignore")

    else:
        body = msg.get_payload(decode=True).decode(errors="ignore")

    # Phân tích body
    label, signs, highlighted_body = analyze(body)

    # Lưu lịch sử
    entry = {
        "label": label,
        "headers": headers,
        "spoof_warnings": spoof_warnings,
        "signs": signs,
        "body": highlighted_body,
        "attachments": attachments
    }
    history.append(entry)

    return jsonify(entry)


@app.get("/history")
def get_history():
    return jsonify(history)


if __name__ == "__main__":
    app.run(debug=True)
