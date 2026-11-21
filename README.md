# Chấm trắc nghiệm

Ứng dụng web tĩnh tạo và xuất phiếu trả lời khổ A4 dưới dạng PDF vector.

## Các mẫu phiếu

- 40 câu trắc nghiệm A–D và 5 câu đúng/sai (mỗi câu 4 ý).
- Mẫu phiếu 120: 30 câu A–D, lưới số báo danh/mã đề và phần tự luận.
- 24 câu A–D, 3 câu đúng/sai (mỗi câu 4 ý) và phần tự luận.

Chọn mẫu ở mục **Chọn mẫu phiếu chấm**, điền thông tin tiêu đề rồi nhấn **Tải PDF**. Tọa độ mẫu được định nghĩa tập trung trong `src/templates.js` và dùng chung cho bản xem trước, PDF và các bước quét tiếp theo.

## Chạy cục bộ

Phục vụ thư mục này bằng một máy chủ web tĩnh, sau đó mở địa chỉ máy chủ trên trình duyệt. Các thư viện PDF, QR và phông tiếng Việt được tải từ CDN.

## Kiểm tra cấu hình phiếu

Mở `tests/templates.test.html` qua máy chủ web để kiểm tra số câu, vùng tô, dấu định vị và các dòng tự luận của ba mẫu.
