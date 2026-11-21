import {
  ANSWER_SHEET_TEMPLATE,
  getDigitGridRows,
  getEssayLines,
  getMultipleChoiceRows,
  getTrueFalseRows,
} from "./templates.js";

const PDF_FONT_URL = "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosans/NotoSans%5Bwdth,wght%5D.ttf";
let pdfFontPromise;

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function makeQr(payload) {
  if (typeof window.qrcode !== "function") {
    throw new Error("Không tải được thư viện QR. Hãy kiểm tra kết nối mạng rồi thử lại.");
  }
  const qr = window.qrcode(0, "M");
  qr.addData(payload);
  qr.make();
  return qr;
}

function qrSvgMarkup(qr, x, y, size) {
  const count = qr.getModuleCount();
  const units = count + 8;
  const moduleSize = size / units;
  const modules = [];
  for (let row = 0; row < count; row += 1) {
    for (let column = 0; column < count; column += 1) {
      if (qr.isDark(row, column)) {
        modules.push(`<rect x="${x + (column + 4) * moduleSize}" y="${y + (row + 4) * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="#111"/>`);
      }
    }
  }
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="#fff"/>${modules.join("")}`;
}

function svgText(x, y, text, size, weight = 400, anchor = "start") {
  return `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" fill="#111">${escapeXml(text)}</text>`;
}

function renderMixedHeaderSvgParts(template, metadata, qr) {
  return [
    `<rect x="0" y="0" width="${template.page.width}" height="${template.page.height}" fill="#fff"/>`,
    svgText(template.header.school.x, template.header.school.y, metadata.schoolName, 3, 700),
    svgText(template.header.examTitle.x, template.header.examTitle.y, metadata.examTitle, 4, 700),
    svgText(template.header.subject.x, template.header.subject.y, `Môn thi: ${metadata.subject || "................"}`, 2.8, 400),
    svgText(template.header.className.x, template.header.className.y, "Lớp: __________________", 2.8, 400),
    svgText(template.header.candidateName.labelX, template.header.candidateName.y, "Họ và tên:", 2.8, 400),
    svgText(template.header.examCode.labelX, template.header.examCode.y, "Mã đề:", 2.8, 400),
    `<line x1="${template.header.candidateName.lineX}" y1="${template.header.candidateName.y + 0.6}" x2="${template.header.candidateName.lineEndX}" y2="${template.header.candidateName.y + 0.6}" stroke="#111" stroke-width=".25"/>`,
    `<line x1="${template.header.examCode.lineX}" y1="${template.header.examCode.y + 0.6}" x2="${template.header.examCode.lineEndX}" y2="${template.header.examCode.y + 0.6}" stroke="#111" stroke-width=".25"/>`,
    `<line x1="${template.headerDivider.x1}" y1="${template.headerDivider.y}" x2="${template.headerDivider.x2}" y2="${template.headerDivider.y}" stroke="#111" stroke-width=".3"/>`,
    svgText(template.multipleChoice.titleX, template.multipleChoice.titleY, "I. TRẮC NGHIỆM", 3, 700),
    svgText(template.trueFalse.titleX, template.trueFalse.titleY, "II. ĐÚNG / SAI", 3, 700),
    svgText(template.qr.labelX, template.qr.labelY, "MÃ PHIẾU", 1.8, 700, "middle"),
    svgText(template.qr.labelX, template.qr.idY, metadata.sheetId, 1.5, 400, "middle"),
    svgText(headerExamCodeX(template), template.header.examCode.y, metadata.examCode, 2.8, 400),
    qrSvgMarkup(qr, template.qr.x, template.qr.y, template.qr.size),
  ];
}

