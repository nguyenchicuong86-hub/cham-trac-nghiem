import { ANSWER_SHEET_TEMPLATES, getMultipleChoiceRows, getTrueFalseRows } from "./templates.js";
import {
  createEmptyAnswerKey,
  gradeAnswers,
  loadAnswerKeys,
  loadGradingResults,
  saveAnswerKey,
  saveAnswerKeys,
  saveGradingResult,
  scanAnswerImage,
} from "./grading.js";

const keyTemplateSelect = document.querySelector("#key-template-select");
const keyExamCodeInput = document.querySelector("#key-exam-code");
const answerFields = document.querySelector("#answer-fields");
const gradingKeySelect = document.querySelector("#grading-key-select");
const scanCanvas = document.querySelector("#scan-canvas");
const scanFileInput = document.querySelector("#scan-file");
const gradeButton = document.querySelector("#grade-button");
const gradingResult = document.querySelector("#grading-result");
const cameraVideo = document.querySelector("#camera-preview");
const essayScoreField = document.querySelector("#essay-score-field");
const downloadResultsButton = document.querySelector("#download-results");
const downloadHistoryButton = document.querySelector("#download-history");
const exportAnswerKeysButton = document.querySelector("#export-answer-keys");
const importAnswerKeysInput = document.querySelector("#import-answer-keys");

let answerKeys = [];
let draftTemplate = ANSWER_SHEET_TEMPLATES[0];
let liveCameraStream;
let scanFileName = "";
let latestResult;

function setMessage(message, isError = false) {
  gradingResult.textContent = message;
  gradingResult.classList.toggle("error", isError);
}

function addAnswerSelect(container, label, options, value, name) {
  const field = document.createElement("label");
  field.className = "answer-item";
  const title = document.createElement("span");
  title.textContent = label;
  const select = document.createElement("select");
  select.name = name;
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Chưa chọn";
  select.append(placeholder);
  for (const option of options) {
    const item = document.createElement("option");
    item.value = option;
    item.textContent = option;
    select.append(item);
  }
  select.value = value || "";
  field.append(title, select);
  container.append(field);
}

function renderAnswerKeyFields() {
  const saved = answerKeys.find((key) => key.templateId === draftTemplate.id
    && key.examCode === keyExamCodeInput.value.trim());
  const key = saved || createEmptyAnswerKey(draftTemplate, keyExamCodeInput.value);
  const mcSection = document.createElement("details");
  mcSection.className = "answer-section";
  mcSection.open = true;
  const mcTitle = document.createElement("summary");
  mcTitle.textContent = `Trắc nghiệm (${draftTemplate.multipleChoice.count} câu)`;
  const mcGrid = document.createElement("div");
  mcGrid.className = "answer-grid";
  getMultipleChoiceRows(draftTemplate).forEach((row) => {
    addAnswerSelect(mcGrid, `Câu ${row.number}`, draftTemplate.multipleChoice.options,
      key.multipleChoice[row.number - 1], `mc-${row.number}`);
  });
  mcSection.append(mcTitle, mcGrid);
  answerFields.replaceChildren(mcSection);

  if (draftTemplate.trueFalse) {
    const tfSection = document.createElement("details");
    tfSection.className = "answer-section";
    tfSection.open = draftTemplate.trueFalse.questionCount <= 3;
    const tfTitle = document.createElement("summary");
    tfTitle.textContent = `Đúng / Sai (${draftTemplate.trueFalse.questionCount} câu)`;
    const tfGrid = document.createElement("div");
    tfGrid.className = "answer-grid";
    getTrueFalseRows(draftTemplate).forEach((row, index) => {
      addAnswerSelect(tfGrid, `${row.question}${row.statement})`, ["Đ", "S"],
        key.trueFalse[index], `tf-${index + 1}`);
    });
    tfSection.append(tfTitle, tfGrid);
    answerFields.append(tfSection);
  }

  const mcPoints = document.querySelector("#mc-points");
  const tfPoints = document.querySelector("#tf-points");
  const essayPoints = document.querySelector("#essay-points");
  mcPoints.value = String(saved?.points.multipleChoice ?? 1);
  tfPoints.value = String(saved?.points.trueFalse ?? 1);
  essayPoints.value = String(saved?.points.essay ?? (draftTemplate.essay ? 10 : 0));
  tfPoints.disabled = !draftTemplate.trueFalse;
  essayPoints.disabled = !draftTemplate.essay;
}

