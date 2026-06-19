// ============================================================
// NEO NOVA — pdf.js  (Redesigned to match Handover Report)
// Color scheme: dark navy header · amber unit titles · green status
// ============================================================

const C = {
  headerBg:    [26,  26,  46],     // #1a1a2e  dark navy
  headerText:  [255, 255, 255],    // white
  accent:      [245, 166,  35],    // #f5a623  amber/orange
  accentDim:   [180, 120,  20],    // darker amber for borders

  white:       [255, 255, 255],
  lightGray:   [248, 249, 250],
  midGray:     [240, 240, 240],
  borderGray:  [220, 220, 220],
  darkGray:    [89,  102, 116],
  textMuted:   [160, 160, 160],
  textDark:    [30,   40,  50],

  // Status — green only (all fields are "Configuration Done" style)
  statusGreen:  [39,  174,  96],   // #27ae60
  statusAmber:  [245, 166,  35],   // in_progress
  statusRed:    [231,  76,  60],   // blocked / issue
  statusGray:   [149, 165, 166],   // pending / not started
};

const STATUS_TEXT = {
  pending:      "Not Started",
  in_progress:  "In Progress",
  done:         "Configuration Done",
  issue:        "Issue",
  blocked:      "Blocked",
};

const STATUS_COLOR = {
  pending:      C.statusGray,
  in_progress:  C.statusAmber,
  done:         C.statusGreen,
  issue:        C.statusRed,
  blocked:      C.statusRed,
};

function statusLabel(v) { return STATUS_TEXT[v] || v || "—"; }
function statusColor(v) { return STATUS_COLOR[v] || C.statusGray; }

// jsPDF factory
function newDoc() {
  const { jsPDF } = window.jspdf;
  return new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
}

// Page dimensions  A4: 595.28 × 841.89 pt
const PW = 595.28;
const PH = 841.89;
const ML = 36;
const MR = 36;
const CW = PW - ML - MR;   // ~523 pt content width