function appendMixedAnswerSvg(parts, template) {
  const mc = template.multipleChoice;
  if (mc.showOptionLabelsOnRows === false) {
    for (let column = 0; column < mc.columns; column += 1) {
      mc.options.forEach((option, index) => {
        parts.push(svgText(mc.columnX[column] + mc.optionOffsets[index], mc.optionHeaderY, option, 1.85, 700, "middle"));
      });
    }
  }
  for (const row of getMultipleChoiceRows(template)) {
    parts.push(svgText(row.labelX, row.y + mc.rowLabelOffsetY, `Câu ${String(row.number).padStart(2, "0")}`, 2.35));
    for (const option of row.options) {
      if (mc.showOptionLabelsOnRows !== false) {
        parts.push(svgText(option.x, option.y + mc.bubbleLabelOffsetY, option.label, 1.85, 400, "middle"));
      }
      parts.push(`<circle cx="${option.x}" cy="${option.y}" r="${mc.bubbleRadius}" fill="#fff" stroke="#111" stroke-width=".35"/>`);
    }
  }

  const tf = template.trueFalse;
  for (const row of getTrueFalseRows(template)) {
    parts.push(svgText(row.labelX, row.y + tf.rowLabelOffsetY, `${row.question}${row.statement})`, 2.35));
    for (const choice of row.choices) {
      parts.push(svgText(choice.x, choice.y + tf.bubbleLabelOffsetY, choice.label, 1.85, 400, "middle"));
      parts.push(`<circle cx="${choice.x}" cy="${choice.y}" r="${tf.bubbleRadius}" fill="#fff" stroke="#111" stroke-width=".35"/>`);
    }
  }
}

function appendTemplateAnchorsSvg(parts, template) {
  for (const anchor of template.anchors) {
    parts.push(`<rect x="${anchor.x}" y="${anchor.y}" width="${template.anchorSize}" height="${template.anchorSize}" fill="#000"/>`);
  }
}

function renderSvg(template, metadata, qr) {
  const parts = renderMixedHeaderSvgParts(template, metadata, qr);
  appendMixedAnswerSvg(parts, template);
  appendTemplateAnchorsSvg(parts, template);
  parts.push(svgText(template.footer.x, template.footer.y, "Tô kín một ô cho mỗi câu / mỗi ý. Không tẩy xóa.", 2.1, 400, "middle"));

  return parts.join("");
}

function renderMixedEssaySvg(template, metadata, qr) {
  const parts = renderMixedHeaderSvgParts(template, metadata, qr);
  appendMixedAnswerSvg(parts, template);
  const essay = template.essay;
  addSvgRect(parts, essay);
  parts.push(svgText(essay.x + essay.width / 2, essay.titleY, "PHẦN TỰ LUẬN", 2.4, 700, "middle"));
  parts.push(`<line x1="${essay.x}" y1="${essay.firstLineY - 2}" x2="${essay.x + essay.width}" y2="${essay.firstLineY - 2}" stroke="#111" stroke-width=".2"/>`);
  for (const y of getEssayLines(template)) {
    parts.push(`<line x1="${essay.lineStartX}" y1="${y}" x2="${essay.lineEndX}" y2="${y}" stroke="#444" stroke-width=".16"/>`);
  }
  appendTemplateAnchorsSvg(parts, template);
  parts.push(svgText(template.footer.x, template.footer.y, "Tô kín ô trả lời; viết phần tự luận trong khung.", 2.1, 400, "middle"));
  return parts.join("");
}

function addSvgRect(parts, box, fill = "none", strokeWidth = 0.3) {
  parts.push(`<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="${fill}" stroke="#111" stroke-width="${strokeWidth}"/>`);
}

