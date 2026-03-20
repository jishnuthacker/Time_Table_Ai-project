/* ═══════════════════════════════════════════════════════════════════
   Timetable GA — Frontend Logic
   ═══════════════════════════════════════════════════════════════════ */

const btnRun      = document.getElementById("btn-run");
const btnText     = btnRun.querySelector(".btn-primary__text");
const btnLoader   = btnRun.querySelector(".btn-primary__loader");
const resultsEl   = document.getElementById("results");

let lastData = null; // Store the last generated data for sharing

/* ── Initialization (Check for Shared Link) ────────────────────── */
window.addEventListener("DOMContentLoaded", () => {
  console.log("Timetable GA v1.1 script loaded.");
  const params = new URLSearchParams(window.location.search);
  const sharedData = params.get("data");
  if (sharedData) {
    try {
      const decoded = JSON.parse(atob(sharedData));
      lastData = decoded;
      render(decoded);
    } catch (err) {
      alert("Invalid or corrupted share link.");
    }
  }

  // Restore Google Sheets settings
  const folderId = localStorage.getItem("ga_folder_id");
  const spreadsheetId = localStorage.getItem("ga_spreadsheet_id");
  if (folderId && document.getElementById("input-folder-id")) {
    document.getElementById("input-folder-id").value = folderId;
  }
  if (spreadsheetId && document.getElementById("input-spreadsheet-id")) {
    document.getElementById("input-spreadsheet-id").value = spreadsheetId;
  }
});

/* ── Entry point ───────────────────────────────────────────────── */
btnRun.addEventListener("click", async () => {
  setLoading(true);
  try {
    const daysRaw = document.getElementById("input-days").value;
    const slotsRaw = document.getElementById("input-slots").value;
    const coursesRaw = document.getElementById("input-courses").value;
    const roomsRaw = document.getElementById("input-rooms").value;

    const days = daysRaw.split(",").map(s => s.trim()).filter(Boolean);
    const slots = slotsRaw.split(",").map(s => s.trim()).filter(Boolean);
    
    // Build time_slots
    const timeslots = [];
    days.forEach(d => {
      slots.forEach(s => timeslots.push(`${d} ${s}`));
    });

    // Parse courses lines
    const courses = coursesRaw.split("\n")
      .map(line => line.trim()).filter(Boolean)
      .map(line => {
        const parts = line.split(",").map(p => p.trim());
        return [parts[0], parts[1], parts[2], parts[3], parseInt(parts[4]) || 0];
      });

    // Parse rooms lines
    const rooms = roomsRaw.split("\n")
      .map(line => line.trim()).filter(Boolean)
      .map(line => {
        const parts = line.split(",").map(p => p.trim());
        return [parts[0], parseInt(parts[1]) || 0];
      });

    const payload = {
      courses, rooms, timeslots,
      population_size: 100, mutation_rate: 0.05, crossover_rate: 0.8,
      max_generations: 500, tournament_k: 3
    };

    const res = await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    const data = await res.json();
    lastData = data;
    render(data);
  } catch (err) {
    alert("Something went wrong: " + err.message);
  } finally {
    setLoading(false);
  }
});

