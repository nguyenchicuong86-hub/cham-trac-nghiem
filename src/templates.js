export const ANSWER_SHEET_TEMPLATE = Object.freeze({
  id: "omr-mixed-a4-v1",
  version: 1,
  name: "Phiếu trắc nghiệm hỗn hợp A4",
  selectionTitle: "40 trắc nghiệm + đúng/sai",
  selectionDescription: "A4 · 40 câu A–D và 20 ý đúng/sai",
  summaryRows: Object.freeze([
    Object.freeze({ label: "Trắc nghiệm", value: "40 câu · A–D" }),
    Object.freeze({ label: "Đúng / Sai", value: "5 câu · 4 ý/câu" }),
    Object.freeze({ label: "Mã nhận diện", value: "QR phiếu" }),
  ]),
  note: "QR chỉ chứa mã phiếu và mã đề, không chứa đáp án.",
  page: Object.freeze({ width: 210, height: 297 }),
  answerArea: Object.freeze({ x: 10, y: 62, width: 190, height: 220 }),
  anchorSize: 6,
  anchors: Object.freeze([
    Object.freeze({ x: 10, y: 62 }),
    Object.freeze({ x: 194, y: 62 }),
    Object.freeze({ x: 10, y: 276 }),
    Object.freeze({ x: 194, y: 276 }),
  ]),
  header: Object.freeze({
    school: Object.freeze({ x: 15, y: 17, maxWidth: 150 }),
    examTitle: Object.freeze({ x: 15, y: 27, maxWidth: 153 }),
    subject: Object.freeze({ x: 15, y: 39, maxWidth: 72 }),
    className: Object.freeze({ x: 99, y: 39, maxWidth: 56 }),
    candidateName: Object.freeze({ labelX: 15, lineX: 38, lineEndX: 108, y: 51 }),
    examCode: Object.freeze({ labelX: 119, lineX: 137, lineEndX: 169, y: 51 }),
  }),
  headerDivider: Object.freeze({ x1: 15, y: 57, x2: 195 }),
  qr: Object.freeze({ x: 178, y: 14, size: 20, labelX: 178, labelY: 38, idY: 41 }),
  multipleChoice: Object.freeze({
    count: 40,
    columns: 2,
    rowsPerColumn: 20,
    columnX: Object.freeze([18, 75]),
    labelOffsetX: 0,
    optionOffsets: Object.freeze([27, 35, 43, 51]),
    options: Object.freeze(["A", "B", "C", "D"]),
    firstRowY: 87,
    rowPitch: 8.25,
    rowLabelOffsetY: 1,
    bubbleCenterOffsetY: 4.6,
    bubbleLabelOffsetY: -3.6,
    bubbleRadius: 2.15,
    titleX: 18,
    titleY: 76,
  }),
  trueFalse: Object.freeze({
    questionCount: 5,
    statementsPerQuestion: 4,
    labelX: 134,
    trueX: 166,
    falseX: 184,
    firstRowY: 89,
    questionPitch: 33,
    statementPitch: 6.4,
    rowLabelOffsetY: 1,
    bubbleCenterOffsetY: 4.6,
    bubbleLabelOffsetY: -3.6,
    bubbleRadius: 2.15,
    titleX: 134,
    titleY: 76,
  }),
  footer: Object.freeze({ x: 105, y: 266 }),
});