function renderEssaySvg(template, metadata) {
  const { header, multipleChoice: mc, essay } = template;
  const parts = [
    `<rect x="0" y="0" width="${template.page.width}" height="${template.page.height}" fill="#fff"/>`,
    svgText(header.instruction.x, header.instruction.y, "Thí sinh điền đầy đủ thông tin bằng chữ in hoa", 2.2, 400),
    svgText(header.sheetInfo.x, header.sheetInfo.y, "STT: ______  Số tờ: ____", 2.1, 400),
    svgText(header.school.x, header.school.y, metadata.schoolName, 2.6, 700),
    svgText(header.examTitle.x, header.examTitle.y, metadata.examTitle || "PHIẾU TRẢ LỜI TRẮC NGHIỆM", 3.4, 700, "middle"),
    svgText(header.subject.x, header.subject.y, `MÔN: ${metadata.subject || "........................"}`, 2.5, 700, "middle"),
    svgText(header.date.x, header.date.y, "NGÀY THI: ....../....../20......", 2.1, 400, "middle"),
    ...header.topRows.flatMap((row) => [
      svgText(20, row.y, row.label, 1.8),
      `<line x1="${row.lineX}" y1="${row.y + 0.6}" x2="${row.lineEndX}" y2="${row.y + 0.6}" stroke="#111" stroke-width=".2"/>`,
    ]),
    svgText(template.studentNumberGrid.labelX, template.studentNumberGrid.labelY, template.studentNumberGrid.label, 1.7, 700, "middle"),
    svgText(template.examCodeGrid.labelX, template.examCodeGrid.labelY, template.examCodeGrid.label, 1.7, 700, "middle"),
  ];

  addSvgRect(parts, header.supervisorOne);
  addSvgRect(parts, header.notice);
  addSvgRect(parts, header.supervisorTwo);
  addSvgRect(parts, header.candidateDetails);
  parts.push(
    svgText(header.supervisorOne.x + header.supervisorOne.width / 2, header.supervisorOne.y + 6, "Giám thị 1", 1.8, 700, "middle"),
    svgText(header.supervisorOne.x + 3, header.supervisorOne.y + 19, "Chữ ký: __________", 1.65),
    svgText(header.notice.x + 3, header.notice.y + 6, "Thí sinh lưu ý:", 1.8, 700),
    svgText(header.notice.x + 3, header.notice.y + 11, "Điền đầy đủ thông tin, tô kín", 1.7),
    svgText(header.notice.x + 3, header.notice.y + 16, "một ô trong mỗi cột; không gấp", 1.7),
    svgText(header.notice.x + 3, header.notice.y + 20, "hoặc làm bẩn phiếu.", 1.7),
    svgText(header.supervisorTwo.x + header.supervisorTwo.width / 2, header.supervisorTwo.y + 7, "Giám thị 2", 1.8, 700, "middle"),
    svgText(header.supervisorTwo.x + 3, header.supervisorTwo.y + 23, "Chữ ký: __________", 1.65),
  );

  const detailLines = [
    "4. Họ và tên: ________________  Lớp: ____",
    "5. Ngày sinh: ____ / ____ / ______",
    "6. Nơi sinh: ________________________",
    "7. Chữ ký thí sinh: __________________",
  ];
  detailLines.forEach((line, index) => {
    parts.push(svgText(header.candidateDetails.x + 2, header.detailsFirstY + index * header.detailsPitch, line, 1.65));
  });

  for (const [grid, rowLabelX] of [
    [template.studentNumberGrid, template.studentNumberGrid.rowLabelX],
    [template.examCodeGrid, template.examCodeGrid.rowLabelX],
  ]) {
    for (const row of getDigitGridRows(grid)) {
      parts.push(svgText(rowLabelX, row.y + 0.7, String(row.digit), 1.5, 400, "middle"));
      for (const bubble of row.bubbles) {
        parts.push(`<circle cx="${bubble.x}" cy="${bubble.y}" r="${grid.bubbleRadius}" fill="#fff" stroke="#111" stroke-width=".22"/>`);
      }
    }
  }

  addSvgRect(parts, mc.frame);
  parts.push(`<line x1="${mc.frame.x}" y1="${mc.headerY + 2}" x2="${mc.frame.x + mc.frame.width}" y2="${mc.headerY + 2}" stroke="#111" stroke-width=".2"/>`);
  for (const option of mc.options) {
    const optionIndex = mc.options.indexOf(option);
    const x = mc.columnX[0] + mc.optionOffsets[optionIndex];
    parts.push(svgText(x, mc.headerY, option, 1.7, 700, "middle"));
  }
  for (const row of getMultipleChoiceRows(template)) {
    parts.push(svgText(row.labelX, row.y + mc.rowLabelOffsetY, String(row.number), 1.5, 700));
    for (const option of row.options) {
      parts.push(`<circle cx="${option.x}" cy="${option.y}" r="${mc.bubbleRadius}" fill="#fff" stroke="#111" stroke-width=".22"/>`);
    }
  }

  addSvgRect(parts, essay);
  parts.push(svgText(essay.x + essay.width / 2, essay.titleY, "PHẦN TỰ LUẬN", 2.2, 700, "middle"));
  parts.push(`<line x1="${essay.x}" y1="${essay.firstLineY - 2}" x2="${essay.x + essay.width}" y2="${essay.firstLineY - 2}" stroke="#111" stroke-width=".2"/>`);
  for (const y of getEssayLines(template)) {
    parts.push(`<line x1="${essay.lineStartX}" y1="${y}" x2="${essay.lineEndX}" y2="${y}" stroke="#444" stroke-width=".16"/>`);
  }

  for (const anchor of template.anchors) {
    parts.push(`<rect x="${anchor.x}" y="${anchor.y}" width="${template.anchorSize}" height="${template.anchorSize}" fill="#000"/>`);
  }
  for (const marker of template.alignmentMarks) {
    parts.push(`<rect x="${marker.x}" y="${marker.y}" width="${marker.size}" height="${marker.size}" fill="#000"/>`);
  }
  return parts.join("");
}

