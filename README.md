# 🧪 Test Automation Dashboard & Runner (App_Slug: test-automation-dashboard)

Ứng dụng quản lý, thiết kế và chạy thử nghiệm tự động hóa toàn diện theo chuẩn **BMad Method 6.12.0** và **TEA Enterprise 1.27.2** [ID:363]. Hệ thống tích hợp trình giả lập Playwright CLI [ID:194] và API Testing Client [ID:443] giúp các kỹ sư kiểm thử (Test Architects) dễ dàng thiết kế kịch bản, thực thi kiểm thử tự động, phân tích Trace Artifacts [ID:194] và xuất báo cáo chất lượng phần mềm.

## 🚀 Tính Năng Chính
- **Quản lý Test Suite & Test Case**: Thiết kế kịch bản kiểm thử giao diện (E2E Playwright) và tích hợp REST API [ID:443].
- **Trình Giả Lập Playwright CLI**: Mô phỏng các lệnh CLI (`open`, `snapshot`, `click`, `fill`, `screenshot`) trực quan [ID:194].
- **Trình Chạy Test (Test Runner)**: Thực thi các ca kiểm thử thời gian thực, hiển thị log chi tiết và kết quả trực quan.
- **Phân Tích Trace Artifacts**: Trình phân tích lỗi tự động dựa trên mã lỗi HTTP (400, 403, 404, 500) [ID:443] và các bước lỗi của Playwright [ID:194].
- **Báo Cáo Chất Lượng (Test Report)**: Biểu đồ trực quan hóa tỷ lệ thành công, thời gian chạy và độ bao phủ kiểm thử.

---

## 📂 Cấu Trúc Thư Mục Dự Án
```text
test-automation-dashboard/
├── package.json
├── server.js
├── README.md
└── public/
    ├── index.html
    ├── style.css
    └── app.js
```

## 🛠️ Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Cài đặt các thư viện phụ thuộc
```bash
npm install
```

### 2. Khởi chạy máy chủ phát triển (Development Server)
```bash
npm start
```
Mặc định ứng dụng sẽ chạy tại địa chỉ: `http://localhost:3000`

### 3. Chạy thử nghiệm tự động hóa (Playwright CLI Simulator)
Mở trình duyệt truy cập giao diện, chọn tab **Playwright CLI Simulator** để thực thi thử nghiệm các lệnh tương tác trình duyệt giả lập [ID:194].

---
*Hệ thống được xây dựng dựa trên tài liệu chuẩn hóa Starter-Kit BMad & TEA Enterprise [ID:450].*
```

---