function refreshSavedKeyControls(selectedId = gradingKeySelect.value) {
  gradingKeySelect.replaceChildren();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = answerKeys.length
    ? "Chọn đáp án chuẩn"
    : "Chưa có đáp án — hãy lưu đáp án trước";
  gradingKeySelect.append(placeholder);
  for (const key of answerKeys) {
    const template = ANSWER_SHEET_TEMPLATES.find((item) => item.id === key.templateId);
    const option = document.createElement("option");
    option.value = key.id;
    option.textContent = `${template?.selectionTitle || key.templateId} · Mã đề ${key.examCode}`;
    gradingKeySelect.append(option);
  }
  if (answerKeys.some((key) => key.id === selectedId)) gradingKeySelect.value = selectedId;
  document.querySelector("#saved-key-list").replaceChildren(...answerKeys.map((key) => {
    const template = ANSWER_SHEET_TEMPLATES.find((item) => item.id === key.templateId);
    const entry = document.createElement("li");
    entry.textContent = `${template?.selectionTitle || key.templateId} · Mã đề ${key.examCode}`;
    return entry;
  }));
  exportAnswerKeysButton.disabled = answerKeys.length === 0;
  gradeButton.disabled = !gradingKeySelect.value || scanCanvas.width <= 300;
  updateEssayScoreField();
}

function updateEssayScoreField() {
  const key = answerKeys.find((item) => item.id === gradingKeySelect.value);
  essayScoreField.hidden = !key?.points.essay;
  if (key) document.querySelector("#essay-score").max = String(key.points.essay);
}

function readAnswerKeyDraft() {
  const examCode = keyExamCodeInput.value.trim();
  if (!examCode) throw new Error("Hãy nhập mã đề cho đáp án chuẩn.");
  const key = createEmptyAnswerKey(draftTemplate, examCode);
  key.points = {
    multipleChoice: Number(document.querySelector("#mc-points").value),
    trueFalse: Number(document.querySelector("#tf-points").value),
    essay: Number(document.querySelector("#essay-points").value),
  };
  if (Object.values(key.points).some((points) => !Number.isFinite(points) || points < 0)) {
    throw new Error("Điểm mỗi phần phải là một số không âm.");
  }
  key.multipleChoice = Array.from(answerFields.querySelectorAll('select[name^="mc-"]'), (select) => select.value);
  key.trueFalse = Array.from(answerFields.querySelectorAll('select[name^="tf-"]'), (select) => select.value);
  const missing = key.multipleChoice.filter((answer) => !answer).length
    + key.trueFalse.filter((answer) => !answer).length;
  if (missing) throw new Error(`Còn ${missing} đáp án chưa chọn.`);
  return key;
}

function decodeSheetQr(imageData) {
  if (typeof window.jsQR !== "function") return null;
  const decoded = window.jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "attemptBoth",
  });
  if (!decoded) return null;
  const [prefix, templateId, examCode, sheetId] = decoded.data.split("|");
  if (prefix !== "OMR" || !templateId || !examCode || !sheetId) {
    throw new Error("QR trên phiếu không đúng định dạng nhận diện.");
  }
  return { templateId, examCode, sheetId };
}

