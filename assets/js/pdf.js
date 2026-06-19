// ============================================================
// NEO NOVA — pdf.js
// PDF export helpers using jsPDF (loaded via CDN in index.html)
// Clean, organized layout with professional color scheme
// ============================================================

import { fmtDate } from "./status.js";

// Color palette: professional blue header, clean grays, vibrant status indicators
const C = {
  headerBg:   [11, 61, 145],      // #0b3d91 dark blue
  headerText: [255, 255, 255],    // white
  accent:     [0, 169, 157],      // #00a99d teal
  accentLight:[100, 200, 190],    // lighter teal for backgrounds
  white:      [255, 255, 255],
  lightGray:  [248, 249, 250],    // page background (lighter)
  darkGray:   [89, 102, 116],     // section text
  textMuted:  [140, 150, 160],    // faint text
  textDark:   [30, 40, 50],       // strong text
  borderGray: [215, 220, 225],    // table borders
  // Status colors
  statusGreen:  [52, 211, 153],   // Done
  statusAmber:  [251, 191, 36],   // In Progress
  statusRed:    [239, 68, 68],    // Blocked/Issue
  statusGray:   [156, 163, 175],  // Pending
};

const STATUS_TEXT = {
  pending:     "Not Started",
  in_progress: "In Progress",
  done:        "Done",
  issue:       "Issue",
  blocked:     "Blocked",
};

const STATUS_COLOR = {
  pending:     C.statusGray,
  in_progress: C.statusAmber,
  done:        C.statusGreen,
  issue:       C.statusRed,
  blocked:     C.statusRed,
};

function statusLabel(v) { return STATUS_TEXT[v] || v || "—"; }
function statusColor(v) { return STATUS_COLOR[v] || C.statusGray; }

// jsPDF factory
function newDoc() {
  const { jsPDF } = window.jspdf;
  return new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
}

// Page dimensions (A4: 595.28 x 841.89 pt)
const PW  = 595.28;
const PH  = 841.89;
const ML  = 40;
const MR  = 40;
const CW  = PW - ML - MR;  // 515.28 pt content width

