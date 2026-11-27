// common.js
// Shared helpers for UOB slip rendering. Used by both variants.

window.UOBCommon = {
  /**
   * Normalize a Sheet row object using the labels map.
   * Accepts either friendly headers or internal keys.
   */
  normalizeRow(raw) {
    const map = window.UOBConfig.labels;
    const out = {};
    Object.keys(raw || {}).forEach((key) => {
      const internal = map[key] || key;
      out[internal] = raw[key];
    });
    return out;
  },

  /**
   * Apply UI defaults for fields that are not supplied by the Sheet.
   */
  applyDefaults(data) {
    const d = window.UOBConfig.defaults;
    return {
      ...data,
      // Empty string means "no date" (checkbox off). Only apply today when the key is missing.
      date: Object.prototype.hasOwnProperty.call(data, "date")
        ? data.date || ""
        : d.date(),
      transferType: data.transferType || d.transferType,
      beneficiaryType: data.beneficiaryType || d.beneficiaryType,
    };
  },

  /**
   * Return the active layout object for the chosen variant.
   */
  getLayout(variant) {
    const v = variant || window.UOBConfig.defaultVariant;
    return window.UOBLayouts && window.UOBLayouts[v];
  },
};