async function prepareScanImage(file) {
  if (!file || !file.type.startsWith("image/")) throw new Error("Hãy chọn tệp ảnh phiếu hợp lệ.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / bitmap.width, 2200 / bitmap.height);
  scanCanvas.width = Math.round(bitmap.width * scale);
  scanCanvas.height = Math.round(bitmap.height * scale);
  const context = scanCanvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(bitmap, 0, 0, scanCanvas.width, scanCanvas.height);
  bitmap.close();
  document.querySelector("#scan-preview").src = scanCanvas.toDataURL("image/jpeg", 0.9);
  document.querySelector("#scan-preview-wrap").hidden = false;
  scanFileName = file.name || "anh-phieu.jpg";
  gradeButton.disabled = !gradingKeySelect.value;
  latestResult = undefined;
  downloadResultsButton.hidden = true;
  setMessage(`Đã tải ảnh ${scanFileName}.`);
}

function stopCamera() {
  if (liveCameraStream) {
    liveCameraStream.getTracks().forEach((track) => track.stop());
    liveCameraStream = undefined;
  }
  cameraVideo.srcObject = null;
  cameraVideo.hidden = true;
  document.querySelector("#capture-photo").disabled = true;
  document.querySelector("#stop-camera").disabled = true;
  document.querySelector("#start-camera").disabled = false;
}

function createResultElement(result, detection, key, qrInfo) {
  const details = document.createElement("div");
  details.className = "result-score";
  const score = document.createElement("strong");
  score.textContent = `${result.score.toFixed(2)} / ${result.maximumScore.toFixed(2)} điểm`;
  details.append(score);
  for (const line of [
    `Trắc nghiệm đúng ${result.mcCorrect}/${result.mcTotal} · Đúng/sai đúng ${result.tfCorrect}/${result.tfTotal}`,
    `Thí sinh: ${result.candidateNumber || "chưa xác định"} · Mã đề: ${result.examCode}`,
    `${result.blankCount} ô bỏ trống · ${result.multipleMarkCount} câu tô nhiều ô`,
  ]) {
    const row = document.createElement("span");
    row.textContent = line;
    details.append(row);
  }
  if (qrInfo) {
    const row = document.createElement("span");
    row.textContent = `QR: ${qrInfo.sheetId}`;
    details.append(row);
  }
  if (detection.uncertainIdentity || result.blankCount || result.multipleMarkCount) {
    const warning = document.createElement("span");
    warning.className = "result-warning";
    warning.textContent = "Hãy đối chiếu các ô trống/tô nhiều ô và thông tin thí sinh với phiếu gốc.";
    details.append(warning);
  }
  return details;
}

function downloadLatestResultCsv() {
  if (!latestResult) return;
  downloadResultsCsv([latestResult], `ket-qua-${latestResult.examCode}-${latestResult.candidateNumber || "thi-sinh"}.csv`);
}

function downloadResultsCsv(results, filename) {
  const headers = [
    "Thời gian chấm", "Thí sinh", "Mã đề", "Mẫu phiếu", "Trắc nghiệm đúng", "Tổng trắc nghiệm",
    "Đúng/sai đúng", "Tổng ý đúng/sai", "Điểm khách quan", "Điểm tự luận", "Tổng điểm",
    "Điểm tối đa", "Ô trống", "Tô nhiều ô", "Tệp ảnh",
  ];
  const rows = results.map((result) => [
    result.createdAt || "", result.candidateNumber, result.examCode, result.templateName,
    result.mcCorrect, result.mcTotal, result.tfCorrect, result.tfTotal, result.objectiveScore,
    result.essayScore, result.score, result.maximumScore, result.blankCount,
    result.multipleMarkCount, result.scanFileName || "",
  ]);
  const csv = `\uFEFF${[headers, ...rows].map((row) => row.map((cell) =>
    `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function refreshGradingHistory() {
  const results = loadGradingResults();
  const historyList = document.querySelector("#grading-history");
  historyList.replaceChildren(...results.slice(0, 10).map((result) => {
    const entry = document.createElement("li");
    const timestamp = result.createdAt ? new Date(result.createdAt).toLocaleString("vi-VN") : "";
    entry.textContent = `${timestamp} · ${result.candidateNumber || "Chưa rõ thí sinh"} · Mã ${result.examCode} · ${Number(result.score).toFixed(2)}/${Number(result.maximumScore).toFixed(2)} điểm`;
    return entry;
  }));
  downloadHistoryButton.hidden = results.length === 0;
  return results;
}

function exportSavedAnswerKeys() {
  if (!answerKeys.length) return;
  const backup = {
    format: "cham-trac-nghiem-answer-keys",
    version: 1,
    exportedAt: new Date().toISOString(),
    answerKeys,
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json;charset=utf-8",
  }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "sao-luu-dap-an.json";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function importSavedAnswerKeys(file) {
  if (!file) return;
  const backup = JSON.parse(await file.text());
  if (backup?.format !== "cham-trac-nghiem-answer-keys" || backup.version !== 1) {
    throw new Error("Tệp sao lưu không đúng định dạng hoặc phiên bản.");
  }
  answerKeys = saveAnswerKeys(backup.answerKeys);
  refreshSavedKeyControls(answerKeys[0]?.id || "");
  renderAnswerKeyFields();
  setMessage(`Đã nhập ${backup.answerKeys.length} đáp án. Mã đề trùng sẽ được cập nhật.`);
}

function handleSaveAnswerKey() {
  try {
    const key = readAnswerKeyDraft();
    answerKeys = saveAnswerKey(key);
    refreshSavedKeyControls(key.id);
    setMessage(`Đã lưu đáp án mã đề ${key.examCode} trên thiết bị này.`);
  } catch (error) {
    setMessage(error.message, true);
  }
}

function handleGrade() {
  try {
    let key = answerKeys.find((item) => item.id === gradingKeySelect.value);
    if (!key) throw new Error("Hãy chọn đáp án chuẩn đã lưu.");
    const template = ANSWER_SHEET_TEMPLATES.find((item) => item.id === key.templateId);
    if (!template) throw new Error("Không tìm thấy mẫu phiếu của đáp án chuẩn.");
    const context = scanCanvas.getContext("2d", { willReadFrequently: true });
    const imageData = context.getImageData(0, 0, scanCanvas.width, scanCanvas.height);
    const qrInfo = decodeSheetQr(imageData);
    if (qrInfo && (qrInfo.templateId !== key.templateId || qrInfo.examCode !== key.examCode)) {
      const matchingKey = answerKeys.find((item) => item.templateId === qrInfo.templateId
        && item.examCode === qrInfo.examCode);
      if (!matchingKey) {
        throw new Error(`QR thuộc mẫu ${qrInfo.templateId}, mã đề ${qrInfo.examCode}; chưa có đáp án chuẩn tương ứng.`);
      }
      gradingKeySelect.value = matchingKey.id;
      key = matchingKey;
      updateEssayScoreField();
      throw new Error(`QR thuộc mã đề ${qrInfo.examCode}. Đã chọn đáp án tương ứng; nhấn chấm lại để xác nhận.`);
    }

    const detection = scanAnswerImage(imageData, template);
    if (detection.examCode && detection.examCode !== key.examCode) {
      throw new Error(`Phiếu đã tô mã đề ${detection.examCode}, nhưng đáp án đang chọn là ${key.examCode}.`);
    }
    const result = gradeAnswers(detection, key, document.querySelector("#essay-score").value);
    result.candidateNumber = document.querySelector("#candidate-id").value.trim()
      || result.candidateNumber
      || qrInfo?.sheetId
      || "";
    result.templateName = template.name;
    result.scanFileName = scanFileName;
    latestResult = saveGradingResult(result);
    gradingResult.replaceChildren(createResultElement(latestResult, detection, key, qrInfo));
    gradingResult.classList.remove("error");
    downloadResultsButton.hidden = false;
    refreshGradingHistory();
  } catch (error) {
    setMessage(error.message, true);
  }
}

function initializeGrading() {
  for (const template of ANSWER_SHEET_TEMPLATES) {
    const option = document.createElement("option");
    option.value = template.id;
    option.textContent = template.selectionTitle;
    keyTemplateSelect.append(option);
  }
  try {
    answerKeys = loadAnswerKeys();
    refreshSavedKeyControls("");
    refreshGradingHistory();
  } catch (error) {
    setMessage(error.message, true);
  }
  renderAnswerKeyFields();
}

keyTemplateSelect.addEventListener("change", () => {
  draftTemplate = ANSWER_SHEET_TEMPLATES.find((template) => template.id === keyTemplateSelect.value);
  if (draftTemplate) renderAnswerKeyFields();
});
document.querySelector("#save-answer-key").addEventListener("click", handleSaveAnswerKey);
gradingKeySelect.addEventListener("change", () => {
  gradeButton.disabled = !gradingKeySelect.value || scanCanvas.width <= 300;
  updateEssayScoreField();
});
scanFileInput.addEventListener("change", async () => {
  try {
    await prepareScanImage(scanFileInput.files?.[0]);
  } catch (error) {
    setMessage(error.message, true);
  }
});
document.querySelector("#start-camera").addEventListener("click", async () => {
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("Trình duyệt này không hỗ trợ camera.");
    liveCameraStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: "environment" } },
    });
    cameraVideo.srcObject = liveCameraStream;
    cameraVideo.hidden = false;
    await cameraVideo.play();
    document.querySelector("#capture-photo").disabled = false;
    document.querySelector("#stop-camera").disabled = false;
    document.querySelector("#start-camera").disabled = true;
    setMessage("Đặt trọn phiếu trong khung hình, giữ máy thẳng và đủ sáng.");
  } catch (error) {
    stopCamera();
    setMessage(`Không mở được camera: ${error.message}`, true);
  }
});
document.querySelector("#stop-camera").addEventListener("click", stopCamera);
document.querySelector("#capture-photo").addEventListener("click", () => {
  try {
    if (!cameraVideo.videoWidth) throw new Error("Camera chưa sẵn sàng.");
    const scale = Math.min(1, 1600 / cameraVideo.videoWidth, 2200 / cameraVideo.videoHeight);
    scanCanvas.width = Math.round(cameraVideo.videoWidth * scale);
    scanCanvas.height = Math.round(cameraVideo.videoHeight * scale);
    scanCanvas.getContext("2d", { willReadFrequently: true })
      .drawImage(cameraVideo, 0, 0, scanCanvas.width, scanCanvas.height);
    document.querySelector("#scan-preview").src = scanCanvas.toDataURL("image/jpeg", 0.9);
    document.querySelector("#scan-preview-wrap").hidden = false;
    scanFileName = "anh-chup-camera.jpg";
    gradeButton.disabled = !gradingKeySelect.value;
    latestResult = undefined;
    downloadResultsButton.hidden = true;
    stopCamera();
    setMessage("Đã chụp phiếu. Nhấn “Quét và chấm bài” để tiếp tục.");
  } catch (error) {
    setMessage(error.message, true);
  }
});
gradeButton.addEventListener("click", handleGrade);
downloadResultsButton.addEventListener("click", downloadLatestResultCsv);
downloadHistoryButton.addEventListener("click", () => {
  try {
    downloadResultsCsv(refreshGradingHistory(), "lich-su-cham.csv");
  } catch (error) {
    setMessage(error.message, true);
  }
});
exportAnswerKeysButton.addEventListener("click", exportSavedAnswerKeys);
importAnswerKeysInput.addEventListener("change", async () => {
  try {
    await importSavedAnswerKeys(importAnswerKeysInput.files?.[0]);
  } catch (error) {
    setMessage(`Không thể nhập tệp sao lưu: ${error.message}`, true);
  } finally {
    importAnswerKeysInput.value = "";
  }
});
window.addEventListener("beforeunload", stopCamera);

initializeGrading();