/* ── Export to Google Sheets ─────────────────────────────────────── */
document.getElementById("btn-share").addEventListener("click", async () => {
  const table = document.getElementById("timetable");
  if (!table || table.rows.length === 0) return;

  const btn = document.getElementById("btn-share");
  const btnText = btn.querySelector(".btn-primary__text");
  const btnLoader = btn.querySelector(".btn-primary__loader");
  
  btn.disabled = true;
  btnLoader.hidden = false;
  btnText.textContent = "Creating Sheet...";

  try {
    const today = new Date();
    const dateStr = today.getDate().toString().padStart(2, '0') + "-" + 
                    (today.getMonth() + 1).toString().padStart(2, '0') + "-" + 
                    today.getFullYear();

    let csv_rows = [];
    
    // Custom headers from screenshot requirement
    const colCount = table.rows[0].cells.length;
    const pad = Math.max(0, Math.floor(colCount / 2) - 1);
    const padArr = new Array(pad).fill("");
    
    csv_rows.push([...padArr, "Pandit Deendayal Energy University"]);
    csv_rows.push([...padArr, "School of Technology"]);
    csv_rows.push([...padArr, "B.Tech - Information and Communication Technology"]);
    csv_rows.push([...padArr, "Semester : 6 (1)"]);
    csv_rows.push([`Even Semester 2026, w.e.f : January 5, 2026 [Printed : ${dateStr}]`]);
    csv_rows.push([]); // Empty row before grid

    for (let i = 0; i < table.rows.length; i++) {
      let row = [], cols = table.rows[i].querySelectorAll("td, th");
      for (let j = 0; j < cols.length; j++) {
        let data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, " ");
        row.push(data);
      }
      csv_rows.push(row);
    }

    function extractId(val) {
      if (!val) return null;
      // Extract ID from URL if necessary
      // Spreadsheet URL: /d/ID/
      // Folder URL: /folders/ID
      const sMatch = val.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (sMatch) return sMatch[1];
      const fMatch = val.match(/\/folders\/([a-zA-Z0-9-_]+)/);
      if (fMatch) return fMatch[1];
      return val.trim();
    }

    const folder_id = extractId(document.getElementById("input-folder-id")?.value);
    const spreadsheet_id = extractId(document.getElementById("input-spreadsheet-id")?.value);

    // Save to localStorage
    if (folder_id) localStorage.setItem("ga_folder_id", folder_id);
    if (spreadsheet_id) localStorage.setItem("ga_spreadsheet_id", spreadsheet_id);

    const payload = { 
      rows: csv_rows,
      folder_id,
      spreadsheet_id
    };

    const res = await fetch("/api/export_google_sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    let errorMsg = `Server error ${res.status}`;
    if (!res.ok) {
      try {
        const errorData = await res.json();
        errorMsg = errorData.error || errorMsg;
      } catch (e) {
        // Not JSON, just use default msg
      }
      throw new Error(errorMsg);
    }
    
    const data = await res.json();
    
    if (data.url) {
      // Copy to clipboard
      navigator.clipboard.writeText(data.url).then(() => {
        btnText.textContent = "✅ Link Copied!";
        setTimeout(() => {
           btnText.textContent = "🌐 Create Google Sheet";
           btn.disabled = false;
        }, 3000);
      }).catch(err => {
        alert("Success! Spreadsheed created here:\n\n" + data.url);
        btnText.textContent = "🌐 Create Google Sheet";
        btn.disabled = false;
      });
      // Optionally open in new tab
      window.open(data.url, '_blank');
    }
    
  } catch(e) {
    alert("Error creating Google Sheet: " + e.message + "\n\nMake sure credentials.json is present in the project folder!");
    btnText.textContent = "🌐 Create Google Sheet";
    btn.disabled = false;
  } finally {
    btnLoader.hidden = true;
  }
});

/* ── Share via Link (Base64) ────────────────────────────────────── */
document.getElementById("btn-share-link").addEventListener("click", () => {
  if (!lastData) {
    alert("Please generate a timetable first!");
    return;
  }
  try {
    const encoded = btoa(JSON.stringify(lastData));
    const url = new URL(window.location.href);
    url.searchParams.set("data", encoded);
    
    navigator.clipboard.writeText(url.toString()).then(() => {
      const btn = document.getElementById("btn-share-link");
      const origText = btn.innerHTML;
      btn.innerHTML = "✅ Link Copied!";
      setTimeout(() => btn.innerHTML = origText, 2500);
    }).catch(err => {
      alert("Link generated:\n\n" + url.toString());
    });
  } catch(e) {
    alert("Error generating share link: The schedule might be too large.");
  }
});