// ============================================================
// HEADER — Dark navy with amber brand + right-aligned zone info
// ============================================================
function drawHeader(doc, zone, title = "", meta = {}) {
  // Background
  doc.setFillColor(...C.headerBg);
  doc.rect(0, 0, PW, 72, "F");

  // Brand — left side
  doc.setTextColor(...C.accent);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("NEO NOVA", ML, 28);

  doc.setTextColor(200, 200, 220);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Zone ${zone.code} — Project Handover Report`, ML, 44);

  doc.setFontSize(8);
  doc.setTextColor(160, 160, 190);
  const unitRange = meta.unitRange || "Units: 1C – 14C";
  doc.text(unitRange, ML, 58);

  // Right side — Date / Engineer / Company
  const rightX = PW - MR;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 220);

  const date     = meta.date     || new Date().toLocaleDateString("en-GB").replace(/\//g, "-");
  const engineer = meta.engineer || (zone.engineer || "");
  const company  = meta.company  || "Neo Nova";

  doc.text(`Date: ${date}`,          rightX, 28, { align: "right" });
  doc.text(`Engineer: ${engineer}`,  rightX, 42, { align: "right" });
  doc.text(`Company: ${company}`,    rightX, 56, { align: "right" });

  // Bottom amber accent line
  doc.setFillColor(...C.accent);
  doc.rect(0, 72, PW, 3, "F");
}

// ============================================================
// FOOTER
// ============================================================
function drawFooter(doc, pageNum, totalPages) {
  const y = PH - 20;

  doc.setDrawColor(...C.borderGray);
  doc.setLineWidth(0.8);
  doc.line(ML, y - 10, PW - ML, y - 10);

  doc.setTextColor(...C.textMuted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "2-digit" });

  doc.text(`Neo Nova Report  •  Generated ${dateStr}`, ML, y);
  doc.text(`Page ${pageNum} of ${totalPages}`, PW - MR, y, { align: "right" });
}

// ============================================================
// SUMMARY CARDS ROW  (Total / Done / In Progress / Issue / Blocked / %)
// ============================================================
function drawSummaryCards(doc, units, y) {
  const total     = units.length;
  const done      = units.filter(u => u.overall_status === "done").length;
  const inProg    = units.filter(u => u.overall_status === "in_progress").length;
  const issue     = units.filter(u => u.overall_status === "issue").length;
  const blocked   = units.filter(u => u.overall_status === "blocked").length;
  const pct       = total ? Math.round((done / total) * 100) : 0;

  const cards = [
    { num: String(total),   label: "Total Units",  color: C.headerBg },
    { num: String(done),    label: "Done",          color: C.statusGreen },
    { num: String(inProg),  label: "In Progress",   color: C.statusAmber },
    { num: String(issue),   label: "Done — Issue",  color: C.statusRed },
    { num: String(blocked), label: "Blocked",       color: C.textMuted },
    { num: `${pct}%`,       label: "Completion",    color: [41, 128, 185] },
  ];

  const cardW  = (CW - 5 * 8) / 6;  // 6 cards with 8pt gap
  const cardH  = 56;
  let cx = ML;

  cards.forEach(card => {
    // Card background
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...C.borderGray);
    doc.setLineWidth(0.8);
    doc.roundedRect(cx, y, cardW, cardH, 4, 4, "FD");

    // Number
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...card.color);
    doc.text(card.num, cx + cardW / 2, y + 28, { align: "center" });

    // Label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.textMuted);
    doc.text(card.label, cx + cardW / 2, y + 44, { align: "center" });

    cx += cardW + 8;
  });

  return y + cardH + 16;
}

// ============================================================
// SECTION TITLE BAR  (dark navy background)
// ============================================================
function drawSectionTitle(doc, text, y) {
  doc.setFillColor(...C.headerBg);
  doc.rect(ML, y, CW, 26, "F");

  doc.setTextColor(...C.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(text, ML + 14, y + 17);

  return y + 26;
}

// ============================================================
// UNITS LIST TABLE
// ============================================================
function drawUnitsTable(doc, units, y) {
  y = drawSectionTitle(doc, "Units List", y);

  const cols = {
    unit:   { w: 55,  label: "Unit" },
    fg:     { w: 115, label: "FortiGate" },
    fs:     { w: 115, label: "FortiSwitch" },
    ap:     { w: 115, label: "Access Points" },
    ovr:    { w: 105, label: "Overall Status" },
    notes:  { w: CW - 55 - 115 - 115 - 115 - 105, label: "Notes" },
  };

  const colOrder = ["unit", "fg", "fs", "ap", "ovr", "notes"];
  const rowH = 22;
  const headerH = 22;

  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(ML, y, CW, headerH, "F");

  doc.setDrawColor(...C.borderGray);
  doc.setLineWidth(0.5);
  doc.rect(ML, y, CW, headerH);

  let hx = ML;
  colOrder.forEach(key => {
    const col = cols[key];
    doc.setTextColor(85, 85, 85);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(col.label, hx + col.w / 2, y + 15, { align: "center" });
    hx += col.w;
  });

  y += headerH;

  // Rows
  units.forEach((unit, i) => {
    const bg = i % 2 === 0 ? [255, 255, 255] : [250, 250, 250];
    doc.setFillColor(...bg);
    doc.rect(ML, y, CW, rowH, "F");
    doc.setDrawColor(...C.borderGray);
    doc.setLineWidth(0.3);
    doc.rect(ML, y, CW, rowH);

    let rx = ML;

    // Unit code — amber bold
    doc.setTextColor(...C.accent);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(unit.unit_code, rx + cols.unit.w / 2, y + 15, { align: "center" });
    rx += cols.unit.w;

    // Status cells
    const statusKeys = [
      unit.fortigate_status,
      unit.fortiswitch_status,
      unit.ap_status,
      unit.overall_status,
    ];
    const statusCols = ["fg", "fs", "ap", "ovr"];

    statusCols.forEach((key, idx) => {
      const sv = statusKeys[idx];
      const sc = statusColor(sv);
      doc.setTextColor(...sc);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(statusLabel(sv), rx + cols[key].w / 2, y + 15, { align: "center" });
      rx += cols[key].w;
    });

    // Notes
    const notesText = unit.notes ? String(unit.notes).slice(0, 30) : "—";
    doc.setTextColor(...C.textMuted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(notesText, rx + 6, y + 15);

    y += rowH;
  });

  return y + 16;
}

// ============================================================
// UNIT DETAIL CARD  (status 2×2 grid + photos label)
// ============================================================
function drawUnitCard(doc, zone, unit, y) {
  const cardH_header = 32;
  const gridH        = 68;   // 2 rows × 34
  const cardPad      = 10;

  // Card outer border
  doc.setDrawColor(...C.borderGray);
  doc.setLineWidth(0.8);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(ML, y, CW, cardH_header + gridH + cardPad * 2, 5, 5, "FD");

  // Card header row
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(ML, y, CW, cardH_header, 5, 5, "F");
  // Bottom border of header
  doc.setDrawColor(...C.borderGray);
  doc.setLineWidth(0.5);
  doc.line(ML, y + cardH_header, ML + CW, y + cardH_header);

  // Zone label (left)
  doc.setTextColor(...C.textMuted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(`Zone ${zone.code}`, ML + 14, y + 21);

  // Unit ID (right) — amber bold large
  doc.setTextColor(...C.accent);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`Unit ${unit.unit_code}`, ML + CW - 14, y + 22, { align: "right" });

  y += cardH_header + cardPad;

  // 2×2 Status grid
  const cellW = CW / 2 - 6;
  const cellH = 30;
  const gap   = 6;

  const fields = [
    { label: "FortiSwitch",   val: unit.fortiswitch_status },
    { label: "FortiGate",     val: unit.fortigate_status },
    { label: "Overall Status",val: unit.overall_status },
    { label: "Access Points", val: unit.ap_status },
  ];

  fields.forEach((field, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const fx  = ML + col * (cellW + gap * 2 + 4);
    const fy  = y + row * (cellH + gap);

    const sc = statusColor(field.val);

    // Cell border
    doc.setDrawColor(...C.borderGray);
    doc.setLineWidth(0.6);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(fx, fy, cellW, cellH, 4, 4, "FD");

    // Status text (left, green/colored)
    doc.setTextColor(...sc);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text(statusLabel(field.val), fx + 10, fy + cellH / 2 + 3.5);

    // Field label (right, gray)
    doc.setTextColor(...C.textMuted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(field.label, fx + cellW - 8, fy + cellH / 2 + 3.5, { align: "right" });
  });

  y += gridH;

  return y + cardPad;
}

// ============================================================
// PHOTOS SECTION HEADER  (inside a unit card)
// ============================================================
function drawPhotosHeader(doc, y) {
  doc.setTextColor(...C.textMuted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Click a box to add a photo", ML, y + 10);

  doc.setTextColor(...C.textDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Photos", ML + CW, y + 10, { align: "right" });

  return y + 18;
}

// ============================================================
// Fetch image as data URL
// ============================================================
async function loadImageAsDataUrl(url) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const blob = await resp.blob();
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.onerror = rej;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("Image load failed:", url, e);
    return null;
  }
}

// ============================================================
// Draw photo thumbnails grid (4 per row)
// ============================================================
async function drawPhotos(doc, zone, unit, photos, y) {
  const thumbW  = (CW - 3 * 8) / 4;   // 4 per row
  const thumbH  = thumbW * 0.75;       // 4:3 ratio
  const gap     = 8;
  const perRow  = 4;
  let col = 0;

  for (const photo of photos) {
    // Page overflow check
    if (y + thumbH > PH - 60) {
      doc.addPage();
      drawHeader(doc, zone, `Unit ${unit.unit_code} — Photos`);
      y = 90;
      col = 0;
    }

    const px      = ML + col * (thumbW + gap);
    const dataUrl = await loadImageAsDataUrl(photo.url);

    // Photo box
    doc.setDrawColor(...C.borderGray);
    doc.setLineWidth(0.7);
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(px, y, thumbW, thumbH, 3, 3, "FD");

    if (dataUrl) {
      try { doc.addImage(dataUrl, "JPEG", px, y, thumbW, thumbH); }
      catch { /* keep placeholder */ }
    } else {
      // Empty slot icon hint
      doc.setTextColor(...C.textMuted);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Add photo", px + thumbW / 2, y + thumbH / 2, { align: "center" });
    }

    // Caption strip if photo has a caption/name
    if (photo.caption || photo.name) {
      const cap = (photo.caption || photo.name || "").slice(0, 28);
      doc.setFillColor(0, 0, 0);
      doc.setGState && doc.setGState(doc.GState({ opacity: 0.5 }));
      doc.rect(px, y + thumbH - 16, thumbW, 16, "F");
      doc.setGState && doc.setGState(doc.GState({ opacity: 1 }));
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7.5);
      doc.text(cap, px + thumbW / 2, y + thumbH - 5, { align: "center" });
    }

    col++;
    if (col >= perRow) {
      col = 0;
      y += thumbH + gap;
    }
  }

  if (col > 0) y += thumbH + gap;
  return y;
}

// ============================================================
// EXPORT: Single Unit PDF
// ============================================================
export async function exportUnitPdf(zone, unit) {
  const doc = newDoc();

  drawHeader(doc, zone, `Unit ${unit.unit_code}`, {
    date: zone.date, engineer: zone.engineer, company: zone.company,
  });
  let y = 88;

  y = drawUnitCard(doc, zone, unit, y);

  const photos = unit.photos || [];
  if (photos.length) {
    y = drawPhotosHeader(doc, y);
    y = await drawPhotos(doc, zone, unit, photos, y + 4);
  }

  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(doc, p, totalPages);
  }

  doc.save(`NeoNova_Unit_${unit.unit_code}.pdf`);
}


// ============================================================
// EXPORT: Full Zone PDF  (summary + per-unit cards + photos)
// ============================================================
export async function exportZonePdf(zone, units) {
  const doc  = newDoc();
  const meta = {
    date:      zone.date,
    engineer:  zone.engineer,
    company:   zone.company,
    unitRange: units.length
      ? `Units: ${units[0].unit_code} – ${units[units.length - 1].unit_code}`
      : "",
  };

  // ── Page 1: Summary ──────────────────────────────────────
  drawHeader(doc, zone, "Zone Report", meta);
  let y = 88;

  y = drawSummaryCards(doc, units, y);
  y = drawUnitsTable(doc, units, y);

  // ── Per-unit pages ────────────────────────────────────────
  y = drawSectionTitle(doc, "Unit Details & Photos", y);
  y += 10;

  for (const unit of units) {
    // Overflow check before drawing a unit card
    const cardMinH = 140;
    if (y + cardMinH > PH - 60) {
      doc.addPage();
      drawHeader(doc, zone, `Unit ${unit.unit_code}`, meta);
      y = 88;
    }

    y = drawUnitCard(doc, zone, unit, y);

    const photos = unit.photos || [];
    if (photos.length) {
      y = drawPhotosHeader(doc, y);
      y = await drawPhotos(doc, zone, unit, photos, y + 4);
    }

    y += 14;   // gap between unit cards
  }

  // ── Footers ───────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(doc, p, totalPages);
  }

  doc.save(`NeoNova_Zone_${zone.code}_Report.pdf`);
}


// ============================================================
// EXPORT: All Zones PDF
// ============================================================
export async function exportAllZonesPdf(zones) {
  const doc = newDoc();
  let firstPage = true;

  for (const zone of zones) {
    const units = zone.units || [];
    const meta  = {
      date:      zone.date,
      engineer:  zone.engineer,
      company:   zone.company,
      unitRange: units.length
        ? `Units: ${units[0].unit_code} – ${units[units.length - 1].unit_code}`
        : "",
    };

    if (!firstPage) doc.addPage();
    firstPage = false;

    drawHeader(doc, zone, "Zone Overview", meta);
    let y = 88;

    y = drawSummaryCards(doc, units, y);
    y = drawUnitsTable(doc, units, y);

    y = drawSectionTitle(doc, "Unit Details & Photos", y);
    y += 10;

    for (const unit of units) {
      if (y + 140 > PH - 60) {
        doc.addPage();
        drawHeader(doc, zone, `Unit ${unit.unit_code}`, meta);
        y = 88;
      }

      y = drawUnitCard(doc, zone, unit, y);

      const photos = unit.photos || [];
      if (photos.length) {
        y = drawPhotosHeader(doc, y);
        y = await drawPhotos(doc, zone, unit, photos, y + 4);
      }

      y += 14;
    }
  }

  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(doc, p, totalPages);
  }

  doc.save(`NeoNova_All_Zones_Report.pdf`);
}