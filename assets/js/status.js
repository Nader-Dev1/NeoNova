// ============================================================
// NEO NOVA — status.js
// Shared constants & helpers used across the app
// ============================================================

export const STATUS_OPTIONS = [
  { value: "pending",            label: "⏳ Pending",            badge: "badge-pending" },
  { value: "in_progress",        label: "🔄 In Progress",        badge: "badge-in_progress" },
  { value: "installation_done",  label: "✅ Installation Done",  badge: "badge-done" },
  { value: "config_done",        label: "✅ Configuration Done", badge: "badge-done" },
  { value: "done_issue",         label: "⚠️ Done — Issue",       badge: "badge-issue" },
  { value: "blocked",            label: "🚫 Blocked",            badge: "badge-blocked" },
];

// Alias used in some imports
export const STATUSES = STATUS_OPTIONS;

const STATUS_MAP = Object.fromEntries(STATUS_OPTIONS.map(o => [o.value, o]));

/**
 * Returns an HTML badge string for a given status value.
 */
export function badge(value) {
  const s = STATUS_MAP[value] || STATUS_MAP["pending"];
  return `<span class="badge ${s.badge}">${s.label}</span>`;
}

/**
 * Safely escapes HTML special characters to prevent XSS.
 */
export function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Formats an ISO date-time string into local date + time.
 */
export function fmtDateTime(isoString) {
  if (!isoString) return "—";
  try {
    return new Date(isoString).toLocaleString("en-GB", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

/**
 * Formats an ISO date-time string to date only.
 */
export function fmtDate(isoString) {
  if (!isoString) return "—";
  try {
    return new Date(isoString).toLocaleDateString("en-GB", {
      year: "numeric", month: "2-digit", day: "2-digit",
    });
  } catch {
    return isoString;
  }
}

/**
 * Returns the display name for a unit field.
 */
export function fieldArabicName(field) {
  const names = {
    fortigate_status:   "🔥 FortiGate",
    fortiswitch_status: "🔀 FortiSwitch",
    ap_status:          "📡 Access Points",
    ap_patch_status:    "🔌 AP Patch Panel Ports",
    overall_status:     "🏁 Overall Status",
    notes:              "📝 Notes",
  };
  return names[field] || field;
}

/**
 * Shows a toast notification at the bottom of the screen.
 */
let _toastTimer = null;
export function showToast(msg, isErr = false) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.className = "toast" + (isErr ? " error" : "");
  el.hidden = false;
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
}
