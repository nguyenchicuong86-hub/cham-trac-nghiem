import {
  ANSWER_SHEET_TEMPLATES,
  getDigitGridRows,
  getMultipleChoiceRows,
  getTrueFalseRows,
} from "./templates.js";

export const ANSWER_KEYS_STORAGE_KEY = "omr.answer-keys.v1";
export const GRADING_RESULTS_STORAGE_KEY = "omr.grading-results.v1";

export function createEmptyAnswerKey(template, examCode) {
  return {
    id: `${template.id}:${String(examCode).trim()}`,
    templateId: template.id,
    examCode: String(examCode).trim(),
    multipleChoice: Array.from({ length: template.multipleChoice.count }, () => ""),
    trueFalse: Array.from(
      { length: (template.trueFalse?.questionCount || 0) * (template.trueFalse?.statementsPerQuestion || 0) },
      () => "",
    ),
    points: {
      multipleChoice: 1,
      trueFalse: 1,
      essay: 0,
    },
    updatedAt: new Date().toISOString(),
  };
}
export function isValidAnswerKey(key) {
  const template = ANSWER_SHEET_TEMPLATES.find((item) => item.id === key?.templateId);
  const trueFalseCount = (template?.trueFalse?.questionCount || 0)
    * (template?.trueFalse?.statementsPerQuestion || 0);
  return Boolean(template)
    && typeof key.id === "string"
    && typeof key.examCode === "string"
    && key.examCode.trim().length > 0
    && key.id === `${template.id}:${key.examCode.trim()}`
    && Array.isArray(key.multipleChoice)
    && key.multipleChoice.length === template.multipleChoice.count
    && key.multipleChoice.every((answer) => template.multipleChoice.options.includes(answer))
    && Array.isArray(key.trueFalse)
    && key.trueFalse.length === trueFalseCount
    && key.trueFalse.every((answer) => answer === "Đ" || answer === "S")
    && key.points
    && Number.isFinite(key.points.multipleChoice) && key.points.multipleChoice >= 0
    && Number.isFinite(key.points.trueFalse) && key.points.trueFalse >= 0
    && Number.isFinite(key.points.essay) && key.points.essay >= 0;
}

export function loadAnswerKeys(storage = window.localStorage) {
  const raw = storage.getItem(ANSWER_KEYS_STORAGE_KEY);
  if (!raw) return [];
  let keys;
  try {
    keys = JSON.parse(raw);
  } catch {
    throw new Error("Danh sách đáp án lưu trên thiết bị bị lỗi. Hãy xóa dữ liệu đáp án hỏng rồi nhập lại.");
  }
  if (!Array.isArray(keys) || !keys.every(isValidAnswerKey)) {
    throw new Error("Danh sách đáp án lưu trên thiết bị không đúng định dạng.");
  }
  return keys;
}

export function saveAnswerKeys(importedKeys, storage = window.localStorage) {
  if (!Array.isArray(importedKeys) || !importedKeys.every(isValidAnswerKey)) {
    throw new Error("Không thể nhập đáp án: tệp sao lưu không hợp lệ hoặc không tương thích.");
  }
  const keys = loadAnswerKeys(storage);
  for (const key of importedKeys) {
    const existingIndex = keys.findIndex((item) => item.id === key.id);
    const updatedKey = { ...key, updatedAt: new Date().toISOString() };
    if (existingIndex < 0) keys.push(updatedKey);
    else keys[existingIndex] = updatedKey;
  }
  storage.setItem(ANSWER_KEYS_STORAGE_KEY, JSON.stringify(keys));
  return keys;
}

export function saveAnswerKey(key, storage = window.localStorage) {
  if (!isValidAnswerKey(key)) {
    throw new Error("Không thể lưu đáp án: dữ liệu đáp án không hợp lệ.");
  }
  return saveAnswerKeys([key], storage);
}

