# Chấm trắc nghiệm

Ứng dụng web tĩnh tạo và xuất phiếu trả lời khổ A4 dưới dạng PDF vector.

## Các mẫu phiếu

- 40 câu trắc nghiệm A–D và 5 câu đúng/sai (mỗi câu 4 ý).
- Mẫu phiếu 120: 30 câu A–D, lưới số báo danh/mã đề và phần tự luận.
- 24 câu A–D, 3 câu đúng/sai (mỗi câu 4 ý) và phần tự luận.

Chọn mẫu ở mục **Chọn mẫu phiếu chấm**, điền thông tin tiêu đề rồi nhấn **Tải PDF**. Tọa độ mẫu được định nghĩa tập trung trong `src/templates.js` và dùng chung cho bản xem trước, PDF và các bước quét tiếp theo.

## Nhập đáp án và chấm phiếu

Trong mục **Chấm bài**, chọn mẫu/mã đề, nhập đáp án chuẩn cho từng câu và lưu. Chọn đáp án đã lưu, sau đó tải ảnh phiếu hoặc mở camera. Ảnh được căn chỉnh theo bốn dấu định vị; ô tô được nhận diện theo tọa độ mẫu. Mẫu có QR được dùng để kiểm tra mã đề, còn số báo danh của mẫu phiếu 120 được đọc từ lưới tô. Điểm tự luận nhập thủ công. Có thể tải kết quả mới nhất hoặc toàn bộ lịch sử chấm dạng CSV. Dùng **Tải sao lưu đáp án** để lưu tệp JSON và **Nhập tệp sao lưu** để khôi phục đáp án trên trình duyệt/thiết bị khác.

Đáp án và lịch sử chấm lưu trong `localStorage` của trình duyệt hiện tại; ứng dụng chưa đồng bộ kết quả giữa thiết bị. Tệp sao lưu chỉ chứa đáp án chuẩn, không chứa lịch sử chấm. Chụp đủ bốn dấu định vị, phiếu đúng chiều và đủ sáng; luôn kiểm tra các ô bỏ trống/tô nhiều ô với bản giấy trước khi xác nhận điểm.

## Cài đặt ứng dụng

- **Android:** mở ứng dụng trong Chrome để cài PWA, hoặc tải APK từ GitHub Actions để cài bản Android độc lập. APK debug phù hợp thử nghiệm/cài riêng, không dùng để đưa lên Play Store.
- **iPhone/iPad:** mở trang GitHub Pages trong Safari, chọn **Chia sẻ → Thêm vào màn hình chính**. Đây là PWA; hiện chưa có IPA ký bằng chứng chỉ Apple hoặc bản trên App Store.
- **Windows:** workflow **Build installers** tạo bộ cài `Cham-Trac-Nghiem-Setup-1.0.0.exe` cho Windows x64.

APK và EXE được tạo bằng GitHub Actions khi cập nhật `main`. Tải hai artifact **android-apk** và **windows-installer** từ lần chạy mới nhất trong tab Actions. Ứng dụng đã cài dùng dữ liệu cục bộ như bản web; cần Internet để tải các thư viện PDF/QR từ CDN.

## Chạy cục bộ

Phục vụ thư mục này bằng một máy chủ web tĩnh, sau đó mở địa chỉ máy chủ trên trình duyệt. Các thư viện PDF, QR và phông tiếng Việt được tải từ CDN.

## Kiểm tra cấu hình phiếu

Mở `tests/templates.test.html` để kiểm tra cấu hình mẫu; mở `tests/grading.test.html` để kiểm tra căn chỉnh ảnh và tính điểm.

## Codespaces

`.devcontainer/devcontainer.json` yêu cầu Codespace 2 CPU, 8 GB RAM và 32 GB dung lượng. Thời gian chờ tự tắt 10–15 phút và hạn mức miễn phí theo tài khoản cần đặt/kiểm tra trong GitHub **Settings → Codespaces** và **Billing and licensing**.