/* ── Export to CSV ─────────────────────────────────────────────── */
document.getElementById("btn-export").addEventListener("click", () => {
  const table = document.getElementById("timetable");
  if (!table || table.rows.length === 0) return;

  const today = new Date();
  const dateStr = today.getDate().toString().padStart(2, '0') + "-" + 
                  (today.getMonth() + 1).toString().padStart(2, '0') + "-" + 
                  today.getFullYear();

  let csv = [];
  
  // Custom headers from screenshot requirement
  const colCount = table.rows[0].cells.length;
  const pad = Math.max(0, Math.floor(colCount / 2) - 1);
  const padStr = ",".repeat(pad);
  
  csv.push(padStr + '"Pandit Deendayal Energy University"');
  csv.push(padStr + '"School of Technology"');
  csv.push(padStr + '"B.Tech - Information and Communication Technology"');
  csv.push(padStr + '"Semester : 6 (1)"');
  csv.push(`"Even Semester 2026, w.e.f : January 5, 2026 [Printed : ${dateStr}]"`);

  for (let i = 0; i < table.rows.length; i++) {
    let row = [], cols = table.rows[i].querySelectorAll("td, th");
    for (let j = 0; j < cols.length; j++) {
      let data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, " ");
      data = data.replace(/"/g, '""');
      row.push('"' + data + '"');
    }
    csv.push(row.join(","));
  }
  
  // Instead of Blob, try a direct Data URI which bypasses Blob ID naming issues
  const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csv.join("\n"));
  
  const link = document.createElement("a");
  link.setAttribute("href", csvContent);
  link.setAttribute("download", "timetable.csv");
  document.body.appendChild(link);
  
  link.click();
  document.body.removeChild(link);
});

function setLoading(on) {
  btnRun.disabled        = on;
  btnText.textContent    = on ? "Running GA…" : "Generate Timetable";
  btnLoader.hidden       = !on;
}