export function saveGradingResult(result, storage = window.localStorage) {
  const raw = storage.getItem(GRADING_RESULTS_STORAGE_KEY);
  let results = [];
  if (raw) {
    try {
      results = JSON.parse(raw);
    } catch {
      throw new Error("Lịch sử chấm lưu trên thiết bị bị lỗi.");
    }
    if (!Array.isArray(results)) throw new Error("Lịch sử chấm lưu trên thiết bị không đúng định dạng.");
  }
  const entry = { ...result, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  results.unshift(entry);
  storage.setItem(GRADING_RESULTS_STORAGE_KEY, JSON.stringify(results.slice(0, 100)));
  return entry;
}

export function loadGradingResults(storage = window.localStorage) {
  const raw = storage.getItem(GRADING_RESULTS_STORAGE_KEY);
  if (!raw) return [];
  let results;
  try {
    results = JSON.parse(raw);
  } catch {
    throw new Error("Lịch sử chấm lưu trên thiết bị bị lỗi.");
  }
  if (!Array.isArray(results)) throw new Error("Lịch sử chấm lưu trên thiết bị không đúng định dạng.");
  return results;
}

export function solveHomography(source, destination) {
  if (source.length !== 4 || destination.length !== 4) {
    throw new Error("Cần đúng bốn điểm để căn chỉnh phiếu.");
  }
  const matrix = [];
  for (let index = 0; index < 4; index += 1) {
    const { x, y } = source[index];
    const { x: u, y: v } = destination[index];
    matrix.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u]);
    matrix.push([0, 0, 0, x, y, 1, -v * x, -v * y, v]);
  }

  for (let column = 0; column < 8; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < 8; row += 1) {
      if (Math.abs(matrix[row][column]) > Math.abs(matrix[pivot][column])) pivot = row;
    }
    if (Math.abs(matrix[pivot][column]) < 1e-10) throw new Error("Không thể căn chỉnh các dấu định vị.");
    [matrix[column], matrix[pivot]] = [matrix[pivot], matrix[column]];
    const divisor = matrix[column][column];
    for (let entry = column; entry <= 8; entry += 1) matrix[column][entry] /= divisor;
    for (let row = 0; row < 8; row += 1) {
      if (row === column) continue;
      const factor = matrix[row][column];
      for (let entry = column; entry <= 8; entry += 1) {
        matrix[row][entry] -= factor * matrix[column][entry];
      }
    }
  }
  return matrix.map((row) => row[8]);
}

export function transformPoint(homography, point) {
  const denominator = homography[6] * point.x + homography[7] * point.y + 1;
  if (Math.abs(denominator) < 1e-10) throw new Error("Điểm ảnh nằm ngoài vùng căn chỉnh.");
  return {
    x: (homography[0] * point.x + homography[1] * point.y + homography[2]) / denominator,
    y: (homography[3] * point.x + homography[4] * point.y + homography[5]) / denominator,
  };
}

function otsuThreshold(data) {
  const histogram = new Uint32Array(256);
  const stride = 4;
  const pixelCount = data.length / stride;
  const sampleStep = Math.max(1, Math.floor(pixelCount / 150000));
  for (let index = 0; index < pixelCount; index += sampleStep) {
    const offset = index * stride;
    const gray = Math.round(0.299 * data[offset] + 0.587 * data[offset + 1] + 0.114 * data[offset + 2]);
    histogram[gray] += 1;
  }
  const sampledCount = histogram.reduce((sum, count) => sum + count, 0);
  let sum = 0;
  for (let value = 0; value < 256; value += 1) sum += value * histogram[value];
  let backgroundWeight = 0;
  let backgroundSum = 0;
  let bestVariance = -1;
  let threshold = 150;
  for (let value = 0; value < 256; value += 1) {
    backgroundWeight += histogram[value];
    if (!backgroundWeight) continue;
    const foregroundWeight = sampledCount - backgroundWeight;
    if (!foregroundWeight) break;
    backgroundSum += value * histogram[value];
    const backgroundMean = backgroundSum / backgroundWeight;
    const foregroundMean = (sum - backgroundSum) / foregroundWeight;
    const variance = backgroundWeight * foregroundWeight * (backgroundMean - foregroundMean) ** 2;
    if (variance > bestVariance) {
      bestVariance = variance;
      threshold = value;
    }
  }
  return Math.max(70, Math.min(210, threshold));
}