export const ESSAY_30_TEMPLATE = Object.freeze({
  id: "omr-30-essay-a4-v1",
  version: 1,
  kind: "essay30",
  name: "Phiếu 30 câu kèm tự luận A4",
  selectionTitle: "30 câu trắc nghiệm + tự luận",
  selectionDescription: "Mẫu phiếu 120 · Khổ A4",
  summaryRows: Object.freeze([
    Object.freeze({ label: "Trắc nghiệm", value: "30 câu · A–D" }),
    Object.freeze({ label: "Tự luận", value: "35 dòng trả lời" }),
    Object.freeze({ label: "Nhận diện", value: "Số báo danh + mã đề" }),
  ]),
  note: "Thí sinh tự điền số báo danh và tô mã đề trên phiếu; mẫu này không có QR.",
  page: Object.freeze({ width: 210, height: 297 }),
  answerArea: Object.freeze({ x: 17, y: 174, width: 179, height: 115 }),
  anchorSize: 5,
  anchors: Object.freeze([
    Object.freeze({ x: 14, y: 43 }),
    Object.freeze({ x: 194, y: 43 }),
    Object.freeze({ x: 14, y: 287 }),
    Object.freeze({ x: 194, y: 287 }),
  ]),
  alignmentMarks: Object.freeze([
    Object.freeze({ x: 64, y: 120, size: 2.5 }),
    Object.freeze({ x: 64, y: 162, size: 2.5 }),
    Object.freeze({ x: 64, y: 204, size: 2.5 }),
    Object.freeze({ x: 64, y: 246, size: 2.5 }),
    Object.freeze({ x: 64, y: 284, size: 2.5 }),
  ]),
  header: Object.freeze({
    school: Object.freeze({ x: 20, y: 20, maxWidth: 165 }),
    examTitle: Object.freeze({ x: 105, y: 28, maxWidth: 165 }),
    subject: Object.freeze({ x: 105, y: 35, maxWidth: 155 }),
    date: Object.freeze({ x: 105, y: 41 }),
    instruction: Object.freeze({ x: 20, y: 12 }),
    sheetInfo: Object.freeze({ x: 154, y: 12 }),
    topRows: Object.freeze([
      Object.freeze({ label: "1. Sở Giáo dục và Đào tạo:", y: 48, lineX: 61, lineEndX: 140 }),
      Object.freeze({ label: "2. Hội đồng coi thi:", y: 56, lineX: 52, lineEndX: 140 }),
      Object.freeze({ label: "3. Phòng thi số:", y: 64, lineX: 46, lineEndX: 140 }),
    ]),
    supervisorOne: Object.freeze({ x: 20, y: 72, width: 42, height: 22 }),
    notice: Object.freeze({ x: 65, y: 72, width: 76, height: 22 }),
    supervisorTwo: Object.freeze({ x: 20, y: 96, width: 42, height: 24 }),
    candidateDetails: Object.freeze({ x: 65, y: 96, width: 76, height: 24 }),
    detailsFirstY: 100,
    detailsPitch: 5.8,
  }),
  studentNumberGrid: Object.freeze({
    label: "8. Số báo danh",
    labelX: 162,
    rowLabelX: 147,
    labelY: 49,
    firstX: 151,
    digitCount: 8,
    columnPitch: 3,
    firstRowY: 56,
    rowPitch: 5,
    rowCount: 10,
    bubbleRadius: 1.15,
  }),
  examCodeGrid: Object.freeze({
    label: "9. Mã đề thi",
    labelX: 185,
    rowLabelX: 177,
    labelY: 49,
    firstX: 181,
    digitCount: 3,
    columnPitch: 3.7,
    firstRowY: 56,
    rowPitch: 5,
    rowCount: 10,
    bubbleRadius: 1.15,
  }),
  multipleChoice: Object.freeze({
    count: 30,
    columns: 1,
    rowsPerColumn: 30,
    columnX: Object.freeze([20]),
    labelOffsetX: 2,
    optionOffsets: Object.freeze([17, 24, 31, 38]),
    options: Object.freeze(["A", "B", "C", "D"]),
    headerY: 124,
    firstRowY: 130,
    rowPitch: 5.1,
    rowLabelOffsetY: 0.6,
    bubbleCenterOffsetY: 0,
    bubbleLabelOffsetY: 0,
    bubbleRadius: 1.55,
    titleX: 42,
    titleY: 121,
    frame: Object.freeze({ x: 20, y: 120, width: 44, height: 167 }),
  }),
  essay: Object.freeze({
    x: 68,
    y: 120,
    width: 126,
    height: 167,
    titleY: 125,
    firstLineY: 133,
    lineCount: 36,
    linePitch: 4.1,
    lineStartX: 71,
    lineEndX: 191,
  }),
  footer: Object.freeze({ x: 105, y: 293 }),
});

