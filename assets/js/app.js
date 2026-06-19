import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
import { STATUS_OPTIONS, badge, escapeHtml, fmtDateTime, fmtDate, fieldArabicName, showToast } from "./status.js";
import { exportZonePdf, exportUnitPdf } from "./pdf.js";

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper: get a usable URL for a storage object. Prefer signed URL (works for private buckets),
// fall back to public URL when signed URL fails.
async function getPhotoUrl(storagePath) {
  try {
    const { data, error } = await sb.storage.from("unit-photos").createSignedUrl(storagePath, 60);
    if (error || !data?.signedUrl) {
      return sb.storage.from("unit-photos").getPublicUrl(storagePath).data.publicUrl;
    }
    return data.signedUrl;
  } catch (e) {
    return sb.storage.from("unit-photos").getPublicUrl(storagePath).data.publicUrl;
  }
}

// ----------------------------------------------------------
// App state
// ----------------------------------------------------------
const state = {
  user: null,
  zones: [],
  currentZone: null,
  units: [],
  currentUnit: null,
  photos: [],
  history: [],
};

// ----------------------------------------------------------
// Boot
// ----------------------------------------------------------
async function boot() {
  const { data } = await sb.auth.getSession();
  if (data.session) {
    state.user = data.session.user;
    showApp();
  } else {
    showLogin();
  }
}

sb.auth.onAuthStateChange((_event, session) => {
  state.user = session?.user || null;
});

function showLogin() {
  document.getElementById("loginScreen").hidden = false;
  document.getElementById("app").hidden = true;
}

function showApp() {
  document.getElementById("loginScreen").hidden = true;
  document.getElementById("app").hidden = false;
  document.getElementById("userPill").textContent = state.user?.email || "";
  navigateZones();
}

// ----------------------------------------------------------
// Auth
// ----------------------------------------------------------
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const errEl = document.getElementById("loginError");
  const btn = document.getElementById("loginBtn");
  errEl.hidden = true;
  btn.disabled = true;
  btn.querySelector(".btn-label").textContent = "Signing in...";

  const { data, error } = await sb.auth.signInWithPassword({ email, password });

  btn.disabled = false;
  btn.querySelector(".btn-label").textContent = "Sign In";

  if (error) {
    errEl.textContent = "Login failed. Please try again.";
    errEl.hidden = false;
    return;
  }
  state.user = data.user;
  showApp();
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await sb.auth.signOut();
  state.user = null;
  showLogin();
});

// ----------------------------------------------------------
// Routing helpers
// ----------------------------------------------------------
function setView(name) {
  document.querySelectorAll(".view").forEach(v => v.hidden = true);
  document.getElementById(`view-${name}`).hidden = false;
}

function setCrumbs(parts) {
  const el = document.getElementById("crumbs");
  el.innerHTML = parts.map((p, i) => {
    if (i === parts.length - 1) return `<span class="crumb-current">${escapeHtml(p.label)}</span>`;
    return `<a data-action="${p.action}">${escapeHtml(p.label)}</a><span class="crumb-sep">/</span>`;
  }).join("");
  el.querySelectorAll("a[data-action]").forEach(a => {
    a.addEventListener("click", () => {
      const action = a.getAttribute("data-action");
      if (action === "zones") navigateZones();
      if (action === "units") navigateUnits(state.currentZone.id);
    });
  });
}

document.querySelector(".topbar-brand").addEventListener("click", navigateZones);

// ----------------------------------------------------------
// ZONES VIEW
// ----------------------------------------------------------
async function navigateZones() {
  setView("zones");
  setCrumbs([{ label: "Zones" }]);
  await loadZones();
}

