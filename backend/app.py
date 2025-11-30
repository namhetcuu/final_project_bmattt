from flask import Flask, request, jsonify
from flask_cors import CORS
import email
import re
import tldextract
import PyPDF2
import docx
from io import BytesIO
from rapidfuzz import fuzz

app = Flask(__name__)
CORS(app)

history = []

# ==============================
# 1. Scan attachment
# ==============================
def scan_attachment(filename, content, mime):
    warnings = []

    dangerous_ext = ["exe","js","vbs","scr","bat","cmd","jar"]
    ext = filename.split(".")[-1].lower()

    if ext in dangerous_ext:
        warnings.append("File dạng thực thi – rất nguy hiểm!")

    text = ""

    if ext == "pdf":
        try:
            reader = PyPDF2.PdfReader(BytesIO(content))
            for page in reader.pages:
                text += page.extract_text() or ""
        except:
            text += ""

    elif ext == "docx":
        try:
            doc = docx.Document(BytesIO(content))
            text = "\n".join([p.text for p in doc.paragraphs])
        except:
            text = ""

    elif ext == "txt":
        try:
            text = content.decode(errors="ignore")
        except:
            text = ""

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


# ===========================================
# 2. URL SCAN
# ===========================================
def scan_urls(text):
    url_pattern = r"(https?://[^\s]+)"
    urls = re.findall(url_pattern, text)

    extracted = []
    warnings = []

    suspicious_domains = [
        "bit.ly", "tinyurl.com", "rb.gy", "shorturl.at",
        "weebly.com", "000webhostapp.com"
    ]

    blacklisted_domains = [
        "paypal-security-alert.com",
        "update-facebook-login.com",
        "bank-secure-check.com"
    ]

    for url in urls:
        domain = tldextract.extract(url).registered_domain
        status = "safe"

        if domain in suspicious_domains:
            status = "shortened / suspicious"
            warnings.append(f"URL rút gọn hoặc khả nghi: {url}")

        if domain in blacklisted_domains:
            status = "BLACKLISTED"
            warnings.append(f"URL trong danh sách đen: {url}")

        extracted.append({
            "url": url,
            "domain": domain,
            "status": status
        })

    return extracted, warnings


# ===========================================
# 3. PHISHING TEMPLATE DETECTION
# ===========================================
def detect_phishing_template(text):
    templates = {
        "PayPal Scam": """
        Your PayPal account has been limited.
        Please verify your identity to restore access.
        """,
        "Microsoft Outlook Scam": """
        Your mailbox storage is full.
        Click the link below to upgrade your email quota.
        """,
        "Bank Scam": """
        Your bank account has been suspended due to unusual activity.
        Please login to verify your information.
        """,
        "Facebook Scam": """
        Your Facebook account violated community guidelines.
        Please confirm your identity.
        """
    }

    matches = []
    text_lower = text.lower()

    for name, template in templates.items():
        score = fuzz.partial_ratio(text_lower, template.lower())
        if score >= 60:
            matches.append({
                "name": name,
                "score": score
            })

    return matches


# ===========================================
# 4. Analyze body text
# ===========================================
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

    urls, url_warnings = scan_urls(text)
    template_hits = detect_phishing_template(text)

    # Highlight URLs
    for item in urls:
        highlighted_text = highlighted_text.replace(
            item["url"],
            f"<mark style='background-color: #ff9; font-weight:bold'>{item['url']}</mark>"
        )

    # Add signs
    for w in url_warnings:
        signs.append({"type": "url", "text": w})
    for t in template_hits:
        signs.append({"type": "template", "name": t["name"], "score": t["score"]})

    # Label classification
    if template_hits or any("Phishing" in s for s in [k for k in signs if isinstance(k,str)]) or url_warnings:
        label = "Phishing"
    elif any("Spam" in s for s in [k for k in signs if isinstance(k,str)]):
        label = "Spam"
    elif any("Hoax" in s for s in [k for k in signs if isinstance(k,str)]):
        label = "Hoax"
    else:
        label = "Clean"

    return label, signs, highlighted_text, urls


# ===========================================
# 5. Process a single email
# ===========================================
def process_single_email(file_data, filename):
    msg = email.message_from_bytes(file_data)

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

    body = ""
    attachments = []

    if msg.is_multipart():
        for part in msg.walk():
            file_name = part.get_filename()
            if file_name:
                content = part.get_payload(decode=True)
                mime = part.get_content_type()
                attachments.append(scan_attachment(file_name, content, mime))
                continue

            if part.get_content_type() in ["text/plain", "text/html"]:
                body = part.get_payload(decode=True).decode(errors="ignore")
    else:
        body = msg.get_payload(decode=True).decode(errors="ignore")

    label, signs, highlighted_body, urls = analyze(body)

    return {
        "filename": filename,
        "label": label,
        "headers": headers,
        "spoof_warnings": spoof_warnings,
        "signs": signs,
        "body": highlighted_body,
        "attachments": attachments,
        "urls": urls
    }


# ===========================================
# 6. Upload handler
# ===========================================
@app.post("/upload")
def upload():
    files = request.files.getlist("files")
    if not files:
        return jsonify({"error": "No files uploaded"}), 400

    results = []
    for file in files:
        try:
            file_data = file.read()
            result = process_single_email(file_data, file.filename)
            results.append(result)
            history.append(result)
        except Exception as e:
            results.append({"filename": file.filename, "error": str(e), "label": "Error"})

    return jsonify(results)


@app.get("/history")
def get_history():
    return jsonify(history)


if __name__ == "__main__":
    app.run(debug=True)