// ============================================================
// HEADER — Professional dark blue with brand
// ============================================================
function drawHeader(doc, zone, title = "") {
  // Header background
  doc.setFillColor(...C.headerBg);
  doc.rect(0, 0, PW, 70, "F");

  // Accent line under header (thicker for better visual impact)
  doc.setFillColor(...C.accent);
  doc.rect(0, 70, PW, 4, "F");

  // Brand name (left, white) - larger and bolder
  doc.setTextColor(...C.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("[NEO NOVA]", ML, 26);

  // Subtitle (left, smaller)
  doc.setTextColor(200, 220, 240);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Field Operations Console", ML, 43);

  // Vertical divider line
  doc.setDrawColor(220, 230, 240);
  doc.setLineWidth(0.5);
  doc.line(260, 12, 260, 62);

  // Zone info (right, white)
  doc.setTextColor(...C.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  const zoneText = `Zone ${zone.code}${zone.label ? " • " + zone.label : ""}`;
  doc.text(zoneText, PW - ML, 26, { align: "right" });

  // Page title (right, smaller)
  if (title) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(200, 220, 240);
    doc.text(title, PW - ML, 43, { align: "right" });
  }
}

// ============================================================
// FOOTER — Page number and date with professional styling
// ============================================================
function drawFooter(doc, pageNum, totalPages) {
  const y = PH - 22;
  
  // Separator line (thicker)
  doc.setDrawColor(...C.borderGray);
  doc.setLineWidth(1);
  doc.line(ML, y - 10, PW - ML, y - 10);

  // Footer text
  doc.setTextColor(...C.textMuted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  doc.text(`Neo Nova • ${dateStr} ${timeStr}`, ML, y);
  doc.text(`Page ${pageNum} of ${totalPages}`, PW - ML, y, { align: "right" });
}

// ============================================================
// Section title with professional styling
// ============================================================
function sectionTitle(doc, text, y) {
  // Subtle background
  doc.setFillColor(...C.lightGray);
  doc.rect(ML, y - 2, CW, 26, "F");

  // Left accent bar (thicker)
  doc.setFillColor(...C.accent);
  doc.rect(ML, y - 2, 5, 26, "F");

  // Title text (larger and bolder)
  doc.setTextColor(...C.headerBg);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(text, ML + 14, y + 14);

  // Subtle border bottom
  doc.setDrawColor(...C.borderGray);
  doc.setLineWidth(0.5);
  doc.line(ML, y + 24, PW - ML, y + 24);

  return y + 32;
}

// ============================================================
// Status badge with colored outline and shadow effect
// ============================================================
function drawStatusBadge(doc, status, x, y, w = 100) {
  const color = statusColor(status);
  const label = statusLabel(status);

  // Subtle shadow effect (light gray background)
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(x - 1, y - 11, w + 2, 20, 4, 4, "FD");

  // Colored outline badge
  doc.setDrawColor(...color);
  doc.setLineWidth(1.5);
  doc.setFillColor(...C.white);
  doc.roundedRect(x, y - 10, w, 18, 4, 4, "FD");

  // Text (colored and bold)
  doc.setTextColor(...color);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(label, x + w / 2, y + 2.5, { align: "center" });
}

// ============================================================
// Summary: Completed vs Remaining tasks
// ============================================================
function drawSummary(doc, fields, y) {
  const completed = fields.filter(f => f.val === "done");
  const remaining = fields.filter(f => f.val !== "done");

  y = sectionTitle(doc, "Completion Summary", y);

  // Completed items
  if (completed.length > 0) {
    doc.setTextColor(...C.statusGreen);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Completed (${completed.length}):`, ML + 10, y);
    y += 12;

    completed.forEach(f => {
      doc.setTextColor(...C.statusGreen);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`✓ ${f.label}`, ML + 18, y);
      y += 10;
    });
    y += 4;
  }

  // Remaining items
  if (remaining.length > 0) {
    doc.setTextColor(...C.textDark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Remaining (${remaining.length}):`, ML + 10, y);
    y += 12;

    remaining.forEach(f => {
      const color = statusColor(f.val);
      doc.setTextColor(...color);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`○ ${f.label}: ${statusLabel(f.val)}`, ML + 18, y);
      y += 10;
    });
  }

  return y + 8;
}

