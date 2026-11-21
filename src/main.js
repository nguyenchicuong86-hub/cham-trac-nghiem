import {
  createSheetId,
  exportAnswerSheetPdf,
  renderAnswerSheetPreview,
} from "./answer-sheet.js";
import {
  ANSWER_SHEET_TEMPLATES,
  ANSWER_SHEET_TEMPLATE,
} from "./templates.js";
import "./grading-ui.js";

const form = document.querySelector("#sheet-form");
const preview = document.querySelector("#sheet-preview");
const exportButton = document.querySelector("#export-button");
const statusMessage = document.querySelector("#status-message");
const templatePicker = document.querySelector("#template-picker");
const examCodeField = document.querySelector("#exam-code-field");
const examFields = document.querySelector("#exam-fields");
const sheetId = createSheetId();
let activeTemplate = ANSWER_SHEET_TEMPLATE;

document.querySelector("#sheet-id-label").textContent = sheetId;

function updateTemplateDetails() {
  document.querySelector("#template-badge").textContent = activeTemplate.qr
    ? "A4 · Có QR"
    : "Phiếu 120 · A4";
  document.querySelector("#preview-title").textContent = activeTemplate.name;
  document.querySelector("#sheet-preview").setAttribute(
    "aria-label",
    `Bản xem trước ${activeTemplate.name}`,
  );
  document.querySelector("#sheet-id-row").hidden = !activeTemplate.qr;
  document.querySelector("#template-note").textContent = activeTemplate.note;
  document.querySelector("#field-note").textContent = activeTemplate.qr
    ? "Tên học sinh và lớp được để trống để điền sau khi in."
    : "Số báo danh và mã đề được điền trực tiếp trên phiếu.";
  document.querySelector("#page-footer").textContent = activeTemplate.qr
    ? "Mẫu tọa độ dùng chung cho bước quét sau này. Không thay đổi vị trí ô trả lời hoặc dấu định vị."
    : "Phiếu 120 khổ A4: 30 câu trắc nghiệm và khu vực trả lời tự luận.";
  examCodeField.hidden = !activeTemplate.qr;
  examFields.classList.toggle("single-field", !activeTemplate.qr);

  const rows = activeTemplate.summaryRows.map(({ label, value }) => {
    const row = document.createElement("div");
    const name = document.createElement("span");
    const detail = document.createElement("strong");
    name.textContent = label;
    detail.textContent = value;
    row.append(name, detail);
    return row;
  });
  document.querySelector("#template-summary-rows").replaceChildren(...rows);
}

function getMetadata() {
  return {
    schoolName: form.elements.schoolName.value.trim(),
    examTitle: form.elements.examTitle.value.trim(),
    subject: form.elements.subject.value.trim(),
    examCode: form.elements.examCode.value.trim(),
    sheetId,
  };
}

function updatePreview() {
  try {
    renderAnswerSheetPreview(preview, getMetadata(), activeTemplate);
    statusMessage.textContent = "";
    statusMessage.classList.remove("error");
  } catch (error) {
    statusMessage.textContent = error.message;
    statusMessage.classList.add("error");
  }
}

form.addEventListener("input", updatePreview);
templatePicker.addEventListener("change", (event) => {
  if (event.target.name !== "templateId") return;
  activeTemplate = ANSWER_SHEET_TEMPLATES.find((template) => template.id === event.target.value);
  if (!activeTemplate) return;
  updateTemplateDetails();
  updatePreview();
});
exportButton.addEventListener("click", async () => {
  try {
    await exportAnswerSheetPdf(getMetadata(), activeTemplate);
    statusMessage.classList.remove("error");
    statusMessage.textContent = "Đã tạo phiếu PDF vector.";
  } catch (error) {
    statusMessage.textContent = error.message;
    statusMessage.classList.add("error");
  }
});

updateTemplateDetails();
window.addEventListener("load", updatePreview, { once: true });
