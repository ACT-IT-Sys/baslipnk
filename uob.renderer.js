// uob.renderer.js
// Generic renderer for UOB slips. Consumes config + layout + data.
// No variant-specific logic lives here.

window.UOBRenderer = {
  /**
   * Build a printable HTML element for the given data and variant.
   * @param {Object} rawRow  - Sheet row (friendly headers or internal keys)
   * @param {string} variant - "basic" | "withCountry"
   * @param {Object} overrides - optional { date, transferType, beneficiaryType }
   * @returns {HTMLElement}
   */
  render(rawRow, variant, overrides = {}) {
    const layout = window.UOBCommon.getLayout(variant);
    if (!layout) throw new Error("Unknown UOB variant: " + variant);

    const data = window.UOBCommon.applyDefaults({
      ...window.UOBCommon.normalizeRow(rawRow),
      ...overrides,
    });

    const slip = document.createElement("div");
    slip.className = "uob-slip " + layout.id;
    slip.style.width = layout.pageSizeMm.width + "mm";
    slip.style.height = layout.pageSizeMm.height + "mm";

    Object.keys(layout.fields).forEach((key) => {
      const field = layout.fields[key];
      const value = data[key];
      if (value == null || value === "") return;

      const el = document.createElement("div");
      el.className = "field " + key + (field.type === "check" ? " check" : "");
      el.style.left = field.x + "mm";
      el.style.top = field.y + "mm";
      el.style.fontSize = (field.fontSize || 9) + "pt";
      el.textContent = field.type === "check" ? "✓" : String(value);
      slip.appendChild(el);
    });

    return slip;
  },
};
