// variants/withCountry.js
// Measured from slip uob 2 - 8,25x9,51.png (2476×2852 px)
// 1 px ≈ 0.0847 mm

window.UOBLayouts = window.UOBLayouts || {};
window.UOBLayouts.withCountry = {
  id: "withCountry",
  pageSizeMm: window.UOBConfig.pageSizes.withCountry,

  fields: {
    date:          { x: 148, y: 16, fontSize: 9 },
    transferType:  { x: 148, y: 28, fontSize: 9, type: "check" },

    remitterAccount:     { x: 52, y: 142, fontSize: 9 },
    remitterName:        { x: 52, y: 150, fontSize: 9 },
    remitterDescription: { x: 52, y: 158, fontSize: 9 },

    beneficiaryType:     { x: 52, y: 172, fontSize: 9, type: "check" },
    beneficiaryName:     { x: 52, y: 182, fontSize: 9 },
    beneficiaryAddress:  { x: 52, y: 190, fontSize: 8 },
    beneficiaryCity:     { x: 52, y: 198, fontSize: 9 },
    beneficiaryCountry:  { x: 118, y: 198, fontSize: 9 },
    beneficiaryBank:     { x: 52, y: 206, fontSize: 9 },
    beneficiaryAccount:  { x: 52, y: 214, fontSize: 9 },
    beneficiaryBankAddress: { x: 52, y: 222, fontSize: 8 },
    bankCity:            { x: 52, y: 230, fontSize: 9 },
    bankCountry:         { x: 118, y: 230, fontSize: 9 },
    swiftCode:           { x: 52, y: 238, fontSize: 9 },
    correspondentBank:   { x: 52, y: 246, fontSize: 8 },
  },
};