export function renderAnswerSheetPreview(svg, metadata, template = ANSWER_SHEET_TEMPLATE) {
  if (template.kind === "essay30") {
    svg.innerHTML = renderEssaySvg(template, metadata);
    return;
  }
  const qr = makeQr(`OMR|${template.id}|${metadata.examCode}|${metadata.sheetId}`);
  svg.innerHTML = template.kind === "mixedEssay"
    ? renderMixedEssaySvg(template, metadata, qr)
    : renderSvg(template, metadata, qr);
}

function addPdfText(pdf, text, x, y, size, options = {}) {
  pdf.setFont("NotoSans", options.bold ? "bold" : "normal");
  pdf.setFontSize(size);
  pdf.text(String(text), x, y, { align: options.align || "left", maxWidth: options.maxWidth });
}

function headerExamCodeX(template) {
  return template.header.examCode.lineX + 1;
}

async function loadVietnameseFont() {
  if (!pdfFontPromise) {
    pdfFontPromise = fetch(PDF_FONT_URL)
      .then((response) => {
        if (!response.ok) throw new Error("Không tải được phông chữ tiếng Việt.");
        return response.arrayBuffer();
      })
      .then((buffer) => {
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let offset = 0; offset < bytes.length; offset += 0x8000) {
          binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
        }
        return btoa(binary);
      })
      .catch((error) => {
        pdfFontPromise = undefined;
        throw error;
      });
  }
  return pdfFontPromise;
}

function drawPdfQr(pdf, qr, x, y, size) {
  const count = qr.getModuleCount();
  const moduleSize = size / (count + 8);
  pdf.setFillColor(255, 255, 255);
  pdf.rect(x, y, size, size, "F");
  pdf.setFillColor(0, 0, 0);
  for (let row = 0; row < count; row += 1) {
    for (let column = 0; column < count; column += 1) {
      if (qr.isDark(row, column)) {
        pdf.rect(x + (column + 4) * moduleSize, y + (row + 4) * moduleSize, moduleSize, moduleSize, "F");
      }
    }
  }
}

function drawMixedAnswerPdf(pdf, template) {
  const mc = template.multipleChoice;
  pdf.setLineWidth(0.3);
  if (mc.showOptionLabelsOnRows === false) {
    for (let column = 0; column < mc.columns; column += 1) {
      mc.options.forEach((option, index) => {
        addPdfText(pdf, option, mc.columnX[column] + mc.optionOffsets[index], mc.optionHeaderY, 5.2, { bold: true, align: "center" });
      });
    }
  }
  for (const row of getMultipleChoiceRows(template)) {
    addPdfText(pdf, `Câu ${String(row.number).padStart(2, "0")}`, row.labelX, row.y + mc.rowLabelOffsetY, 6.3);
    for (const option of row.options) {
      if (mc.showOptionLabelsOnRows !== false) {
        addPdfText(pdf, option.label, option.x, option.y + mc.bubbleLabelOffsetY, 5.2, { align: "center" });
      }
      pdf.circle(option.x, option.y, mc.bubbleRadius, "S");
    }
  }

  const tf = template.trueFalse;
  for (const row of getTrueFalseRows(template)) {
    addPdfText(pdf, `${row.question}${row.statement})`, row.labelX, row.y + tf.rowLabelOffsetY, 6.3);
    for (const choice of row.choices) {
      addPdfText(pdf, choice.label, choice.x, choice.y + tf.bubbleLabelOffsetY, 5.2, { align: "center" });
      pdf.circle(choice.x, choice.y, tf.bubbleRadius, "S");
    }
  }
}

