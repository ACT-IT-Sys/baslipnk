// uob.config.js
// Shared configuration for UOB transfer slip printing.
// Prefer editing values here over hardcoding in variants or renderer.

window.UOBConfig = {
  bank: "UOB",
  mode: "form", // "form" | "background"
  defaultVariant: "basic", // "basic" | "withCountry"

  // UI defaults
  defaults: {
    // Local date (toISOString is UTC and shows "yesterday" before 07:00 in WIB)
    date: () => {
      const d = new Date(),
        p = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    },
    transferType: "",
    beneficiaryType: "",
  },

  // Dropdown options (short English). Empty string = none (default).
  transferTypes: ["", "LLG", "BI-FAST", "RTGS", "TT", "Demand Draft"],
  beneficiaryTypes: [
    "",
    "Resident",
    "Non-Resident",
    "Individual",
    "Corporate",
    "Government",
  ],

  // Friendly Sheet header → internal field key
  labels: {
    "Remitter Account No": "remitterAccount",
    "Remitter Name": "remitterName",
    "Remitter Description": "remitterDescription",
    "Beneficiary Name": "beneficiaryName",
    "Beneficiary Address": "beneficiaryAddress",
    "Beneficiary Bank": "beneficiaryBank",
    "Beneficiary Account No": "beneficiaryAccount",
    "Beneficiary Bank Address": "beneficiaryBankAddress",
    "Swift Code": "swiftCode",
    "Correspondent Bank": "correspondentBank",
    "Beneficiary City": "beneficiaryCity",
    "Beneficiary Country": "beneficiaryCountry",
    "Bank City": "bankCity",
    "Bank Country": "bankCountry",
    Amount: "amount",
    "Amount In Words": "amountInWords",
  },

  // Where the ✓ goes for each option, as [dx, dy] mm from the field's x/y.
  // The field's x/y in the layout file = the TT / Corporate box.
  // Estimated from the slip scans: fine-tune with Move fields.
  checkOffsets: {
    transferType: {
      LLG: [-19.8, -4.9],
      "BI-FAST": [0, -4.9],
      RTGS: [-19.8, 0],
      TT: [0, 0],
      "Demand Draft": [18.5, 0],
    },
    beneficiaryType: {
      Resident: [-115.3, 0],
      "Non-Resident": [-90.2, 0],
      Individual: [-39.1, 0],
      Corporate: [0, 0],
      Government: [37.4, 0],
    },
  },

  // Fields that exist only on withCountry variant
  countryFields: [
    "beneficiaryCity",
    "beneficiaryCountry",
    "bankCity",
    "bankCountry",
  ],

  // Physical page sizes (mm) – measured from provided slips
  pageSizes: {
    basic: { width: 210.6, height: 239.5 }, // 8.29 × 9.43 in
    withCountry: { width: 209.6, height: 241.6 }, // 8.25 × 9.51 in
  },

  // Google Sheet (optional)
  // Set a published CSV link or a Sheet URL shared as "Anyone with the link".
  // Leave empty to disable auto-load.
  sheetUrl: "",

  // Coordinate persistence
  // localStorage key prefix
  coordStorageKey: "uob-coords-",
  // Apps Script web app URL that writes to the "Coordinate" sheet.
  // Leave empty to disable the POST on Save.
  coordPostUrl:
    "https://script.google.com/macros/s/AKfycbwGSyIsdybcaP3XK4POhfaozisXiVLJQzA3V-vSb2KINe20_lW-DNVfNdwGfH6ceb_K/exec",
};