/* ── Master render ─────────────────────────────────────────────── */
function render(data) {
  resultsEl.hidden = false;
  renderStats(data);
  renderGrid(data);
  renderDetail(data.schedule);
  renderChart(data.fitness_history);
  renderConfig(data.config);
  resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ── Stats ─────────────────────────────────────────────────────── */
function renderStats(d) {
  setText("stat-gen",        d.generations_run);
  setText("stat-violations", d.violations);
  setText("stat-courses",    d.config.num_courses);

  const statusEl = document.querySelector("#stat-status .stat-card__value");
  if (d.violations === 0) {
    statusEl.textContent = "✅ Perfect";
    statusEl.style.color = "var(--success)";
  } else {
    statusEl.textContent = "⚠️ " + d.violations + " left";
    statusEl.style.color = "var(--danger)";
  }
}
function setText(id, val) {
  document.querySelector(`#${id} .stat-card__value`).textContent = val;
}

/* ── Timetable grid ────────────────────────────────────────────── */
function renderGrid(data) {
  const table = document.getElementById("timetable");
  table.innerHTML = "";

  // Extract days and slots from the DOM to use as rows and columns
  const daysRaw = document.getElementById("input-days").value;
  const slotsRaw = document.getElementById("input-slots").value;
  const days = daysRaw.split(",").map(s => s.trim()).filter(Boolean);
  const slots = slotsRaw.split(",").map(s => s.trim()).filter(Boolean);

  // Header
  const thead = table.createTHead();
  const hRow  = thead.insertRow();
  const corner = hRow.insertCell();
  corner.textContent = "Day";
  corner.className = "room-label";
  
  slots.forEach(ts => {
    const th = document.createElement("th");
    th.textContent = ts;
    hRow.appendChild(th);
  });

  // Body
  const tbody = table.createTBody();
  days.forEach(day => {
    const tr   = tbody.insertRow();
    const labelTd = tr.insertCell();
    labelTd.textContent = day;
    labelTd.className   = "room-label";

    slots.forEach(slot => {
      const td = tr.insertCell();
      const timeStr = `${day} ${slot}`;
      
      // Find all courses scheduled at this EXACT time_slot
      const coursesAtTime = data.schedule.filter(s => s.timeslot === timeStr);
      
      if (coursesAtTime.length === 0) {
        td.innerHTML = '<span class="cell-empty">—</span>';
      } else {
        const html = coursesAtTime.map(c => 
          `<div class="chip" style="margin-bottom: 4px;">${c.course} (${c.room}), ${c.professor} <span style="font-size: 0.85em; opacity: 0.8; display: block;">${c.branch} - ${c.division}</span></div>`
        ).join("");
        td.innerHTML = html;
      }
    });
  });
}

/* ── Schedule detail ───────────────────────────────────────────── */
function renderDetail(schedule) {
  const tbody = document.querySelector("#schedule-detail tbody");
  tbody.innerHTML = "";
  schedule.forEach(s => {
    const tr = document.createElement("tr");
    [s.course, s.professor, s.branch, s.division, s.room, s.timeslot,
     `${s.capacity} / ${s.room_cap}`].forEach(val => {
      const td = document.createElement("td");
      td.textContent = val;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

/* ── Fitness convergence chart (pure canvas, no library) ──────── */
function renderChart(history) {
  const canvas = document.getElementById("chart");
  const ctx    = canvas.getContext("2d");

  // High-DPI
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width  = rect.width  * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const W = rect.width;
  const H = rect.height;

  const violations = history.map(f => -f);
  const maxV       = Math.max(...violations, 1);
  const pad = { top: 24, right: 24, bottom: 40, left: 52 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top  - pad.bottom;

  function x(i) { return pad.left + (i / (violations.length - 1)) * plotW; }
  function y(v) { return pad.top + plotH - (v / maxV) * plotH; }

  // Clear
  ctx.clearRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth   = 1;
  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const yy = pad.top + (i / yTicks) * plotH;
    ctx.beginPath(); ctx.moveTo(pad.left, yy); ctx.lineTo(W - pad.right, yy); ctx.stroke();
  }

  // Fill area
  ctx.beginPath();
  ctx.moveTo(x(0), y(0));
  violations.forEach((v, i) => ctx.lineTo(x(i), y(v)));
  ctx.lineTo(x(violations.length - 1), y(0));
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + plotH);
  grad.addColorStop(0, "rgba(108,92,231,0.35)");
  grad.addColorStop(1, "rgba(108,92,231,0.02)");
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  violations.forEach((v, i) => {
    if (i === 0) ctx.moveTo(x(i), y(v));
    else         ctx.lineTo(x(i), y(v));
  });
  ctx.strokeStyle = "#6c5ce7";
  ctx.lineWidth   = 2.5;
  ctx.lineJoin    = "round";
  ctx.stroke();

  // Axes labels
  ctx.fillStyle = "#8891a4";
  ctx.font      = "12px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Generation", W / 2, H - 4);

  ctx.save();
  ctx.translate(14, H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Violations", 0, 0);
  ctx.restore();

  // Y-axis tick labels
  ctx.textAlign = "right";
  for (let i = 0; i <= yTicks; i++) {
    const val = Math.round((maxV / yTicks) * (yTicks - i));
    ctx.fillText(val, pad.left - 8, pad.top + (i / yTicks) * plotH + 4);
  }

  // X-axis tick labels
  ctx.textAlign = "center";
  const xTicks = Math.min(violations.length - 1, 6);
  for (let i = 0; i <= xTicks; i++) {
    const idx = Math.round((i / xTicks) * (violations.length - 1));
    ctx.fillText(idx, x(idx), H - pad.bottom + 18);
  }
}

/* ── GA Config ─────────────────────────────────────────────────── */
function renderConfig(cfg) {
  const el = document.getElementById("config-grid");
  el.innerHTML = "";
  const labels = {
    population_size: "Population",
    mutation_rate:   "Mutation Rate",
    crossover_rate:  "Crossover Rate",
    max_generations: "Max Generations",
    num_courses:     "Courses",
    num_rooms:       "Rooms",
    num_timeslots:   "Time Slots",
  };
  Object.entries(cfg).forEach(([k, v]) => {
    const div = document.createElement("div");
    div.className = "config-item";
    div.innerHTML = `<span class="config-item__key">${labels[k] || k}</span>
                     <span class="config-item__val">${v}</span>`;
    el.appendChild(div);
  });
}
