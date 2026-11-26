# Coordinate sheet layout (for Apps Script doPost)

Sheet name: Coordinate

Columns (in order):
- variant
- field
- x
- y
- fontSize
- updated

Example row:
basic,amount,40,190,9,2026-11-26T05:00:00.000Z

Apps Script skeleton (deploy as web app, anyone):
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  if (data.sheet !== "Coordinate") return ContentService.createTextOutput("bad sheet");
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName("Coordinate") || ss.insertSheet("Coordinate");
  if (sh.getLastRow() === 0) sh.appendRow(["variant","field","x","y","fontSize","updated"]);
  data.rows.forEach(r => sh.appendRow([r.variant, r.field, r.x, r.y, r.fontSize, r.updated]));
  return ContentService.createTextOutput("ok");
}
