// app.js – UI logic: CSV autocomplete, form <-> slip preview.
(function () {
  // ---- Settings (edit here) -------------------------------------------
  // Data sources: local CSV paths and/or Google Sheet links. All are searched together.
  // To add another source, add a new line INSIDE this list (don't repeat "const").
  // skipRows = rows to ignore after the header (e.g. 1 for a "notes" row).
  const CSV_FILES = [
    { url: "data/transfers.csv" },
    {
      url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS6eMNqXwp00GD3ihWfjvFDtjKXdnYLvYWdBkQPdHqIIE1wVieLWaMneT5M1k9j_FCSZPP2SH6WwtG7/pub?gid=258565135&single=true&output=csv",
      skipRows: 2,
    },
    // { url: "https://docs.google.com/spreadsheets/d/e/XXXX/pub?gid=0&single=true&output=csv", skipRows: 1 },
    // { url: "https://docs.google.com/spreadsheets/d/SHEET_ID/edit?gid=123456789" },
  ];
  const INDEXED_COLUMNS = [
    // CSV headers searched by autocomplete
    "Beneficiary Name",
    "Beneficiary Account No",
    "Swift Code",
    "Beneficiary Bank",
    "Remitter Name",
    "Remitter Account No",
    "Remitter Description",
  ];
  const TITLE_COLUMN = "Beneficiary Name"; // main line of each result
  const SUBTITLE_COLUMN = "Beneficiary Bank";
  // ----------------------------------------------------------------------

  const $ = (id) => document.getElementById(id);
  const FIELD_IDS = [
    "remitterAccount",
    "remitterName",
    "remitterDescription",
    "beneficiaryName",
    "beneficiaryAddress",
    "beneficiaryCity",
    "beneficiaryCountry",
    "beneficiaryBank",
    "beneficiaryAccount",
    "beneficiaryBankAddress",
    "bankCity",
    "bankCountry",
    "swiftCode",
    "correspondentBank",
    "amount",
    "amountInWords",
  ];
  let records = [];
  let matches = [];
  let active = -1;
  let showBg = false;
  const layoutDefaults = {}; // original x/y from the layout files, for Reset
  const BG_IMAGES = {
    basic: "assets/slip-basic.png",
    withCountry: "assets/slip-with-country.png",
  };

  // ---- CSV ------------------------------------------------------------
  function parseCSV(text) {
    const rows = [];
    let row = [],
      cell = "",
      q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"' && text[i + 1] === '"') {
          cell += '"';
          i++;
        } else if (c === '"') q = false;
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === ",") {
        row.push(cell.trim());
        cell = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cell.trim());
        if (row.some((v) => v)) rows.push(row);
        row = [];
        cell = "";
      } else cell += c;
    }
    if (cell || row.length) {
      row.push(cell.trim());
      if (row.some((v) => v)) rows.push(row);
    }
    return rows;
  }

  // Turns a normal Google Sheet link into a CSV export link; other URLs pass through.
  function toCsvUrl(url) {
    if (/output=csv|format=csv|gviz/.test(url)) return url;
    const m = url.match(/\/spreadsheets\/d\/([\w-]+)(?!.*\/pub)/);
    if (!m || url.includes("/d/e/")) return url;
    const gid = (url.match(/[#?&]gid=(\d+)/) || [])[1] || "0";
    return `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv&gid=${gid}`;
  }

  function addCSV(text, source, skipRows = 0) {
    const rows = parseCSV(text.replace(/^\uFEFF/, ""));
    if (rows.length < 2) return 0;
    const headers = rows[0];
    rows.slice(1 + skipRows).forEach((r) => {
      const row = {};
      headers.forEach((h, i) => (row[h] = r[i] || ""));
      records.push({ row, source });
    });
    return rows.length - 1 - skipRows;
  }

  function setStatus(msg) {
    $("dataStatus").textContent = msg;
  }

  async function loadFiles() {
    const failed = [];
    for (const src of CSV_FILES) {
      const url = typeof src === "string" ? src : src.url;
      try {
        const res = await fetch(toCsvUrl(url));
        if (!res.ok) throw new Error(res.status);
        addCSV(await res.text(), url, src.skipRows || 0);
      } catch (e) {
        failed.push(url.length > 40 ? url.slice(0, 40) + "…" : url);
      }
    }
    if (failed.length) {
      setStatus(
        records.length
          ? `${records.length} payees loaded (could not read ${failed.join(", ")})`
          : "No data loaded. Use “Load a CSV file”, or open this page from a web server.",
      );
    } else setStatus(`${records.length} payees loaded`);
  }

  // ---- Autocomplete ---------------------------------------------------
  function search(term) {
    const t = term.trim().toLowerCase();
    if (!t) return [];
    const out = [];
    records.forEach((rec) =>
      INDEXED_COLUMNS.forEach((col) => {
        const v = rec.row[col];
        if (v && v.toLowerCase().includes(t)) out.push({ rec, col, v });
      }),
    );
    return out;
  }

  function highlight(parent, text, term) {
    const i = text.toLowerCase().indexOf(term.toLowerCase());
    if (i < 0 || !term) {
      parent.append(text);
      return;
    }
    const m = document.createElement("mark");
    m.textContent = text.slice(i, i + term.length);
    parent.append(text.slice(0, i), m, text.slice(i + term.length));
  }

  function buildResultItem(m, i, term) {
    const li = document.createElement("li");
    li.className = "opt";
    li.setAttribute("role", "option");
    li.tabIndex = -1;
    li.setAttribute("aria-selected", String(i === active));
    const name = document.createElement("div");
    name.className = "name";
    if (m.col === TITLE_COLUMN) highlight(name, m.v, term);
    else
      name.textContent =
        m.rec.row[TITLE_COLUMN] || m.rec.row["Remitter Name"] || "(no name)";
    const sub = document.createElement("div");
    sub.className = "sub";
    const tag = document.createElement("span");
    tag.className = "col";
    tag.textContent = m.col;
    sub.append(tag);
    if (m.col !== TITLE_COLUMN) highlight(sub, m.v, term);
    else sub.append(m.rec.row[SUBTITLE_COLUMN] || "");
    li.append(name, sub);
    li.addEventListener("mousedown", (e) => {
      e.preventDefault();
      choose(i);
    });
    return li;
  }

  function renderResultsInto(list, term) {
    list.innerHTML = "";
    if (!term) {
      list.classList.add("hidden");
      return;
    }
    list.classList.remove("hidden");
    matches.forEach((m, i) => list.appendChild(buildResultItem(m, i, term)));
  }

  function renderResults() {
    const term = ($("q").value || $("qBar")?.value || "").trim();
    matches = search(term);
    active = matches.length ? 0 : -1;
    const mainList = $("results");
    const barList = $("resultsBar");
    renderResultsInto(mainList, term);
    if (barList) renderResultsInto(barList, term);
    if ($("q")) $("q").setAttribute("aria-expanded", String(!!term));
    if ($("qBar")) $("qBar").setAttribute("aria-expanded", String(!!term));
    if (!term) {
      if ($("count")) $("count").textContent = "";
      return;
    }
    if ($("count"))
      $("count").textContent = matches.length
        ? `${matches.length} match${matches.length === 1 ? "" : "es"}`
        : "No matches. Check the spelling or load another CSV.";
  }

  function setActive(i) {
    const lists = [$("results"), $("resultsBar")].filter(
      (l) => l && !l.classList.contains("hidden"),
    );
    if (!matches.length || !lists.length) return;
    active = (i + matches.length) % matches.length;
    lists.forEach((l) => {
      Array.from(l.children).forEach((li, k) =>
        li.setAttribute("aria-selected", String(k === active)),
      );
      l.children[active]?.scrollIntoView({ block: "nearest" });
    });
  }

  function choose(i) {
    const m = matches[i];
    if (!m) return;
    fillForm(m.rec.row);
    $("q").value = "";
    if ($("qBar")) $("qBar").value = "";
    renderResults();
    const f = $("filled");
    f.textContent = `Filled from: ${m.rec.row[TITLE_COLUMN] || m.rec.row["Remitter Name"] || "selected row"}. Review the fields below.`;
    f.classList.remove("hidden");
  }

  function fillForm(row) {
    delete $("amountInWords").dataset.edited;
    FIELD_IDS.forEach((id) => ($(id).value = ""));
    const data = window.UOBCommon.normalizeRow(row);
    Object.keys(data).forEach((key) => {
      const el = $(key);
      if (el && data[key] !== "") el.value = data[key];
    });
    renderSlip();
  }

  // ---- Amount in words ------------------------------------------------
  function numberToWords(n) {
    n = Number(String(n).replace(/,/g, "")); // allow 1,500,000
    if (!n || isNaN(n)) return "";
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];
    function under1000(num) {
      if (num < 20) return ones[num];
      if (num < 100)
        return (
          tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "")
        );
      return (
        ones[Math.floor(num / 100)] +
        " Hundred" +
        (num % 100 ? " " + under1000(num % 100) : "")
      );
    }
    const num = Math.floor(Number(n));
    if (num === 0) return "Zero";
    const parts = [];
    const scales = ["", "Thousand", "Million", "Billion"];
    let i = 0,
      rest = num;
    while (rest > 0) {
      const chunk = rest % 1000;
      if (chunk)
        parts.unshift(under1000(chunk) + (scales[i] ? " " + scales[i] : ""));
      rest = Math.floor(rest / 1000);
      i++;
    }
    return parts.join(" ").trim();
  }

  function saveCoordsToLocal(variant) {
    const layout = window.UOBCommon.getLayout(variant);
    if (!layout) return;
    const payload = {};
    Object.keys(layout.fields).forEach((k) => {
      payload[k] = { x: layout.fields[k].x, y: layout.fields[k].y };
    });
    localStorage.setItem(
      window.UOBConfig.coordStorageKey + variant,
      JSON.stringify(payload),
    );
  }

  function loadCoordsFromLocal(variant) {
    try {
      const raw = localStorage.getItem(
        window.UOBConfig.coordStorageKey + variant,
      );
      if (!raw) return;
      const saved = JSON.parse(raw);
      const layout = window.UOBCommon.getLayout(variant);
      if (!layout) return;
      Object.keys(saved).forEach((k) => {
        if (layout.fields[k]) {
          layout.fields[k].x = saved[k].x;
          layout.fields[k].y = saved[k].y;
        }
      });
    } catch (e) {}
  }

  async function postCoords(variant) {
    const url = window.UOBConfig.coordPostUrl;
    if (!url) return { ok: true, skipped: true };
    const layout = window.UOBCommon.getLayout(variant);
    const rows = Object.keys(layout.fields).map((k) => ({
      variant,
      field: k,
      x: layout.fields[k].x,
      y: layout.fields[k].y,
      fontSize: layout.fields[k].fontSize || 9,
      updated: new Date().toISOString(),
    }));
    // Apps Script can't answer a CORS preflight, so send a "simple" request
    // (text/plain, no-cors). The browser can't read the reply, so success is assumed.
    await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ sheet: "Coordinate", rows }),
    });
    return { ok: true };
  }

  function savePositions() {
    const variant = $("variant").value;
    saveCoordsToLocal(variant);
    postCoords(variant)
      .then((r) => {
        if (r.skipped) alert("Positions saved locally.");
        else
          alert(
            "Positions saved locally and sent to the Coordinate sheet (cannot be confirmed from the browser).",
          );
      })
      .catch(() => alert("Local save ok. Post to sheet failed."));
  }

  // ---- Move fields (edit mode) ----------------------------------------
  let dragMode = false;
  let selected = null; // layout key of the selected field
  const MM_PER_PX = 25.4 / 96;

  function setDragMode(on) {
    dragMode = on;
    if (!on) selected = null;
    const b = $("moveToggle");
    b.setAttribute("aria-pressed", String(on));
    b.textContent = on ? "✥ Moving: On" : "✥ Move fields";
    $("editbar").classList.toggle("hidden", !on);
    renderSlip();
  }

  function selectField(key) {
    selected = key;
    document
      .querySelectorAll(".uob-slip .field")
      .forEach((f) => f.classList.toggle("sel", f.dataset.key === key));
  }

  // Store the field's base x/y (the on-screen position minus any ✓ option offset).
  function commitPosition(el) {
    const variant = $("variant").value;
    const f = window.UOBCommon.getLayout(variant)?.fields[el.dataset.key];
    if (!f) return;
    f.x = +(parseFloat(el.style.left) - (+el.dataset.offx || 0)).toFixed(1);
    f.y = +(parseFloat(el.style.top) - (+el.dataset.offy || 0)).toFixed(1);
    saveCoordsToLocal(variant);
  }

  function enableDrag() {
    const slip = document.querySelector(".uob-slip");
    if (!slip) return;
    slip.classList.add("editing");
    slip.querySelectorAll(".field").forEach((el) => {
      const h = document.createElement("span");
      h.className = "drag-handle no-print";
      h.textContent = "✥";
      h.title = "Drag to move";
      el.appendChild(h);
      el.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        selectField(el.dataset.key);
        el.setPointerCapture(e.pointerId);
        const sx = e.clientX,
          sy = e.clientY;
        const ox = parseFloat(el.style.left),
          oy = parseFloat(el.style.top);
        // The preview is CSS-zoomed to fit, so convert screen px -> slip mm.
        const k = MM_PER_PX / (parseFloat($("preview").style.zoom) || 1);
        const move = (ev) => {
          el.style.left = (ox + (ev.clientX - sx) * k).toFixed(1) + "mm";
          el.style.top = (oy + (ev.clientY - sy) * k).toFixed(1) + "mm";
        };
        const up = () => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerup", up);
          el.removeEventListener("pointercancel", up);
          commitPosition(el);
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerup", up);
        el.addEventListener("pointercancel", up);
      });
    });
    if (selected) selectField(selected);
  }

  function nudgeSelected(e) {
    if (!dragMode || !selected || !e.key.startsWith("Arrow")) return;
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    const el = document.querySelector(
      `.uob-slip .field[data-key="${selected}"]`,
    );
    if (!el) return;
    e.preventDefault();
    const s = e.shiftKey ? 1 : 0.1;
    const dx = e.key === "ArrowLeft" ? -s : e.key === "ArrowRight" ? s : 0;
    const dy = e.key === "ArrowUp" ? -s : e.key === "ArrowDown" ? s : 0;
    el.style.left = (parseFloat(el.style.left) + dx).toFixed(1) + "mm";
    el.style.top = (parseFloat(el.style.top) + dy).toFixed(1) + "mm";
    commitPosition(el);
  }

  function resetPositions() {
    const variant = $("variant").value;
    const layout = window.UOBCommon.getLayout(variant);
    const d = layoutDefaults[variant] || {};
    Object.keys(d).forEach((k) => {
      layout.fields[k].x = d[k].x;
      layout.fields[k].y = d[k].y;
    });
    localStorage.removeItem(window.UOBConfig.coordStorageKey + variant);
    renderSlip();
  }

  // ---- PDF export (jsPDF, vector text at the same mm positions) --------
  function exportPdf() {
    if (!window.jspdf) {
      alert("PDF library did not load. Check your connection and reload.");
      return;
    }
    if (dragMode) setDragMode(false);
    const slip = document.querySelector(".uob-slip");
    const w = parseFloat(slip.style.width),
      h = parseFloat(slip.style.height);
    const doc = new window.jspdf.jsPDF({
      unit: "mm",
      format: [w, h],
      orientation: w > h ? "l" : "p",
    });
    // Follows the Background toggle (off = text only, like Print).
    const bg = slip.querySelector(".slip-bg");
    if (bg && bg.complete && bg.naturalWidth)
      doc.addImage(bg, "PNG", 0, 0, w, h, undefined, "FAST");
    const PT = 25.4 / 72; // mm per pt
    slip.querySelectorAll(".field").forEach((el) => {
      const fs = parseFloat(el.style.fontSize) || 9;
      const em = fs * PT;
      const x = parseFloat(el.style.left),
        y = parseFloat(el.style.top);
      if (el.classList.contains("check")) {
        // Helvetica has no ✓, so draw it as a vector tick.
        doc.setDrawColor(0);
        doc.setLineWidth(em * 0.09);
        doc.lines(
          [
            [em * 0.25, em * 0.25],
            [em * 0.5, -em * 0.65],
          ],
          x + em * 0.1,
          y + em * 0.55,
          [1, 1],
          "S",
        );
        return;
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(fs);
      doc.setTextColor(0);
      doc.text(el.textContent, x, y + em * 0.897); // baseline = top + ascent
    });
    const name = ($("beneficiaryName").value || "slip").replace(
      /[^\w-]+/g,
      "_",
    );
    doc.save(`UOB-${name}-${$("date").value || "nodate"}.pdf`);
  }

  // ---- Slip -----------------------------------------------------------
  function renderSlip() {
    const variant = $("variant").value;
    const isCountry = variant === "withCountry";
    document
      .querySelectorAll(".country-only")
      .forEach((el) => el.classList.toggle("hidden", !isCountry));
    const data = {};
    FIELD_IDS.forEach((id) => (data[id] = $(id).value));
    // In Move mode, show every field (empty ones as their name) so each can be placed.
    if (dragMode)
      Object.keys(window.UOBCommon.getLayout(variant).fields).forEach((k) => {
        if (
          !data[k] &&
          !["date", "transferType", "beneficiaryType"].includes(k)
        )
          data[k] = k;
      });
    const slip = window.UOBRenderer.render(data, variant, {
      date: $("date").value,
      transferType: $("transferType").value || (dragMode ? "TT" : ""),
      beneficiaryType:
        $("beneficiaryType").value || (dragMode ? "Corporate" : ""),
    });
    if (showBg && BG_IMAGES[variant]) {
      const bg = document.createElement("img");
      bg.src = BG_IMAGES[variant];
      bg.alt = "";
      bg.className = "slip-bg no-print";
      slip.prepend(bg);
    }
    const prev = $("preview");
    prev.innerHTML = "";
    prev.appendChild(slip);
    fitPreview(slip);
    if (dragMode) enableDrag();
  }

  function fitPreview(slip) {
    const px = (parseFloat(slip.style.width) * 96) / 25.4;
    const avail = $("preview-wrap").clientWidth - 32;
    $("preview").style.zoom = Math.min(1, avail / px);
  }

  function fillSelect(id, options, selected) {
    const sel = $(id);
    sel.innerHTML = "";
    options.forEach((o) => {
      const opt = document.createElement("option");
      opt.value = opt.textContent = o;
      opt.selected = o === selected;
      sel.appendChild(opt);
    });
  }

  // ---- Init -----------------------------------------------------------
  function init() {
    const cfg = window.UOBConfig;
    $("date").value = cfg.defaults.date();
    fillSelect("transferType", cfg.transferTypes, cfg.defaults.transferType);
    fillSelect(
      "beneficiaryType",
      cfg.beneficiaryTypes,
      cfg.defaults.beneficiaryType,
    );
    $("variant").value = cfg.defaultVariant;

    document.querySelector(".form").addEventListener("input", (e) => {
      if (e.target.id !== "q") {
        if (e.target.id === "amount") {
          const words = numberToWords(e.target.value);
          if (!$("amountInWords").dataset.edited)
            $("amountInWords").value = words;
        }
        if (e.target.id === "amountInWords")
          $("amountInWords").dataset.edited = "1";
        renderSlip();
      }
    });
    document.querySelector(".form").addEventListener("change", (e) => {
      if (e.target.id !== "csvFile") {
        if (e.target.id === "variant") loadCoordsFromLocal(e.target.value);
        renderSlip();
      }
    });
    window.addEventListener("resize", renderSlip);

    $("q").addEventListener("input", renderResults);
    $("q").addEventListener("focus", renderResults);
    $("q").addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive(active + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive(active - 1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        choose(active);
      } else if (e.key === "Escape") {
        $("q").value = "";
        renderResults();
      }
    });

    // Bar search shares the same result builder
    const qBar = $("qBar");
    qBar.addEventListener("input", () => {
      $("q").value = qBar.value;
      renderResults();
    });
    qBar.addEventListener("focus", renderResults);
    qBar.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive(active + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive(active - 1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        choose(active);
      } else if (e.key === "Escape") {
        qBar.value = "";
        $("q").value = "";
        renderResults();
      }
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".search"))
        ["results", "resultsBar"].forEach((id) =>
          $(id).classList.add("hidden"),
        );
    });

    $("loadCsv").addEventListener("click", () => $("csvFile").click());
    $("csvFile").addEventListener("change", async (e) => {
      for (const f of e.target.files) addCSV(await f.text(), f.name);
      setStatus(`${records.length} payees loaded`);
      e.target.value = "";
      if ($("q").value) renderResults();
    });

    $("clear").addEventListener("click", () => {
      FIELD_IDS.forEach((id) => ($(id).value = ""));
      delete $("amountInWords").dataset.edited;
      $("filled").classList.add("hidden");
      renderSlip();
    });
    $("bgToggle").addEventListener("click", (e) => {
      showBg = !showBg;
      e.currentTarget.setAttribute("aria-pressed", String(showBg));
      e.currentTarget.textContent = "Background: " + (showBg ? "On" : "Off");
      renderSlip();
    });
    $("print").addEventListener("click", () => window.print());
    $("saveCoords").addEventListener("click", savePositions);

    $("moveToggle").addEventListener("click", () => setDragMode(!dragMode));
    $("resetCoords").addEventListener("click", resetPositions);
    $("exportPdf").addEventListener("click", exportPdf);
    document.addEventListener("keydown", nudgeSelected);
    window.addEventListener(
      "beforeprint",
      () => dragMode && setDragMode(false),
    );

    // Remember the file defaults (for Reset), then apply saved positions
    Object.keys(window.UOBLayouts).forEach((v) => {
      layoutDefaults[v] = {};
      Object.keys(window.UOBLayouts[v].fields).forEach((k) => {
        const f = window.UOBLayouts[v].fields[k];
        layoutDefaults[v][k] = { x: f.x, y: f.y };
      });
      loadCoordsFromLocal(v);
    });

    renderSlip();
    loadFiles();
  }
  init();
})();
