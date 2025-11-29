📧 Email Analyzer – Spam / Hoax / Phishing Detection

Mini demo cho môn Bảo mật & An toàn thông tin

Dự án gồm:

Backend (Flask – Python): xử lý file .eml, tách nội dung email, phân tích dấu hiệu nguy hiểm.

Frontend (Next.js/React): giao diện upload file và hiển thị kết quả phân loại.

🚀 1. Yêu cầu môi trường
Backend

Python 3.9+

pip hoặc pipenv (tùy chọn)

Frontend

Node.js 18+

npm hoặc yarn

🗂 2. Cấu trúc dự án
project/
│
├── backend/
│   ├── app.py
│   ├── requirements.txt
│
└── frontend/
    ├── app/page.tsx  (hoặc app.tsx tùy bạn đặt)
    ├── package.json

🐍 3. Cài đặt & Chạy Backend (Flask)
Bước 1 – Tạo virtual environment
cd backend
python -m venv venv

Bước 2 – Kích hoạt environment
Windows:
venv\Scripts\activate

MacOS/Linux:
source venv/bin/activate

Bước 3 – Cài đặt thư viện

Tạo file requirements.txt (nếu bạn chưa có):

Flask==3.0.0
email


Cài bằng:

pip install -r requirements.txt

Bước 4 – Chạy server
python app.py


Nếu chạy thành công, terminal sẽ hiện:

Running on http://127.0.0.1:5000

⚛️ 4. Cài đặt & Chạy Frontend (Next.js)
Bước 1 – Cài dependencies
cd frontend
npm install

Bước 2 – Chạy frontend
npm run dev


Frontend sẽ chạy ở:

http://localhost:3000

🔗 5. Cách sử dụng demo

Mở trình duyệt → truy cập http://localhost:3000

Nhấn Choose File

Chọn một file email .eml tải từ Gmail/Outlook.

Hệ thống sẽ:

Hiển thị nội dung email

Hiển thị “dấu hiệu cảnh báo”

Phân loại: Spam / Hoax / Phishing / Clean

🧠 6. Mô tả logic phân tích email

Backend phân tích dựa vào regex:

Spam:

chứa từ khoá: "free", "khuyến mãi", "giảm giá"

Phishing:

yêu cầu xác minh tài khoản: "verify", "OTP", "login", "xác minh"

Hoax:

tin giật gân: "tin nóng", "khẩn cấp", "share ngay"

🛠 7. Test với file .eml
Cách lấy file .eml từ Gmail

Mở Gmail

Chọn email → bấm dấu …

Chọn Download original

Lưu file .eml