async function loadZones() {
  const grid = document.getElementById("zonesGrid");
  grid.innerHTML = `<div class="empty-state">Loading...</div>`;

  const { data: zones, error } = await sb.from("zones").select("*").order("code");
  if (error) { showToast("Error loading zones", true); return; }

  const { data: units } = await sb.from("units").select("zone_id, overall_status");

  state.zones = zones || [];
  grid.innerHTML = "";

  if (!zones || zones.length === 0) {
    grid.innerHTML = `<div class="empty-state">No zones yet. Click "+ New Zone" to add your first zone.</div>`;
    return;
  }

  zones.forEach(zone => {
    const zoneUnits = (units || []).filter(u => u.zone_id === zone.id);
    const total = zoneUnits.length;
    const done = zoneUnits.filter(u => u.overall_status === "done").length;
    const pct = total ? Math.round((done / total) * 100) : 0;

    const card = document.createElement("div");
    card.className = "zone-card";
    card.innerHTML = `
      <div class="zone-card-code">${escapeHtml(zone.code)}</div>
      <div class="zone-card-label">${escapeHtml(zone.label || "")}${zone.engineer ? " · " + escapeHtml(zone.engineer) : ""}</div>
      <div class="zone-card-progress"><div class="zone-card-progress-fill" style="width:${pct}%"></div></div>
      <div class="zone-card-meta">
        <span>${done}/${total} units</span>
        <span>${pct}%</span>
      </div>
    `;
    card.addEventListener("click", () => navigateUnits(zone.id));
    grid.appendChild(card);
  });
}

document.getElementById("addZoneBtn").addEventListener("click", () => {
  openModal(`
    <h3>New Zone</h3>
    <p class="modal-error" id="modalErr" hidden></p>
    <label>Zone Code (e.g. R2)
      <input type="text" id="m_code" placeholder="R2" required>
    </label>
    <label>Zone Label (optional)
      <input type="text" id="m_label" placeholder="Zone R2">
    </label>
    <label>Engineer
      <input type="text" id="m_engineer" placeholder="Engineer name">
    </label>
    <div class="modal-actions">
      <button class="btn-ghost" id="m_cancel">Cancel</button>
      <button class="btn-primary" id="m_save">Add</button>
    </div>
  `);
  document.getElementById("m_cancel").addEventListener("click", closeModal);
  document.getElementById("m_save").addEventListener("click", async () => {
    const code = document.getElementById("m_code").value.trim();
    const label = document.getElementById("m_label").value.trim();
    const engineer = document.getElementById("m_engineer").value.trim();
    const errEl = document.getElementById("modalErr");
    if (!code) { errEl.textContent = "Zone code is required"; errEl.hidden = false; return; }

    const { error } = await sb.from("zones").insert({
      code, label: label || `Zone ${code}`, engineer: engineer || null,
    });
    if (error) {
      errEl.textContent = error.message.includes("duplicate") ? "This code is already in use" : "An error occurred, please try again";
      errEl.hidden = false;
      return;
    }
    closeModal();
    showToast("Zone added successfully");
    loadZones();
  });
});

// ----------------------------------------------------------
// UNITS VIEW
// ----------------------------------------------------------
async function navigateUnits(zoneId) {
  setView("units");
  const { data: zone } = await sb.from("zones").select("*").eq("id", zoneId).single();
  if (!zone) { navigateZones(); return; }
  state.currentZone = zone;

  document.getElementById("zoneTitle").textContent = `Zone ${zone.code}`;
  document.getElementById("zoneEngLabel").textContent = zone.engineer ? `Engineer: ${zone.engineer}` : "Project";
  setCrumbs([{ label: "Zones", action: "zones" }, { label: `Zone ${zone.code}` }]);

  await loadUnits(zoneId);
}

async function loadUnits(zoneId) {
  const tbody = document.getElementById("unitsTableBody");
  tbody.innerHTML = `<tr><td colspan="9" class="notes-cell">Loading units...</td></tr>`;

  const { data: units, error } = await sb.from("units").select("*").eq("zone_id", zoneId).order("unit_code");
  if (error) { showToast("Error loading units", true); return; }

  const { data: photoCounts } = await sb.from("unit_photos").select("unit_id");
  const countMap = {};
  (photoCounts || []).forEach(p => countMap[p.unit_id] = (countMap[p.unit_id] || 0) + 1);

  state.units = units || [];
  renderStats(units || []);

  tbody.innerHTML = "";
  if (!units || units.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="notes-cell">No units in this zone yet.</td></tr>`;
    return;
  }

  units.forEach(u => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="unit-code-cell" data-open>${escapeHtml(u.unit_code)}</td>
      <td>${badge(u.fortigate_status)}</td>
      <td>${badge(u.fortiswitch_status)}</td>
      <td>${badge(u.ap_status)}</td>
      <td>${escapeHtml(u.ap_patch_status || "—")}</td>
      <td>${badge(u.overall_status)}</td>
      <td class="notes-cell">${escapeHtml(u.notes || "—")}</td>
      <td class="thumb-count">${countMap[u.id] || 0} 📷</td>
      <td><button class="row-open-btn" data-open>Open</button></td>
    `;    tr.querySelectorAll("[data-open]").forEach(el =>
      el.addEventListener("click", () => navigateUnitDetail(u.id))
    );
    tbody.appendChild(tr);
  });
}

