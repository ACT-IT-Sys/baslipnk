// variants/basic.js
// Measured from slip uob 1 - 8,29x9,43.png (2488×2828 px)
// 1 px ≈ 0.0846 mm

window.UOBLayouts = window.UOBLayouts || {};
window.UOBLayouts.basic = {
  id: "basic",
  pageSizeMm: window.UOBConfig.pageSizes.basic,

  fields: {
    date: { x: 156, y: 13, fontSize: 9 },
    transferType: { x: 164, y: 27, fontSize: 14, type: "check" },

    remitterAccount: { x: 52, y: 142, fontSize: 9 },
    remitterName: { x: 52, y: 150, fontSize: 9 },
    remitterDescription: { x: 52, y: 158, fontSize: 9 },

    beneficiaryType: { x: 52, y: 172, fontSize: 9, type: "check" },
    beneficiaryName: { x: 52, y: 182, fontSize: 9 },
    beneficiaryAddress: { x: 52, y: 190, fontSize: 8 },
    beneficiaryBank: { x: 52, y: 198, fontSize: 9 },
    beneficiaryAccount: { x: 52, y: 206, fontSize: 9 },
    beneficiaryBankAddress: { x: 52, y: 214, fontSize: 8 },
    swiftCode: { x: 52, y: 222, fontSize: 9 },
    correspondentBank: { x: 52, y: 230, fontSize: 8 },
  },
};
