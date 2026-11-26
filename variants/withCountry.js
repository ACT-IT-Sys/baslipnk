// variants/withCountry.js
// Measured from slip uob 2 - 8,25x9,51.png (2476×2852 px)
// 1 px ≈ 0.0847 mm

window.UOBLayouts = window.UOBLayouts || {};
window.UOBLayouts.withCountry = {
  id: "withCountry",
  pageSizeMm: window.UOBConfig.pageSizes.withCountry,

  fields: {
    date: { x: 154, y: 14.5, fontSize: 9 },
    transferType: { x: 161.5, y: 28.5, fontSize: 14, type: "check" },

    remitterAccount: { x: 49, y: 123.5, fontSize: 9 },
    remitterName: { x: 35.5, y: 127, fontSize: 9 },
    remitterDescription: { x: 40.5, y: 131.5, fontSize: 9 },

    beneficiaryType: { x: 134.5, y: 136.5, fontSize: 14, type: "check" },
    beneficiaryName: { x: 35.5, y: 142.5, fontSize: 9 },
    beneficiaryAddress: { x: 38.5, y: 147.5, fontSize: 8 },
    beneficiaryCity: { x: 31, y: 156.5, fontSize: 9 },
    beneficiaryCountry: { x: 115.5, y: 156.5, fontSize: 9 },
    beneficiaryBank: { x: 58, y: 152, fontSize: 9 },
    beneficiaryAccount: { x: 82, y: 161, fontSize: 9 },
    beneficiaryBankAddress: { x: 75, y: 165.5, fontSize: 8 },
    bankCity: { x: 31, y: 169.5, fontSize: 9 },
    bankCountry: { x: 115.5, y: 169.5, fontSize: 9 },
    swiftCode: { x: 45, y: 174.5, fontSize: 9 },
    correspondentBank: { x: 64, y: 179, fontSize: 8 },
  },
};