function renderStats(units) {
  const total = units.length;
  const done = units.filter(u => u.overall_status === "done").length;
  const inProgress = units.filter(u => u.overall_status === "in_progress").length;
  const issue = units.filter(u => u.overall_status === "issue").length;
  const blocked = units.filter(u => u.overall_status === "blocked").length;

  const stats = [
    { label: "Total Units", val: total },
    { label: "Completed", val: done },
    { label: "In Progress", val: inProgress },
    { label: "Issue", val: issue },
    { label: "Blocked", val: blocked },
  ];
  document.getElementById("zoneStats").innerHTML = stats.map(s => `
    <div class="stat-box">
      <div class="stat-box-num">${s.val}</div>
      <div class="stat-box-label">${s.label}</div>
    </div>
  `).join("");
}

document.getElementById("addUnitBtn").addEventListener("click", () => {
  openModal(`
    <h3>New Unit</h3>
    <p class="modal-error" id="modalErr" hidden></p>
    <label>Unit Code (e.g. 17A)
      <input type="text" id="m_unitcode" placeholder="17A" required>
    </label>
    <div class="modal-actions">
      <button class="btn-ghost" id="m_cancel">Cancel</button>
      <button class="btn-primary" id="m_save">Add</button>
    </div>
  `);
  document.getElementById("m_cancel").addEventListener("click", closeModal);
  document.getElementById("m_save").addEventListener("click", async () => {
    const code = document.getElementById("m_unitcode").value.trim();
    const errEl = document.getElementById("modalErr");
    if (!code) { errEl.textContent = "Unit code is required"; errEl.hidden = false; return; }

    const { error } = await sb.from("units").insert({
      zone_id: state.currentZone.id, unit_code: code,
    });
    if (error) {
      errEl.textContent = error.message.includes("duplicate") ? "This code is already used in this zone" : "An error occurred, please try again";
      errEl.hidden = false;
      return;
    }
    closeModal();
    showToast("Unit added successfully");
    loadUnits(state.currentZone.id);
  });
});

document.getElementById("exportZonePdfBtn").addEventListener("click", async () => {
  showToast("Preparing PDF...");
  try {
    const fullUnits = await Promise.all(state.units.map(async u => {
      const { data: photos } = await sb.from("unit_photos").select("*").eq("unit_id", u.id).order("uploaded_at");
      const photosWithUrl = await Promise.all((photos || []).map(async p => ({
        ...p, url: await getPhotoUrl(p.storage_path),
      })));
      return { ...u, photos: photosWithUrl };
    }));
    await exportZonePdf(state.currentZone, fullUnits);
    showToast("PDF downloaded");
  } catch (e) {
    console.error(e);
    showToast("Error creating PDF", true);
  }
});

// ----------------------------------------------------------
// UNIT DETAIL VIEW
// ----------------------------------------------------------
function populateStatusSelect(selectEl, value) {
  selectEl.innerHTML = STATUS_OPTIONS.map(o =>
    `<option value="${o.value}" ${o.value === value ? "selected" : ""}>${o.label}</option>`
  ).join("");
}

async function navigateUnitDetail(unitId) {
  setView("unit");
  const { data: unit, error } = await sb.from("units").select("*").eq("id", unitId).single();
  if (error || !unit) { navigateUnits(state.currentZone.id); return; }
  state.currentUnit = unit;

  document.getElementById("unitTitle").textContent = `Unit ${unit.unit_code}`;
  document.getElementById("unitZoneLabel").textContent = `Zone ${state.currentZone.code}`;
  setCrumbs([
    { label: "Zones", action: "zones" },
    { label: `Zone ${state.currentZone.code}`, action: "units" },
    { label: `Unit ${unit.unit_code}` },
  ]);

  populateStatusSelect(document.getElementById("f_fortigate"), unit.fortigate_status);
  populateStatusSelect(document.getElementById("f_fortiswitch"), unit.fortiswitch_status);
  populateStatusSelect(document.getElementById("f_ap"), unit.ap_status);
  // AP patch ports is a free-text numeric field (manual entry)
  const apPatchEl = document.getElementById("f_ap_patch");
  if (apPatchEl) apPatchEl.value = unit.ap_patch_status || "";
  populateStatusSelect(document.getElementById("f_overall"), unit.overall_status);
  document.getElementById("f_notes").value = unit.notes || "";
  document.getElementById("saveIndicator").textContent = "";

  await loadPhotos(unitId);
  await loadHistory(unitId);
}

