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

    remitterAccount: { x: 52, y: 123, fontSize: 9 },
    remitterName: { x: 37.5, y: 127, fontSize: 9 },
    remitterDescription: { x: 43, y: 131, fontSize: 9 },

    beneficiaryType: { x: 136, y: 135.5, fontSize: 14, type: "check" },
    beneficiaryName: { x: 37, y: 142, fontSize: 9 },
    beneficiaryAddress: { x: 41, y: 146.5, fontSize: 8 },
    beneficiaryBank: { x: 60, y: 151, fontSize: 9 },
    beneficiaryAccount: { x: 84, y: 156, fontSize: 9 },
    beneficiaryBankAddress: { x: 77.5, y: 160, fontSize: 8 },
    swiftCode: { x: 48.5, y: 165, fontSize: 9 },
    correspondentBank: { x: 66, y: 169.5, fontSize: 8 },
    amount: { x: 40, y: 190, fontSize: 9 },
    amountInWords: { x: 40, y: 198, fontSize: 8 },
  },
};
