// uob.config.js
// Shared configuration for UOB transfer slip printing.
// Prefer editing values here over hardcoding in variants or renderer.

window.UOBConfig = {
  bank: "UOB",
  mode: "form", // "form" | "background"
  defaultVariant: "basic", // "basic" | "withCountry"

  // UI defaults
  defaults: {
    date: () => new Date().toISOString().slice(0, 10),
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