document.getElementById("saveUnitBtn").addEventListener("click", async () => {
  const unit = state.currentUnit;
  // Validate AP Patch: must be 4 or 5 ports in format "Port X, Port Y, ..."
  const apPatchRaw = document.getElementById("f_ap_patch").value.trim();
  if (apPatchRaw) {
    const apRe = /^Port \d{1,5}(, Port \d{1,5}){3,4}$/;
    if (!apRe.test(apPatchRaw)) {
      showToast("AP Patch must be 4 or 5 ports (e.g. Port 12, Port 13, Port 14, Port 15)", true);
      return;
    }
  }

  const updates = {
    fortigate_status: document.getElementById("f_fortigate").value,
    fortiswitch_status: document.getElementById("f_fortiswitch").value,
    ap_status: document.getElementById("f_ap").value,
    ap_patch_status: apPatchRaw || null,
    overall_status: document.getElementById("f_overall").value,
    notes: document.getElementById("f_notes").value.trim() || null,
  };

  const changedFields = Object.keys(updates).filter(k => (unit[k] || null) !== (updates[k] || null));

  try {
    const { data: updated, error } = await sb.from("units").update(updates).eq("id", unit.id).select().single();
    if (error) {
      console.error("Save error:", error);
      showToast(`Save failed: ${error.message || JSON.stringify(error)}`, true);
      return;
    }

    if (changedFields.length) {
      const historyRows = changedFields.map(field => ({
        unit_id: unit.id,
        field,
        old_value: unit[field] || null,
        new_value: updates[field] || null,
      }));
      const { error: histErr } = await sb.from("status_history").insert(historyRows);
      if (histErr) console.error("History insert error:", histErr);
    }

    state.currentUnit = { ...unit, ...updates, ...(updated || {}) };
  } catch (err) {
    console.error("Unexpected save error:", err);
    showToast("Save failed: unexpected error", true);
    return;
  }
  document.getElementById("saveIndicator").textContent = "✓ Saved";
  setTimeout(() => document.getElementById("saveIndicator").textContent = "", 2500);
  loadHistory(unit.id);
});

document.getElementById("exportUnitPdfBtn").addEventListener("click", async () => {
  showToast("Preparing PDF...");
  try {
    const photosWithUrl = await Promise.all(state.photos.map(async p => ({
      ...p, url: await getPhotoUrl(p.storage_path),
    })));
    await exportUnitPdf(state.currentZone, { ...state.currentUnit, photos: photosWithUrl });
    showToast("PDF downloaded");
  } catch (e) {
    console.error(e);
    showToast("Error creating PDF", true);
  }
});

document.getElementById("deleteUnitBtn").addEventListener("click", async () => {
  const unit = state.currentUnit;
  if (!confirm(`Are you sure you want to delete Unit ${unit.unit_code}? This action cannot be undone.`)) return;
  
  showToast("Deleting unit...");
  try {
    // Delete all photos associated with this unit
    if (state.photos.length > 0) {
      const storagePaths = state.photos.map(p => p.storage_path);
      await sb.storage.from("unit-photos").remove(storagePaths);
      await sb.from("unit_photos").delete().eq("unit_id", unit.id);
    }
    
    // Delete status history
    await sb.from("status_history").delete().eq("unit_id", unit.id);
    
    // Delete the unit
    const { error } = await sb.from("units").delete().eq("id", unit.id);
    if (error) {
      console.error("Delete error:", error);
      showToast(`Delete failed: ${error.message}`, true);
      return;
    }
    
    showToast("Unit deleted successfully");
    // Navigate back to units list
    navigateUnits(state.currentZone.id);
  } catch (e) {
    console.error("Delete error:", e);
    showToast("Delete failed: unexpected error", true);
  }
});

// ----------------------------------------------------------
// PHOTOS
// ----------------------------------------------------------
async function loadPhotos(unitId) {
  const { data: photos } = await sb.from("unit_photos").select("*").eq("unit_id", unitId).order("uploaded_at");
  state.photos = photos || [];
  renderPhotos();
}