// ============================================================
// Fetch image as data URL for embedding
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
// EXPORT: Single Unit PDF
// ============================================================
export async function exportUnitPdf(zone, unit) {
  const doc = newDoc();

  drawHeader(doc, zone, `Unit ${unit.unit_code}`);
  let y = 85;

  // Unit title (larger)
  doc.setTextColor(...C.headerBg);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text(`Unit ${unit.unit_code}`, ML, y);
  y += 32;

  // Engineer line
  if (zone.engineer) {
    doc.setTextColor(...C.textMuted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Engineer: ${zone.engineer}`, ML, y);
    y += 14;
  }

  // Status fields grid (2 columns)
  y += 6;
  y = sectionTitle(doc, "Installation Status", y);

  const fields = [
    { label: "FortiGate", val: unit.fortigate_status },
    { label: "FortiSwitch", val: unit.fortiswitch_status },
    { label: "Access Points", val: unit.ap_status },
    { label: "AP Patch Panel Ports", val: unit.ap_patch_status },
    { label: "Overall Status", val: unit.overall_status },
  ];

  const colW = (CW - 12) / 2;
  fields.forEach((f, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const fx = ML + col * (colW + 12);
    const fy = y + row * 52;

    // Field background
    doc.setFillColor(...C.lightGray);
    doc.setDrawColor(...C.borderGray);
    doc.setLineWidth(0.5);
    doc.rect(fx, fy, colW, 52, "FD");

    // Field label
    doc.setTextColor(...C.textMuted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(f.label, fx + 10, fy + 12);

    // Status badge
    drawStatusBadge(doc, f.val, fx + 10, fy + 32, colW - 20);
  });

  y += Math.ceil(fields.length / 2) * 52 + 14;

  // Completion Summary
  y = drawSummary(doc, fields, y);

  // Notes section
  if (unit.notes) {
    y = sectionTitle(doc, "Notes", y);
    doc.setTextColor(...C.textDark);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const noteLines = doc.splitTextToSize(unit.notes, CW - 20);
    doc.text(noteLines, ML + 10, y);
    y += noteLines.length * 12 + 12;
  }

  // Photos section
  const photos = unit.photos || [];
  if (photos.length) {
    y = sectionTitle(doc, `Photos (${photos.length})`, y);

    const thumbW = 120;
    const thumbH = 90;
    const gap = 12;
    const perRow = Math.max(1, Math.floor((CW + gap) / (thumbW + gap)));

    let col = 0;
    for (const photo of photos) {
      if (y + thumbH > PH - 80) {
        drawFooter(doc, doc.internal.getCurrentPageInfo().pageNumber, "...");
        doc.addPage();
        drawHeader(doc, zone, `Unit ${unit.unit_code} - Photos`);
        y = 85;
        col = 0;
      }

      const px = ML + col * (thumbW + gap);
      const dataUrl = await loadImageAsDataUrl(photo.url);
      if (dataUrl) {
        try {
          doc.addImage(dataUrl, "JPEG", px, y, thumbW, thumbH);
        } catch (e) {
          doc.setFillColor(...C.lightGray);
          doc.rect(px, y, thumbW, thumbH, "F");
        }
      } else {
        doc.setFillColor(...C.lightGray);
        doc.rect(px, y, thumbW, thumbH, "F");
      }

      col++;
      if (col >= perRow) {
        col = 0;
        y += thumbH + gap;
      }
    }
    if (col > 0) y += thumbH + gap;
  }

  // Finalize footers
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(doc, p, totalPages);
  }

  doc.save(`NeoNova_Unit_${unit.unit_code}.pdf`);
}

// ============================================================
// EXPORT: Full Zone PDF (per-unit detail pages)
// ============================================================
export async function exportZonePdf(zone, units) {
  const doc = newDoc();

  // Cover page
  drawHeader(doc, zone, "Zone Report");
  let y = 95;

  // Title with accent color
  doc.setTextColor(...C.headerBg);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text(`Zone ${zone.code}`, ML, y);
  y += 40;

  // Zone label
  if (zone.label) {
    doc.setTextColor(...C.textDark);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);
    doc.text(zone.label, ML, y);
    y += 22;
  }

  // Engineer
  if (zone.engineer) {
    doc.setTextColor(...C.textMuted);
    doc.setFontSize(11);
    doc.text(`Engineer: ${zone.engineer}`, ML, y);
    y += 18;
  }

  // Date
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.setTextColor(...C.textMuted);
  doc.setFontSize(10);
  doc.text(`Report Generated: ${dateStr}`, ML, y);
  y += 28;

  // Summary stats with better styling
  const stats = {
    total: units.length,
    done: units.filter(u => u.overall_status === "done").length,
    inProgress: units.filter(u => u.overall_status === "in_progress").length,
    issue: units.filter(u => u.overall_status === "issue").length,
    blocked: units.filter(u => u.overall_status === "blocked").length,
  };
  const completion = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;

  const statItems = [
    { label: "Total Units", val: stats.total, color: C.textDark },
    { label: "Completed", val: stats.done, color: C.statusGreen },
    { label: "In Progress", val: stats.inProgress, color: C.statusAmber },
    { label: "Issues", val: stats.issue, color: C.statusRed },
    { label: "Completion", val: `${completion}%`, color: C.headerBg },
  ];

  const statW = (CW + 12) / statItems.length;
  statItems.forEach((item, i) => {
    const sx = ML + i * statW;
    // Card background
    doc.setFillColor(...C.lightGray);
    doc.setDrawColor(...C.borderGray);
    doc.setLineWidth(0.5);
    doc.rect(sx, y, statW - 6, 56, "FD");
    
    // Value
    doc.setTextColor(...item.color);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(String(item.val), sx + (statW - 6) / 2, y + 24, { align: "center" });
    
    // Label
    doc.setTextColor(...C.textMuted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(item.label, sx + (statW - 6) / 2, y + 45, { align: "center" });
  });
  y += 68;

  // Per-unit detail pages
  for (const unit of units) {
    doc.addPage();
    drawHeader(doc, zone, `Unit ${unit.unit_code}`);
    y = 85;

    doc.setTextColor(...C.headerBg);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(`Unit ${unit.unit_code}`, ML, y);
    y += 28;

    // Status grid
    y = sectionTitle(doc, "Installation Status", y);
    const statusFields = [
      { label: "FortiGate", val: unit.fortigate_status },
      { label: "FortiSwitch", val: unit.fortiswitch_status },
      { label: "Access Points", val: unit.ap_status },
      { label: "AP Patch", val: unit.ap_patch_status },
      { label: "Overall Status", val: unit.overall_status },
    ];

    const sColW = (CW - 12) / 2;
    statusFields.forEach((f, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const fx = ML + col * (sColW + 12);
      const fy = y + row * 50;

      doc.setFillColor(...C.lightGray);
      doc.setDrawColor(...C.borderGray);
      doc.setLineWidth(0.5);
      doc.rect(fx, fy, sColW, 50, "FD");

      doc.setTextColor(...C.textMuted);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(f.label, fx + 10, fy + 12);

      drawStatusBadge(doc, f.val, fx + 10, fy + 32, sColW - 20);
    });
    y += Math.ceil(statusFields.length / 2) * 50 + 14;

    // Completion Summary
    y = drawSummary(doc, statusFields, y);

    // Notes
    if (unit.notes) {
      y += 4;
      y = sectionTitle(doc, "Notes", y);
      doc.setTextColor(...C.textDark);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const noteLines = doc.splitTextToSize(unit.notes, CW - 20);
      doc.text(noteLines, ML + 10, y);
      y += noteLines.length * 12 + 10;
    }

    // Photos
    const photos = unit.photos || [];
    if (photos.length) {
      y += 4;
      y = sectionTitle(doc, `Photos (${photos.length})`, y);

      const thumbW = 115;
      const thumbH = 86;
      const gap = 10;
      const perRow = Math.max(1, Math.floor((CW + gap) / (thumbW + gap)));

      let col = 0;
      for (const photo of photos) {
        if (y + thumbH > PH - 80) {
          drawFooter(doc, doc.internal.getCurrentPageInfo().pageNumber, "...");
          doc.addPage();
          drawHeader(doc, zone, `Unit ${unit.unit_code} - Photos`);
          y = 85;
          col = 0;
        }

        const px = ML + col * (thumbW + gap);
        const dataUrl = await loadImageAsDataUrl(photo.url);
        if (dataUrl) {
          try {
            doc.addImage(dataUrl, "JPEG", px, y, thumbW, thumbH);
          } catch (e) {
            doc.setFillColor(...C.lightGray);
            doc.rect(px, y, thumbW, thumbH, "F");
          }
        } else {
          doc.setFillColor(...C.lightGray);
          doc.rect(px, y, thumbW, thumbH, "F");
        }

        col++;
        if (col >= perRow) {
          col = 0;
          y += thumbH + gap;
        }
      }
      if (col > 0) y += thumbH + gap;
    }
  }

  // Finalize all pages
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
  const totalPages = zones.reduce((sum, z) => sum + (z.units?.length || 0) + 1, 1);
  let currentPage = 1;

  for (const zone of zones) {
    doc.addPage();
    drawHeader(doc, zone, "Zone Overview");
    let y = 85;

    doc.setTextColor(...C.headerBg);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(`Zone ${zone.code}`, ML, y);
    y += 28;

    if (zone.label) {
      doc.setTextColor(...C.textMuted);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(zone.label, ML, y);
      y += 16;
    }

    if (zone.engineer) {
      doc.setTextColor(...C.textMuted);
      doc.setFontSize(10);
      doc.text(`Engineer: ${zone.engineer}`, ML, y);
      y += 14;
    }

    const units = zone.units || [];
    const zoneStats = {
      total: units.length,
      done: units.filter(u => u.overall_status === "done").length,
      inProgress: units.filter(u => u.overall_status === "in_progress").length,
    };

    y += 10;
    doc.setTextColor(...C.textDark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`Units: ${zoneStats.total} | Done: ${zoneStats.done} | In Progress: ${zoneStats.inProgress}`, ML, y);

    currentPage++;
  }

  for (let p = 1; p <= doc.internal.getNumberOfPages(); p++) {
    doc.setPage(p);
    drawFooter(doc, p, doc.internal.getNumberOfPages());
  }

  doc.save(`NeoNova_All_Zones_Report.pdf`);
}


// ---- jsPDF instance factory --------------------------------
function newDoc() {
  // jsPDF is loaded globally via CDN script tag
  const { jsPDF } = window.jspdf;
  return new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
}

// ---- Geometry constants ------------------------------------
const PW  = 595.28;   // A4 width  in pt
const PH  = 841.89;   // A4 height in pt
const ML  = 36;       // left margin
const MR  = 36;       // right margin
const MT  = 36;       // top margin
const CW  = PW - ML - MR;  // content width

// ============================================================
// Header banner (reused on every page)
// ============================================================
function drawHeader(doc, zone, pageLabel = "") {
  // Header background bar
  doc.setFillColor(...C.header);
  doc.rect(0, 0, PW, 64, "F");

  // Teal accent line under header
  const HEAD_H = 64;
  doc.setFillColor(...C.amber);
  doc.rect(0, HEAD_H, PW, 4, "F");

  // Brand name (left)
  doc.setTextColor(...C.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("[NEO NOVA]", ML, 36);

  // Sub label (smaller)
  doc.setTextColor(...C.paper);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Field Operations Console", ML, 52);

  // Zone text (right)
  doc.setTextColor(...C.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  const zoneText = `Zone ${zone.code}${zone.label ? " · " + zone.label : ""}`;
  doc.text(zoneText, PW - MR, 36, { align: "right" });

  // Page label (right, below)
  if (pageLabel) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...C.white);
    doc.text(pageLabel, PW - MR, 52, { align: "right" });
  }
}

// ============================================================
// Footer (page number + date)
// ============================================================
function drawFooter(doc, pageNum, total) {
  const y = PH - 22;
  doc.setFillColor(...C.border);
  doc.rect(0, y - 6, PW, 1, "F");
  doc.setTextColor(...C.paperDim);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const d = new Date();
  const dateStr = d.toLocaleDateString("en-GB", { year: 'numeric', month: 'short', day: 'numeric' });
  doc.text(`Neo Nova - Report  •  ${dateStr}`, ML, y + 8);
  doc.text(`${pageNum} / ${total}`, PW - MR, y + 8, { align: "right" });
}

// ============================================================
// Small coloured status pill (text only, drawn inline)
// ============================================================
function drawStatusPill(doc, value, x, y, w = 90) {
  const color = statusColor(value);
  const label = statusAr(value);
  const h = 18;

  // Outline pill: light stroke and transparent fill for printer-friendly output
  doc.setLineWidth(0.8);
  doc.setDrawColor(...color);
  doc.setFillColor(...C.panel);
  doc.roundedRect(x, y - 12, w, h, 4, 4, "S");

  // Text (colored)
  doc.setTextColor(...color);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(label, x + w / 2, y, { align: "center" });
}

// ============================================================
// Section title line
// ============================================================
function sectionTitle(doc, text, y) {
  // Decorative line + left accent
  doc.setFillColor(...C.border);
  doc.rect(ML, y, CW, 1, "F");
  doc.setFillColor(...C.amber);
  doc.rect(ML, y, 4, 18, "F");

  doc.setTextColor(...C.paper);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(text, ML + 14, y + 14);
  return y + 28;
}

// ============================================================
// Load an image URL as base64 data-URL (for embedding photos)
// ============================================================
async function loadImageAsDataUrl(url) {
  try {
    const resp = await fetch(url);
    const blob = await resp.blob();
    return await new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload  = () => res(reader.result);
      reader.onerror = rej;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ============================================================
// EXPORT: Single unit PDF
// ============================================================
export async function exportUnitPdf(zone, unit) {
  const doc = newDoc();

  // -- Page 1 header --
  drawHeader(doc, zone, `Unit ${unit.unit_code}`);

  let y = 80;

  // Unit title
  doc.setFillColor(...C.bg);
  doc.rect(ML, y, CW, 40, "F");
  doc.setTextColor(...C.amber);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(`Unit ${unit.unit_code}`, ML + 14, y + 28);
  y += 56;

  // Engineer info
  if (zone.engineer) {
    doc.setTextColor(...C.paperDim);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Engineer: ${zone.engineer}`, ML, y);
    y += 18;
  }

  // -- Installation status --
  y = sectionTitle(doc, "Installation Status", y);

  const fields = [
    { label: "FortiGate",    key: "fortigate_status" },
    { label: "FortiSwitch",  key: "fortiswitch_status" },
    { label: "Access Points", key: "ap_status" },
    { label: "AP Patch Panel Ports", key: "ap_patch_status" },
    { label: "Overall Status", key: "overall_status" },
  ];

  const colW  = CW / 2;
  const rowH  = 36;

  fields.forEach((f, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const fx  = ML + col * colW;
    const fy  = y + row * rowH;

    // Cell background alternating
    doc.setFillColor(...(row % 2 === 0 ? C.bg : C.panel));
    doc.rect(fx, fy, colW, rowH, "F");

    // Field label
    doc.setTextColor(...C.paperDim);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(f.label, fx + 10, fy + 13);

    // Status pill
    drawStatusPill(doc, unit[f.key], fx + 10, fy + 28, colW - 20);
  });

  y += Math.ceil(fields.length / 2) * rowH + 24;

  // -- Notes --
  if (unit.notes) {
    y = sectionTitle(doc, "Notes", y);
    doc.setFillColor(...C.panel);
    doc.rect(ML, y, CW, 40, "F");
    doc.setTextColor(...C.paper);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(unit.notes, CW - 20);
    doc.text(lines, ML + 10, y + 14);
    y += Math.max(40, lines.length * 13 + 14) + 20;
  }

  // -- Photos --
  const photos = unit.photos || [];
  if (photos.length) {
    y = sectionTitle(doc, `Photos (${photos.length})`, y);

    const thumbW = 130;
    const thumbH = 100;
    const gap    = 12;
    const perRow = Math.floor(CW / (thumbW + gap));
    let   col    = 0;

    for (const photo of photos) {
      if (y + thumbH > PH - 60) {
        drawFooter(doc, doc.internal.getCurrentPageInfo().pageNumber, "...");
        doc.addPage();
        drawHeader(doc, zone, `Unit ${unit.unit_code} - Photos`);
        y = 80;
        col = 0;
      }

      const px = ML + col * (thumbW + gap);
      const dataUrl = await loadImageAsDataUrl(photo.url);
      if (dataUrl) {
        try {
          doc.addImage(dataUrl, "JPEG", px, y, thumbW, thumbH);
        } catch {
          doc.setFillColor(...C.panel);
          doc.rect(px, y, thumbW, thumbH, "F");
          doc.setTextColor(...C.paperDim);
          doc.setFontSize(8);
          doc.text("Unable to load image", px + thumbW / 2, y + thumbH / 2, { align: "center" });
        }
      } else {
        doc.setFillColor(...C.panel);
        doc.rect(px, y, thumbW, thumbH, "F");
      }

      col++;
      if (col >= perRow) { col = 0; y += thumbH + gap; }
    }
    if (col > 0) y += thumbH + gap;
  }

  // Finalize all footers
  const total = doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    drawFooter(doc, p, total);
  }

  doc.save(`NeoNova_Zone${zone.code}_Unit${unit.unit_code}.pdf`);
}

