// ============================================================
// NEO NOVA — pdf.js
// PDF export helpers using jsPDF (loaded via CDN in index.html)
// Clean, organized layout with professional color scheme
// ============================================================

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
// Helpers for compact “Unit Row + Photos under it” layout
// ============================================================


function statusTextCompact(v) {
  return statusLabel(v);
}


function unitRowLine(unit) {
  // B) Status fields only + Overall (no notes/AP patch ports field expansion required)
  const fg = statusTextCompact(unit.fortigate_status);
  const fs = statusTextCompact(unit.fortiswitch_status);
  const ap = statusTextCompact(unit.ap_status);
  const overall = statusTextCompact(unit.overall_status);
  return `Unit ${unit.unit_code} | FG: ${fg} | FS: ${fs} | AP: ${ap} | Overall: ${overall}`;
}

function unitRowAltLine(unit) {
  // include AP patch panel ports if present
  const ports = unit.ap_patch_status ? String(unit.ap_patch_status) : "—";
  return `AP Patch Ports: ${ports}`;
}

// ============================================================
// EXPORT: Single Unit PDF (Compact row + photos under it)
// ============================================================
export async function exportUnitPdf(zone, unit) {

  const doc = newDoc();

  // Neutral header still okay, but keep body monochrome.
  drawHeader(doc, zone, `Unit ${unit.unit_code}`);

  let y = 85;

  // Unit “row”: status fields + overall (no extra notes)
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.text(unitRowLine(unit), ML, y);
  y += 14;

  // Optional second line: AP patch panel ports (kept as part of the row if present)
  if (unit.ap_patch_status) {
    doc.setTextColor(90, 90, 90);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.2);
    doc.text(unitRowAltLine(unit), ML, y);
    y += 12;
  }


  // Photos grid under the single line
  const photos = unit.photos || [];
  const hasPhotos = photos.length > 0;

  if (hasPhotos) {
    const thumbW = 160;
    const thumbH = 110;
    const gap = 10;
    const perRow = Math.max(1, Math.floor((CW + gap) / (thumbW + gap)));

    // subtle divider line
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(1);
    doc.line(ML, y + 6, PW - ML, y + 6);
    y += 18;

    let col = 0;
    for (const photo of photos) {
      // If the next thumbnail row doesn't fit, move to a new page
      if (y + thumbH > PH - 90 && (col > 0 || y !== 85)) {
        doc.addPage();
        drawHeader(doc, zone, `Unit ${unit.unit_code} - Photos`);
        y = 85;
        // keep it minimal: re-draw just Unit code line
        doc.setTextColor(30, 30, 30);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`Unit ${unit.unit_code}`, ML, y);
        y += 16;
        col = 0;
      }


      const px = ML + col * (thumbW + gap);
      const dataUrl = await loadImageAsDataUrl(photo.url);

      // Monochrome photo placeholder
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.8);
      doc.setFillColor(245, 245, 245);
      doc.rect(px, y, thumbW, thumbH, "F");
      doc.rect(px, y, thumbW, thumbH);

      if (dataUrl) {
        try {
          doc.addImage(dataUrl, "JPEG", px, y, thumbW, thumbH);
        } catch {
          // keep placeholder
        }
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
// EXPORT: Full Zone PDF (Clean: per-unit 1 line + photos only)
// ============================================================
export async function exportZonePdf(zone, units) {
  const doc = newDoc();

  // Simple cover page (monochrome)
  drawHeader(doc, zone, "Zone Report");
  let y = 95;

  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(`Zone ${zone.code}`, ML, y);
  y += 18;

  if (zone.label) {
    doc.setTextColor(90, 90, 90);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(zone.label, ML, y);
    y += 16;
  }

  if (zone.engineer) {
    doc.setTextColor(90, 90, 90);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Engineer: ${zone.engineer}`, ML, y);
    y += 16;
  }

  // Per-unit detail pages: 1 line summary + photos
  for (const unit of units) {
    doc.addPage();
    drawHeader(doc, zone, `Unit ${unit.unit_code}`);
    y = 85;

    // Unit “row”: status fields + overall (no notes)
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12.5);
    doc.text(unitRowLine(unit), ML, y);
    y += 14;

    // Optional second line: AP patch panel ports
    if (unit.ap_patch_status) {
      doc.setTextColor(90, 90, 90);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.2);
      doc.text(unitRowAltLine(unit), ML, y);
      y += 12;
    }


    const photos = unit.photos || [];

    if (photos.length) {
      const thumbW = 145;
      const thumbH = 100;
      const gap = 10;
      const perRow = Math.max(1, Math.floor((CW + gap) / (thumbW + gap)));

      // divider
      doc.setDrawColor(210, 210, 210);
      doc.setLineWidth(1);
      doc.line(ML, y + 6, PW - ML, y + 6);
      y += 18;

      let col = 0;
      for (const photo of photos) {
        // If the next thumbnail doesn't fit, move to a new page
        if (y + thumbH > PH - 90 && (col > 0 || y !== 85)) {
          doc.addPage();
          drawHeader(doc, zone, `Unit ${unit.unit_code} - Photos`);
          y = 85;

          // keep it minimal on continuation page
          doc.setTextColor(30, 30, 30);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.text(`Unit ${unit.unit_code}`, ML, y);
          y += 16;

          col = 0;
        }


        const px = ML + col * (thumbW + gap);
        const dataUrl = await loadImageAsDataUrl(photo.url);

        // monochrome placeholder box
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.8);
        doc.setFillColor(245, 245, 245);
        doc.rect(px, y, thumbW, thumbH, "F");
        doc.rect(px, y, thumbW, thumbH);

        if (dataUrl) {
          try {
            doc.addImage(dataUrl, "JPEG", px, y, thumbW, thumbH);
          } catch {
            // keep placeholder
          }
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