export function findAnchorCenters(imageData, template) {
  const { data, width, height } = imageData;
  const pixelCount = width * height;
  if (data.length !== pixelCount * 4) throw new Error("Ảnh phiếu không hợp lệ.");
  const threshold = otsuThreshold(data);
  const visited = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  const candidates = [];
  const minimumArea = Math.max(36, Math.floor(pixelCount * 0.00012));
  const maxWidth = Math.floor(width * 0.065);
  const maxHeight = Math.floor(height * 0.065);

  for (let start = 0; start < pixelCount; start += 1) {
    const startOffset = start * 4;
    const startGray = 0.299 * data[startOffset] + 0.587 * data[startOffset + 1] + 0.114 * data[startOffset + 2];
    if (visited[start] || startGray >= threshold) continue;
    visited[start] = 1;
    let head = 0;
    let tail = 1;
    queue[0] = start;
    let area = 0;
    let sumX = 0;
    let sumY = 0;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    while (head < tail) {
      const pixel = queue[head];
      head += 1;
      const x = pixel % width;
      const y = Math.floor(pixel / width);
      area += 1;
      sumX += x;
      sumY += y;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      for (let dy = -1; dy <= 1; dy += 1) {
        const neighborY = y + dy;
        if (neighborY < 0 || neighborY >= height) continue;
        for (let dx = -1; dx <= 1; dx += 1) {
          if (!dx && !dy) continue;
          const neighborX = x + dx;
          if (neighborX < 0 || neighborX >= width) continue;
          const neighbor = neighborY * width + neighborX;
          if (visited[neighbor]) continue;
          const offset = neighbor * 4;
          const gray = 0.299 * data[offset] + 0.587 * data[offset + 1] + 0.114 * data[offset + 2];
          if (gray < threshold) {
            visited[neighbor] = 1;
            queue[tail] = neighbor;
            tail += 1;
          }
        }
      }
    }

    const boxWidth = maxX - minX + 1;
    const boxHeight = maxY - minY + 1;
    const density = area / (boxWidth * boxHeight);
    const aspectRatio = boxWidth / boxHeight;
    if (area >= minimumArea && boxWidth <= maxWidth && boxHeight <= maxHeight
      && density >= 0.55 && aspectRatio >= 0.58 && aspectRatio <= 1.72) {
      candidates.push({ x: sumX / area, y: sumY / area, area });
    }
  }

  if (candidates.length < 4) {
    throw new Error("Không tìm thấy đủ bốn dấu định vị. Hãy chụp trọn phiếu, đặt phiếu thẳng và đủ sáng.");
  }
  const strongest = [...candidates].sort((a, b) => b.area - a.area).slice(0, 4);
  const upper = [...strongest].sort((a, b) => a.y - b.y).slice(0, 2).sort((a, b) => a.x - b.x);
  const lower = [...strongest].sort((a, b) => b.y - a.y).slice(0, 2).sort((a, b) => a.x - b.x);
  const anchors = [upper[0], upper[1], lower[0], lower[1]];
  if (anchors[1].x <= anchors[0].x || anchors[3].x <= anchors[2].x
    || anchors[2].y <= anchors[0].y || anchors[3].y <= anchors[1].y) {
    throw new Error("Phiếu bị xoay hoặc dấu định vị không rõ. Hãy xoay phiếu đúng chiều rồi chụp lại.");
  }
  if (template.anchors.length !== 4) throw new Error("Mẫu phiếu này chưa cấu hình đủ dấu định vị.");
  return anchors;
}

export function readBubble(imageData, homography, bubble, bubbleRadius) {
  const center = transformPoint(homography, bubble);
  const xUnit = transformPoint(homography, { x: bubble.x + 1, y: bubble.y });
  const yUnit = transformPoint(homography, { x: bubble.x, y: bubble.y + 1 });
  const pixelsPerMm = (Math.hypot(xUnit.x - center.x, xUnit.y - center.y)
    + Math.hypot(yUnit.x - center.x, yUnit.y - center.y)) / 2;
  const radius = Math.max(1, pixelsPerMm * Math.min(0.95, bubbleRadius * 0.48));
  let dark = 0;
  let total = 0;
  const sampleSpacing = Math.max(1, Math.floor(pixelsPerMm / 2.5));
  for (let dy = -radius; dy <= radius; dy += sampleSpacing) {
    for (let dx = -radius; dx <= radius; dx += sampleSpacing) {
      if (dx * dx + dy * dy > radius * radius) continue;
      const x = Math.round(center.x + dx);
      const y = Math.round(center.y + dy);
      if (x < 0 || y < 0 || x >= imageData.width || y >= imageData.height) continue;
      const offset = (y * imageData.width + x) * 4;
      const gray = 0.299 * imageData.data[offset] + 0.587 * imageData.data[offset + 1] + 0.114 * imageData.data[offset + 2];
      if (gray < 135) dark += 1;
      total += 1;
    }
  }
  return total ? dark / total : 0;
}

function chooseResponse(choices, imageData, homography, radius) {
  const scores = choices.map((choice) => ({
    label: choice.label,
    fill: readBubble(imageData, homography, choice, radius),
  })).sort((a, b) => b.fill - a.fill);
  if (!scores.length || scores[0].fill < 0.18) {
    return { answer: "", confidence: scores[0]?.fill || 0, issue: "blank" };
  }
  if (scores[1] && scores[1].fill >= 0.18) {
    return { answer: "", confidence: scores[0].fill - scores[1].fill, issue: "multiple" };
  }
  return { answer: scores[0].label, confidence: scores[0].fill, issue: "" };
}