function drawMixedEssayPdf(pdf, metadata, template, qr) {
  const header = template.header;
  addPdfText(pdf, metadata.schoolName, header.school.x, header.school.y, 9, { bold: true, maxWidth: header.school.maxWidth });
  addPdfText(pdf, metadata.examTitle, header.examTitle.x, header.examTitle.y, 11, { bold: true, maxWidth: header.examTitle.maxWidth });
  addPdfText(pdf, `Môn thi: ${metadata.subject || "................"}`, header.subject.x, header.subject.y, 8);
  addPdfText(pdf, "Lớp: __________________", header.className.x, header.className.y, 8);
  addPdfText(pdf, "Họ và tên:", header.candidateName.labelX, header.candidateName.y, 8);
  addPdfText(pdf, "Mã đề:", header.examCode.labelX, header.examCode.y, 8);
  pdf.setLineWidth(0.25);
  pdf.line(header.candidateName.lineX, header.candidateName.y + 0.6, header.candidateName.lineEndX, header.candidateName.y + 0.6);
  pdf.line(header.examCode.lineX, header.examCode.y + 0.6, header.examCode.lineEndX, header.examCode.y + 0.6);
  pdf.setLineWidth(0.3);
  pdf.line(template.headerDivider.x1, template.headerDivider.y, template.headerDivider.x2, template.headerDivider.y);
  addPdfText(pdf, "I. TRẮC NGHIỆM", template.multipleChoice.titleX, template.multipleChoice.titleY, 8.5, { bold: true });
  addPdfText(pdf, "II. ĐÚNG / SAI", template.trueFalse.titleX, template.trueFalse.titleY, 8.5, { bold: true });
  addPdfText(pdf, "PHẦN TỰ LUẬN", template.essay.x + template.essay.width / 2, template.essay.titleY, 7.2, { bold: true, align: "center" });
  addPdfText(pdf, "MÃ PHIẾU", template.qr.labelX, template.qr.labelY, 5, { bold: true, align: "center" });
  addPdfText(pdf, metadata.sheetId, template.qr.labelX, template.qr.idY, 4.2, { align: "center" });
  addPdfText(pdf, metadata.examCode, headerExamCodeX(template), header.examCode.y, 8);
  drawPdfQr(pdf, qr, template.qr.x, template.qr.y, template.qr.size);

  drawMixedAnswerPdf(pdf, template);
  const essay = template.essay;
  pdf.setLineWidth(0.25);
  pdf.rect(essay.x, essay.y, essay.width, essay.height, "S");
  pdf.line(essay.x, essay.firstLineY - 2, essay.x + essay.width, essay.firstLineY - 2);
  pdf.setLineWidth(0.16);
  for (const y of getEssayLines(template)) {
    pdf.line(essay.lineStartX, y, essay.lineEndX, y);
  }
  pdf.setFillColor(0, 0, 0);
  for (const anchor of template.anchors) {
    pdf.rect(anchor.x, anchor.y, template.anchorSize, template.anchorSize, "F");
  }
  addPdfText(pdf, "Tô kín ô trả lời; viết phần tự luận trong khung.", template.footer.x, template.footer.y, 6, { align: "center" });
  const safeExamCode = metadata.examCode.replace(/[^a-zA-Z0-9_-]/g, "") || "ma-de";
  pdf.save(`phieu-24-cau-dung-sai-tu-luan-${safeExamCode}-${metadata.sheetId}.pdf`);
}