export const MIXED_24_ESSAY_TEMPLATE = Object.freeze({
  id: "omr-24-mixed-essay-a4-v1",
  version: 1,
  kind: "mixedEssay",
  name: "Phiếu 24 câu, đúng/sai và tự luận A4",
  selectionTitle: "24 trắc nghiệm + 3 đúng/sai + tự luận",
  selectionDescription: "A4 · Có QR · Phần dưới dành cho tự luận",
  summaryRows: Object.freeze([
    Object.freeze({ label: "Trắc nghiệm", value: "24 câu · A–D" }),
    Object.freeze({ label: "Đúng / Sai", value: "3 câu · 4 ý/câu" }),
    Object.freeze({ label: "Tự luận", value: "30 dòng trả lời" }),
    Object.freeze({ label: "Mã nhận diện", value: "QR phiếu" }),
  ]),
  note: "QR chỉ chứa mã phiếu và mã đề, không chứa đáp án.",
  page: ANSWER_SHEET_TEMPLATE.page,
  answerArea: Object.freeze({ x: 10, y: 62, width: 190, height: 220 }),
  anchorSize: 6,
  anchors: ANSWER_SHEET_TEMPLATE.anchors,
  header: ANSWER_SHEET_TEMPLATE.header,
  headerDivider: ANSWER_SHEET_TEMPLATE.headerDivider,
  qr: ANSWER_SHEET_TEMPLATE.qr,
  multipleChoice: Object.freeze({
    count: 24,
    columns: 2,
    rowsPerColumn: 12,
    columnX: Object.freeze([18, 75]),
    labelOffsetX: 0,
    optionOffsets: Object.freeze([27, 35, 43, 51]),
    options: Object.freeze(["A", "B", "C", "D"]),
    showOptionLabelsOnRows: false,
    optionHeaderY: 82,
    firstRowY: 85,
    rowPitch: 7,
    rowLabelOffsetY: 1,
    bubbleCenterOffsetY: 4.6,
    bubbleLabelOffsetY: -3.6,
    bubbleRadius: 2.15,
    titleX: 18,
    titleY: 76,
  }),
  trueFalse: Object.freeze({
    questionCount: 3,
    statementsPerQuestion: 4,
    labelX: 134,
    trueX: 166,
    falseX: 184,
    firstRowY: 85,
    questionPitch: 30,
    statementPitch: 7,
    rowLabelOffsetY: 1,
    bubbleCenterOffsetY: 4.6,
    bubbleLabelOffsetY: -3.6,
    bubbleRadius: 2.15,
    titleX: 134,
    titleY: 76,
  }),
  essay: Object.freeze({
    x: 18,
    y: 179,
    width: 176,
    height: 103,
    titleY: 184,
    firstLineY: 190,
    lineCount: 30,
    linePitch: 3,
    lineStartX: 21,
    lineEndX: 191,
  }),
  footer: Object.freeze({ x: 105, y: 293 }),
});

export const ANSWER_SHEET_TEMPLATES = Object.freeze([
  ANSWER_SHEET_TEMPLATE,
  ESSAY_30_TEMPLATE,
  MIXED_24_ESSAY_TEMPLATE,
]);

export function getMultipleChoiceRows(template = ANSWER_SHEET_TEMPLATE) {
  const section = template.multipleChoice;
  return Array.from({ length: section.count }, (_, index) => {
    const column = Math.floor(index / section.rowsPerColumn);
    const row = index % section.rowsPerColumn;
    const x = section.columnX[column];
    const y = section.firstRowY + row * section.rowPitch;

    return {
      number: index + 1,
      labelX: x + (section.labelOffsetX || 0),
      y,
      options: section.optionOffsets.map((offset, optionIndex) => ({
        label: section.options[optionIndex],
        x: x + offset,
        y: y + section.bubbleCenterOffsetY,
      })),
    };
  });
}

export function getDigitGridRows(grid) {
  return Array.from({ length: grid.rowCount }, (_, digit) => ({
    digit,
    y: grid.firstRowY + digit * grid.rowPitch,
    bubbles: Array.from({ length: grid.digitCount }, (_, column) => ({
      x: grid.firstX + column * grid.columnPitch,
      y: grid.firstRowY + digit * grid.rowPitch,
    })),
  }));
}

export function getEssayLines(template = ESSAY_30_TEMPLATE) {
  return Array.from({ length: template.essay.lineCount }, (_, index) =>
    template.essay.firstLineY + index * template.essay.linePitch);
}

export function getTrueFalseRows(template = ANSWER_SHEET_TEMPLATE) {
  const section = template.trueFalse;
  return Array.from({ length: section.questionCount * section.statementsPerQuestion }, (_, index) => {
    const question = Math.floor(index / section.statementsPerQuestion);
    const statement = index % section.statementsPerQuestion;
    const y = section.firstRowY + question * section.questionPitch + statement * section.statementPitch;

    return {
      question: question + 1,
      statement: String.fromCharCode(97 + statement),
      labelX: section.labelX,
      y,
      choices: [
        { label: "Đ", x: section.trueX, y: y + section.bubbleCenterOffsetY },
        { label: "S", x: section.falseX, y: y + section.bubbleCenterOffsetY },
      ],
    };
  });
}
