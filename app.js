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
    const items = $("results").children;
    if (!items.length) return;
    active = (i + items.length) % items.length;
    Array.from(items).forEach((li, k) =>
      li.setAttribute("aria-selected", String(k === active)),
    );
    items[active].scrollIntoView({ block: "nearest" });
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
    if (!n || isNaN(n)) return "";
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    function under1000(num) {
      if (num < 20) return ones[num];
      if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
      return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " " + under1000(num % 100) : "");
    }
    const num = Math.floor(Number(n));
    if (num === 0) return "Zero";
    const parts = [];
    const scales = ["", "Thousand", "Million", "Billion"];
    let i = 0, rest = num;
    while (rest > 0) {
      const chunk = rest % 1000;
      if (chunk) parts.unshift(under1000(chunk) + (scales[i] ? " " + scales[i] : ""));
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
    localStorage.setItem(window.UOBConfig.coordStorageKey + variant, JSON.stringify(payload));
  }

  function loadCoordsFromLocal(variant) {
    try {
      const raw = localStorage.getItem(window.UOBConfig.coordStorageKey + variant);
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
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheet: "Coordinate", rows }),
    });
    if (!res.ok) throw new Error(res.status);
    return { ok: true };
  }

  function savePositions() {
    const variant = $("variant").value;
    saveCoordsToLocal(variant);
    postCoords(variant)
      .then((r) => {
        if (r.skipped) alert("Positions saved locally.");
        else alert("Positions saved locally and posted to Coordinate sheet.");
      })
      .catch(() => alert("Local save ok. Post to sheet failed."));
  }

  // ---- Drag handles ---------------------------------------------------
  let dragMode = false;
  function enableDrag() {
    dragMode = true;
    const slip = document.querySelector(".uob-slip");
    if (!slip) return;
    slip.querySelectorAll(".field").forEach((el) => {
      if (el.querySelector(".drag-handle")) return;
      const h = document.createElement("span");
      h.className = "drag-handle no-print";
      h.textContent = "✥";
      h.style.cssText = "position:absolute;left:-14px;top:-2px;cursor:move;font-size:12px;color:#0b3c7d;user-select:none;z-index:10;";
      el.style.position = "absolute";
      el.appendChild(h);
      let startX, startY, origX, origY;
      h.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        startX = e.clientX;
        startY = e.clientY;
        origX = parseFloat(el.style.left) || 0;
        origY = parseFloat(el.style.top) || 0;
        const onMove = (ev) => {
          const dx = (ev.clientX - startX) * 0.264583; // px → mm approx
          const dy = (ev.clientY - startY) * 0.264583;
          el.style.left = (origX + dx).toFixed(1) + "mm";
          el.style.top = (origY + dy).toFixed(1) + "mm";
        };
        const onUp = () => {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
          const key = [...el.classList].find((c) => c !== "field" && c !== "check");
          const layout = window.UOBCommon.getLayout($("variant").value);
          if (layout && layout.fields[key]) {
            layout.fields[key].x = parseFloat(el.style.left);
            layout.fields[key].y = parseFloat(el.style.top);
            saveCoordsToLocal($("variant").value);
          }
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      });
    });
  }
  function disableDrag() {
    dragMode = false;
    document.querySelectorAll(".drag-handle").forEach((h) => h.remove());
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
    const slip = window.UOBRenderer.render(data, variant, {
      date: $("date").value,
      transferType: $("transferType").value,
      beneficiaryType: $("beneficiaryType").value,
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
          if (words && !$("amountInWords").dataset.edited) $("amountInWords").value = words;
        }
        if (e.target.id === "amountInWords") $("amountInWords").dataset.edited = "1";
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
    if (qBar) {
      qBar.addEventListener("input", () => {
        $("q").value = qBar.value;
        renderResults();
      });
      qBar.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          choose(active);
          qBar.value = "";
          $("q").value = "";
          renderResults();
        }
      });
    }

    $("loadCsv").addEventListener("click", () => $("csvFile").click());
    $("csvFile").addEventListener("change", async (e) => {
      for (const f of e.target.files) addCSV(await f.text(), f.name);
      setStatus(`${records.length} payees loaded`);
      e.target.value = "";
      if ($("q").value) renderResults();
    });

    $("clear").addEventListener("click", () => {
      FIELD_IDS.forEach((id) => ($(id).value = ""));
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

    // Load any previously saved positions for the default variant
    loadCoordsFromLocal(cfg.defaultVariant);

    $("preview-wrap").addEventListener("click", (e) => {
      if (e.target.closest(".drag-handle")) return;
      if (dragMode) disableDrag();
      else enableDrag();
    });

    renderSlip();
    loadFiles();
  }
  init();
})();