function drawEssayPdf(pdf, metadata, template) {
  const { header, multipleChoice: mc, essay } = template;
  const strokeWidth = 0.2;
  pdf.setLineWidth(strokeWidth);
  addPdfText(pdf, "Thí sinh điền đầy đủ thông tin bằng chữ in hoa", header.instruction.x, header.instruction.y, 6);
  addPdfText(pdf, "STT: ______  Số tờ: ____", header.sheetInfo.x, header.sheetInfo.y, 6);
  addPdfText(pdf, metadata.schoolName, header.school.x, header.school.y, 7.3, { bold: true });
  addPdfText(pdf, metadata.examTitle || "PHIẾU TRẢ LỜI TRẮC NGHIỆM", header.examTitle.x, header.examTitle.y, 9.5, { bold: true, align: "center", maxWidth: header.examTitle.maxWidth });
  addPdfText(pdf, `MÔN: ${metadata.subject || "........................"}`, header.subject.x, header.subject.y, 7, { bold: true, align: "center", maxWidth: header.subject.maxWidth });
  addPdfText(pdf, "NGÀY THI: ....../....../20......", header.date.x, header.date.y, 6, { align: "center" });
  for (const row of header.topRows) {
    addPdfText(pdf, row.label, 20, row.y, 5.2);
    pdf.line(row.lineX, row.y + 0.6, row.lineEndX, row.y + 0.6);
  }

  const drawBox = (box) => pdf.rect(box.x, box.y, box.width, box.height, "S");
  drawBox(header.supervisorOne);
  drawBox(header.notice);
  drawBox(header.supervisorTwo);
  drawBox(header.candidateDetails);
  addPdfText(pdf, "Giám thị 1", header.supervisorOne.x + header.supervisorOne.width / 2, header.supervisorOne.y + 6, 5.2, { bold: true, align: "center" });
  addPdfText(pdf, "Chữ ký: __________", header.supervisorOne.x + 3, header.supervisorOne.y + 19, 4.8);
  addPdfText(pdf, "Thí sinh lưu ý:", header.notice.x + 3, header.notice.y + 6, 5.2, { bold: true });
  addPdfText(pdf, "Điền đầy đủ thông tin, tô kín", header.notice.x + 3, header.notice.y + 11, 4.8);
  addPdfText(pdf, "một ô trong mỗi cột; không gấp", header.notice.x + 3, header.notice.y + 16, 4.8);
  addPdfText(pdf, "hoặc làm bẩn phiếu.", header.notice.x + 3, header.notice.y + 20, 4.8);
  addPdfText(pdf, "Giám thị 2", header.supervisorTwo.x + header.supervisorTwo.width / 2, header.supervisorTwo.y + 7, 5.2, { bold: true, align: "center" });
  addPdfText(pdf, "Chữ ký: __________", header.supervisorTwo.x + 3, header.supervisorTwo.y + 23, 4.8);

  const detailLines = [
    "4. Họ và tên: ________________  Lớp: ____",
    "5. Ngày sinh: ____ / ____ / ______",
    "6. Nơi sinh: ________________________",
    "7. Chữ ký thí sinh: __________________",
  ];
  detailLines.forEach((line, index) => {
    addPdfText(pdf, line, header.candidateDetails.x + 2, header.detailsFirstY + index * header.detailsPitch, 4.7);
  });

  for (const [grid, rowLabelX] of [
    [template.studentNumberGrid, template.studentNumberGrid.rowLabelX],
    [template.examCodeGrid, template.examCodeGrid.rowLabelX],
  ]) {
    for (const row of getDigitGridRows(grid)) {
      addPdfText(pdf, String(row.digit), rowLabelX, row.y + 0.7, 4.2, { align: "center" });
      for (const bubble of row.bubbles) {
        pdf.circle(bubble.x, bubble.y, grid.bubbleRadius, "S");
      }
    }
  }

  drawBox(mc.frame);
  pdf.line(mc.frame.x, mc.headerY + 2, mc.frame.x + mc.frame.width, mc.headerY + 2);
  mc.options.forEach((option, index) => {
    addPdfText(pdf, option, mc.columnX[0] + mc.optionOffsets[index], mc.headerY, 4.8, { bold: true, align: "center" });
  });
  for (const row of getMultipleChoiceRows(template)) {
    addPdfText(pdf, String(row.number), row.labelX, row.y + mc.rowLabelOffsetY, 4.2, { bold: true });
    for (const option of row.options) {
      pdf.circle(option.x, option.y, mc.bubbleRadius, "S");
    }
  }

  drawBox(essay);
  addPdfText(pdf, "PHẦN TỰ LUẬN", essay.x + essay.width / 2, essay.titleY, 6.2, { bold: true, align: "center" });
  pdf.line(essay.x, essay.firstLineY - 2, essay.x + essay.width, essay.firstLineY - 2);
  for (const y of getEssayLines(template)) {
    pdf.line(essay.lineStartX, y, essay.lineEndX, y);
  }

  pdf.setFillColor(0, 0, 0);
  for (const anchor of template.anchors) {
    pdf.rect(anchor.x, anchor.y, template.anchorSize, template.anchorSize, "F");
  }
  for (const marker of template.alignmentMarks) {
    pdf.rect(marker.x, marker.y, marker.size, marker.size, "F");
  }
  const safeExamCode = metadata.examCode.replace(/[^a-zA-Z0-9_-]/g, "") || "ma-de";
  pdf.save(`phieu-120-30-cau-tu-luan-${safeExamCode}.pdf`);
}