function renderPhotos() {
  const grid = document.getElementById("photosGrid");
  grid.innerHTML = "";
  state.photos.forEach(p => {
    const url = sb.storage.from("unit-photos").getPublicUrl(p.storage_path).data.publicUrl;
    const card = document.createElement("div");
    card.className = "photo-card";
    card.innerHTML = `<img src="${url}" loading="lazy" alt="Unit photo">
      <button class="photo-del" title="Delete" data-id="${p.id}" data-path="${p.storage_path}">×</button>`;
    card.querySelector("img").addEventListener("click", () => openLightbox(url));
    card.querySelector(".photo-del").addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm("Delete this photo?")) return;
      await sb.storage.from("unit-photos").remove([p.storage_path]);
      await sb.from("unit_photos").delete().eq("id", p.id);
      state.photos = state.photos.filter(x => x.id !== p.id);
      renderPhotos();
      showToast("Photo deleted");
    });
    grid.appendChild(card);
  });
}

function openLightbox(url) {
  openModal(`<img class="lightbox-img" src="${url}" alt="Preview">`);
}

const uploadZone = document.getElementById("uploadZone");
const photoInput = document.getElementById("photoInput");
uploadZone.addEventListener("click", () => photoInput.click());
uploadZone.addEventListener("dragover", e => { e.preventDefault(); uploadZone.classList.add("dragover"); });
uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("dragover"));
uploadZone.addEventListener("drop", e => {
  e.preventDefault();
  uploadZone.classList.remove("dragover");
  handleFiles(e.dataTransfer.files);
});
photoInput.addEventListener("change", () => {
  handleFiles(photoInput.files);
  photoInput.value = "";
});

async function handleFiles(fileList) {
  const files = Array.from(fileList).filter(f => f.type.startsWith("image/"));
  if (!files.length) return;
  const unit = state.currentUnit;
  const grid = document.getElementById("photosGrid");

  for (const file of files) {
    const placeholder = document.createElement("div");
    placeholder.className = "photo-card uploading";
    grid.appendChild(placeholder);

    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${state.currentZone.code}/${unit.unit_code}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await sb.storage.from("unit-photos").upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;

      const { data: row, error: insErr } = await sb.from("unit_photos")
        .insert({ unit_id: unit.id, storage_path: path })
        .select().single();
      if (insErr) throw insErr;

      state.photos.push(row);
      placeholder.remove();
      renderPhotos();
    } catch (err) {
      console.error(err);
      placeholder.remove();
      showToast("Failed to upload image: " + file.name, true);
    }
  }
  showToast("Images uploaded successfully");
}

// ----------------------------------------------------------
// HISTORY
// ----------------------------------------------------------
async function loadHistory(unitId) {
  const { data: hist } = await sb.from("status_history")
    .select("*").eq("unit_id", unitId).order("changed_at", { ascending: false }).limit(30);
  state.history = hist || [];
  const list = document.getElementById("historyList");
  if (!state.history.length) {
    list.innerHTML = `<div class="history-empty">No update history yet</div>`;
    return;
  }
  list.innerHTML = state.history.map(h => {
    const oldL = h.field === "notes" ? (h.old_value || "—") : (statusArabic(h.old_value));
    const newL = h.field === "notes" ? (h.new_value || "—") : (statusArabic(h.new_value));
    return `<div class="history-item">
      <span class="history-time">${fmtDateTime(h.changed_at)}</span>
      <span>${fieldArabicName(h.field)}: ${escapeHtml(oldL)} → ${escapeHtml(newL)}</span>
    </div>`;
  }).join("");
}

function statusArabic(v) {
  const map = { pending: "Not started", in_progress: "In progress", done: "Done", issue: "Issue", blocked: "Blocked" };
  return map[v] || v || "—";
}

// ----------------------------------------------------------
// MODAL HELPERS
// ----------------------------------------------------------
function openModal(html) {
  document.getElementById("modalBox").innerHTML = html;
  document.getElementById("modalOverlay").hidden = false;
}
function closeModal() {
  document.getElementById("modalOverlay").hidden = true;
  document.getElementById("modalBox").innerHTML = "";
}
document.getElementById("modalOverlay").addEventListener("click", (e) => {
  if (e.target.id === "modalOverlay") closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// ----------------------------------------------------------
boot();