// ============================================================
// EXPORT: Full zone PDF (zone cover + detailed unit pages)
// ============================================================
export async function exportZonePdf(zone, units) {
  const doc = newDoc();

  // Cover page for zone
  drawHeader(doc, zone, `Zone ${zone.code} Report`);
  let y = 92;

  doc.setTextColor(...C.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(`Zone ${zone.code}`, ML + 10, y);
  y += 28;

  if (zone.label) {
    doc.setTextColor(...C.paper);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const labelLines = doc.splitTextToSize(zone.label, CW - 20);
    doc.text(labelLines, ML + 10, y);
    y += labelLines.length * 12 + 6;
  }

  if (zone.engineer) {
    doc.setTextColor(...C.paperDim);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Engineer: ${zone.engineer}`, ML + 10, y);
    y += 16;
  }

  doc.setTextColor(...C.paperDim);
  doc.setFontSize(9);
  doc.text(`Export date: ${new Date().toLocaleDateString("en-GB")}`, ML + 10, y);
  y += 24;

  // Zone summary metrics
  const totalUnits = units.length;
  const doneCount = units.filter(u => u.overall_status === "done").length;
  const inProgressCount = units.filter(u => u.overall_status === "in_progress").length;
  const issueCount = units.filter(u => u.overall_status === "issue").length;
  const blockedCount = units.filter(u => u.overall_status === "blocked").length;
  const completedPct = totalUnits ? Math.round((doneCount / totalUnits) * 100) : 0;

  const summaryItems = [
    { label: "Units", value: totalUnits, color: C.white },
    { label: "Done", value: doneCount, color: C.green },
    { label: "In Progress", value: inProgressCount, color: C.amber },
    { label: "Issues", value: issueCount, color: C.red },
    { label: "Blocked", value: blockedCount, color: C.yellow },
    { label: "Completed", value: `${completedPct}%`, color: C.green },
  ];

  const summaryW = (CW - 20) / summaryItems.length;
  summaryItems.forEach((item, idx) => {
    const sx = ML + idx * summaryW;
    doc.setFillColor(...C.panel);
    doc.roundedRect(sx, y, summaryW - 6, 46, 6, 6, "F");
    doc.setTextColor(...item.color);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(String(item.value), sx + (summaryW - 6) / 2, y + 20, { align: "center" });
    doc.setTextColor(...C.paperDim);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(item.label, sx + (summaryW - 6) / 2, y + 36, { align: "center" });
  });
  y += 72;

  // Unit list line
  y = sectionTitle(doc, `Units (${totalUnits})`, y);
  doc.setTextColor(...C.paperDim);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const unitLines = doc.splitTextToSize(units.map(u => u.unit_code).join(", "), CW - 20);
  doc.text(unitLines, ML + 10, y + 10);
  y += unitLines.length * 12 + 20;

  // Per-unit detailed pages
  for (const unit of units) {
    doc.addPage();
    drawHeader(doc, zone, `Unit ${unit.unit_code}`);
    y = 90;

    doc.setTextColor(...C.header);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(`Unit ${unit.unit_code}`, ML + 10, y);
    y += 28;

    const statusFields = [
      { label: "FortiGate", val: unit.fortigate_status },
      { label: "FortiSwitch", val: unit.fortiswitch_status },
      { label: "Access Points", val: unit.ap_status },
      { label: "AP Patch", val: unit.ap_patch_status },
      { label: "Overall Status", val: unit.overall_status },
    ];

    const fieldW = (CW - 20) / 2;
    const fieldH = 42;
    statusFields.forEach((field, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const fx = ML + col * (fieldW + 10);
      const fy = y + row * (fieldH + 18);

      doc.setFillColor(...C.panel);
      doc.roundedRect(fx, fy, fieldW, fieldH, 8, 8, "F");
      doc.setTextColor(...C.header);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(field.label, fx + 10, fy + 14);
      drawStatusPill(doc, field.val, fx + 10, fy + 32, fieldW - 20);
    });
    y += Math.ceil(statusFields.length / 2) * (fieldH + 18);

    if (unit.notes) {
      y += 6;
      doc.setTextColor(...C.header);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Notes:", ML + 10, y);
      y += 14;
      doc.setTextColor(...C.paperDim);
      doc.setFont("helvetica", "normal");
      const noteLines = doc.splitTextToSize(unit.notes, CW - 20);
      doc.text(noteLines, ML + 10, y);
      y += noteLines.length * 12 + 10;
    }

    const photos = unit.photos || [];
    if (photos.length) {
      y += 6;
      doc.setTextColor(...C.header);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`Photos (${photos.length})`, ML + 10, y);
      y += 14;

      const thumbW = 110;
      const thumbH = 82;
      const gap = 10;
      const perRow = Math.max(1, Math.floor((CW + gap) / (thumbW + gap)));
      let col = 0;

      for (const photo of photos) {
        if (y + thumbH > PH - 84) {
          drawFooter(doc, doc.internal.getCurrentPageInfo().pageNumber, "...");
          doc.addPage();
          drawHeader(doc, zone, `Unit ${unit.unit_code} - Photos`);
          y = 90;
          col = 0;
        }
        const px = ML + col * (thumbW + gap);
        const dataUrl = await loadImageAsDataUrl(photo.url);
        if (dataUrl) {
          try {
            doc.addImage(dataUrl, "JPEG", px, y, thumbW, thumbH);
          } catch {
            doc.setFillColor(...C.panel);
            doc.rect(px, y, thumbW, thumbH, "F");
          }
        } else {
          doc.setFillColor(...C.panel);
          doc.rect(px, y, thumbW, thumbH, "F");
        }
        col++;
        if (col >= perRow) { col = 0; y += thumbH + gap; }
      }
      if (col > 0) y += thumbH + gap;
    }
  }

  const totalPages = doc.internal.getNumberOfPages();
  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    drawFooter(doc, page, totalPages);
  }

  doc.save(`NeoNova_Zone${zone.code}_Details.pdf`);
}

// ============================================================
// EXPORT: All zones PDF (multi-zone report)
// zones: [{ id, code, label, engineer, units: [...] }, ...]
// ============================================================
export async function exportAllZonesPdf(zones) {
  const doc = newDoc();
  let pageCount = 0;

  for (const zone of zones) {
    // Summary page per zone
    if (pageCount > 0) doc.addPage();
    pageCount = doc.internal.getNumberOfPages();
    drawHeader(doc, zone, `Full Zone Report`);
    let y = 80;

    // Zone meta
    doc.setFillColor(...C.bg);
    doc.rect(ML, y, CW, 52, "F");
    doc.setFillColor(...C.amber);
    doc.rect(ML, y, 3, 52, "F");
    doc.setTextColor(...C.amber);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(`Zone ${zone.code}`, ML + 14, y + 22);
    if (zone.label) {
      doc.setTextColor(...C.paper);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(zone.label, ML + 14, y + 38);
    }
    if (zone.engineer) {
      doc.setTextColor(...C.paperDim);
      doc.setFontSize(9);
      doc.text(`Engineer: ${zone.engineer}`, PW - MR, y + 22, { align: "right" });
    }
    y += 68;

    // Units table header
    y = sectionTitle(doc, "Units List", y);
    const cols = [60,90,90,90,90,90, CW - 60 - 90 - 90 - 90 - 90 - 90];
    let cx = ML;
    doc.setFillColor(...C.border);
    doc.rect(ML, y, CW, 20, "F");
    const headers = ["Unit","FortiGate","FortiSwitch","APs","AP Patch","Status","Notes"];
    headers.forEach((h, i) => { doc.setTextColor(...C.paperDim); doc.setFont("helvetica","bold"); doc.setFontSize(8.5); doc.text(h, cx + 5, y + 13); cx += cols[i]; });
    y += 20;

    const units = zone.units || [];
    units.forEach((u, idx) => {
      if (y > PH - 80) { drawFooter(doc, doc.internal.getCurrentPageInfo().pageNumber, "…"); doc.addPage(); y = 80; }
      doc.setFillColor(...(idx % 2 === 0 ? C.bg : C.panel));
      doc.rect(ML, y, CW, 22, "F");
      const vals = [u.unit_code, statusAr(u.fortigate_status), statusAr(u.fortiswitch_status), statusAr(u.ap_status), (u.ap_patch_status||"—"), statusAr(u.overall_status), (u.notes||"—").substring(0,40)];
      cx = ML;
      vals.forEach((v, vi) => { doc.setTextColor(...(vi===0?C.amber:C.paperDim)); doc.setFont("helvetica", vi===0?"bold":"normal"); doc.setFontSize(8.5); doc.text(String(v), cx + 5, y + 14); cx += cols[vi]; });
      y += 22;
    });
  }

  // Finalize footers
  const total = doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p++) { doc.setPage(p); drawFooter(doc, p, total); }

  doc.save(`NeoNova_All_Zones_Report.pdf`);
}