export async function exportAnswerSheetPdf(metadata, template = ANSWER_SHEET_TEMPLATE) {
  const JsPdf = window.jspdf?.jsPDF;
  if (!JsPdf) {
    throw new Error("Không tải được thư viện xuất PDF. Hãy kiểm tra kết nối mạng rồi thử lại.");
  }
  const qr = template.qr
    ? makeQr(`OMR|${template.id}|${metadata.examCode}|${metadata.sheetId}`)
    : null;
  const fontBase64 = await loadVietnameseFont();
  const pdf = new JsPdf({ orientation: "portrait", unit: "mm", format: [template.page.width, template.page.height] });
  pdf.addFileToVFS("NotoSans.ttf", fontBase64);
  pdf.addFont("NotoSans.ttf", "NotoSans", "normal");
  pdf.addFont("NotoSans.ttf", "NotoSans", "bold");
  if (template.kind === "essay30") {
    drawEssayPdf(pdf, metadata, template);
    return;
  }
  if (template.kind === "mixedEssay") {
    drawMixedEssayPdf(pdf, metadata, template, qr);
    return;
  }
  const header = template.header;

  addPdfText(pdf, metadata.schoolName, header.school.x, header.school.y, 9, { bold: true, maxWidth: header.school.maxWidth });
  addPdfText(pdf, metadata.examTitle, header.examTitle.x, header.examTitle.y, 11, { bold: true, maxWidth: header.examTitle.maxWidth });
  addPdfText(pdf, `Môn thi: ${metadata.subject || "................"}`, header.subject.x, header.subject.y, 8);
  addPdfText(pdf, "Lớp: __________________", header.className.x, header.className.y, 8);
  addPdfText(pdf, "Họ và tên:", header.candidateName.labelX, header.candidateName.y, 8);
  addPdfText(pdf, "Mã đề:", header.examCode.labelX, header.examCode.y, 8);
  pdf.setLineWidth(0.25);
  pdf.line(header.candidateName.lineX, header.candidateName.y + 0.6, header.candidateName.lineEndX, header.candidateName.y + 0.6);
  pdf.line(header.examCode.lineX, header.examCode.y + 0.6, header.examCode.lineEndX, header.examCode.y + 0.6);
  pdf.setLineWidth(0.3);
  pdf.line(template.headerDivider.x1, template.headerDivider.y, template.headerDivider.x2, template.headerDivider.y);
  addPdfText(pdf, "I. TRẮC NGHIỆM", template.multipleChoice.titleX, template.multipleChoice.titleY, 8.5, { bold: true });
  addPdfText(pdf, "II. ĐÚNG / SAI", template.trueFalse.titleX, template.trueFalse.titleY, 8.5, { bold: true });
  addPdfText(pdf, "MÃ PHIẾU", template.qr.labelX, template.qr.labelY, 5, { bold: true, align: "center" });
  addPdfText(pdf, metadata.sheetId, template.qr.labelX, template.qr.idY, 4.2, { align: "center" });
  addPdfText(pdf, metadata.examCode, headerExamCodeX(template), header.examCode.y, 8);
  drawPdfQr(pdf, qr, template.qr.x, template.qr.y, template.qr.size);

  drawMixedAnswerPdf(pdf, template);

  pdf.setFillColor(0, 0, 0);
  for (const anchor of template.anchors) {
    pdf.rect(anchor.x, anchor.y, template.anchorSize, template.anchorSize, "F");
  }
  addPdfText(pdf, "Tô kín một ô cho mỗi câu / mỗi ý. Không tẩy xóa.", template.footer.x, template.footer.y, 6, { align: "center" });
  const safeExamCode = metadata.examCode.replace(/[^a-zA-Z0-9_-]/g, "") || "ma-de";
  pdf.save(`phieu-tra-loi-${safeExamCode}-${metadata.sheetId}.pdf`);
}

export function createSheetId() {
  const bytes = new Uint8Array(8);
  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
}