function readDigitGrid(imageData, homography, grid) {
  const rows = getDigitGridRows(grid);
  const values = [];
  let uncertain = false;
  for (let column = 0; column < grid.digitCount; column += 1) {
    const ranked = rows.map((row) => ({
      digit: row.digit,
      fill: readBubble(imageData, homography, { x: grid.firstX + column * grid.columnPitch, y: row.y }, grid.bubbleRadius),
    })).sort((a, b) => b.fill - a.fill);
    if (!ranked.length || ranked[0].fill < 0.18 || (ranked[1] && ranked[1].fill >= 0.18)) {
      values.push("");
      uncertain = true;
    } else {
      values.push(String(ranked[0].digit));
    }
  }
  return { value: values.join(""), uncertain };
}

export function scanAnswerImage(imageData, template) {
  if (!template.multipleChoice || template.anchors?.length !== 4) {
    throw new Error("Mẫu này chưa hỗ trợ chấm bằng ảnh.");
  }
  const imageAnchors = findAnchorCenters(imageData, template);
  const sourceAnchors = template.anchors.map((anchor) => ({
    x: anchor.x + template.anchorSize / 2,
    y: anchor.y + template.anchorSize / 2,
  }));
  const homography = solveHomography(sourceAnchors, imageAnchors);
  const multipleChoice = getMultipleChoiceRows(template).map((row) => chooseResponse(
    row.options,
    imageData,
    homography,
    template.multipleChoice.bubbleRadius,
  ));
  const trueFalse = (template.trueFalse ? getTrueFalseRows(template) : []).flatMap((row) => row.choices.map((choice) => {
    const opposite = row.choices.find((candidate) => candidate !== choice);
    return { ...choice, opposite };
  })).filter((choice, index, list) => index % 2 === 0)
    .map((pair) => chooseResponse(
      [pair, pair.opposite].map(({ label, x, y }) => ({ label, x, y })),
      imageData,
      homography,
      template.trueFalse.bubbleRadius,
    ));

  let candidateNumber = "";
  let examCode = "";
  let uncertainIdentity = false;
  if (template.studentNumberGrid && template.examCodeGrid) {
    const student = readDigitGrid(imageData, homography, template.studentNumberGrid);
    const code = readDigitGrid(imageData, homography, template.examCodeGrid);
    candidateNumber = student.value;
    examCode = code.value;
    uncertainIdentity = student.uncertain || code.uncertain;
  }
  return {
    templateId: template.id,
    multipleChoice,
    trueFalse,
    candidateNumber,
    examCode,
    uncertainIdentity,
    anchors: imageAnchors,
  };
}

export function gradeAnswers(detection, answerKey, essayPoints = 0) {
  if (detection.templateId !== answerKey.templateId) {
    throw new Error("Mẫu phiếu quét không trùng với mẫu đáp án chuẩn.");
  }
  const mcCorrect = detection.multipleChoice.reduce((count, item, index) =>
    count + (item.answer && item.answer === answerKey.multipleChoice[index] ? 1 : 0), 0);
  const tfCorrect = detection.trueFalse.reduce((count, item, index) =>
    count + (item.answer && item.answer === answerKey.trueFalse[index] ? 1 : 0), 0);
  const blankCount = [...detection.multipleChoice, ...detection.trueFalse]
    .filter((item) => item.issue === "blank").length;
  const multipleMarkCount = [...detection.multipleChoice, ...detection.trueFalse]
    .filter((item) => item.issue === "multiple").length;
  const essay = Math.min(Math.max(0, Number(essayPoints) || 0), answerKey.points.essay);
  const objectiveScore = mcCorrect * answerKey.points.multipleChoice + tfCorrect * answerKey.points.trueFalse;
  const maximumScore = answerKey.multipleChoice.length * answerKey.points.multipleChoice
    + answerKey.trueFalse.length * answerKey.points.trueFalse
    + answerKey.points.essay;
  return {
    mcCorrect,
    mcTotal: answerKey.multipleChoice.length,
    tfCorrect,
    tfTotal: answerKey.trueFalse.length,
    blankCount,
    multipleMarkCount,
    objectiveScore,
    essayScore: essay,
    score: objectiveScore + essay,
    maximumScore,
    candidateNumber: detection.candidateNumber || "",
    examCode: answerKey.examCode,
    templateId: answerKey.templateId,
    answerKeyId: answerKey.id,
  };
}
