// ============================================================
//  COORG TRIP EXPENSE TRACKER — Google Apps Script (v2)
//  Changes: Added "Name" column to track who added each expense
//
//  To update your existing deployment:
//  1. Paste this into Apps Script (replacing old code)
//  2. Click Deploy → Manage Deployments
//  3. Edit your existing deployment → New Version → Deploy
//     (No need to create a new deployment — same URL works!)
// ============================================================

const SHEET_NAME = "Expenses";

function doGet(e)  { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  try {
    const action = e.parameter.action;
    if (action === "getAll") return respond(getAllExpenses());
    if (action === "add")    return respond(addExpense(e.parameter));
    if (action === "update") return respond(updateExpense(e.parameter));
    if (action === "delete") { deleteExpense(e.parameter.id); return respond({ success: true }); }
    if (action === "ping")   return respond({ success: true, message: "Connected!" });
    return respond({ error: "Unknown action" });
  } catch (err) {
    return respond({ error: err.message });
  }
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["ID", "Day", "Name", "Description", "Category", "Amount", "Paid By", "Timestamp", "Edited"]);
    sheet.getRange(1, 1, 1, 9).setFontWeight("bold");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 120);
    sheet.setColumnWidth(2, 55);
    sheet.setColumnWidth(3, 100);
    sheet.setColumnWidth(4, 260);
    sheet.setColumnWidth(5, 100);
    sheet.setColumnWidth(6, 90);
    sheet.setColumnWidth(7, 100);
    sheet.setColumnWidth(8, 160);
    sheet.setColumnWidth(9, 80);
  }
  return sheet;
}

function getAllExpenses() {
  const sheet = getOrCreateSheet();
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return { expenses: [] };

  const expenses = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    if (r[0]) {
      expenses.push({
        id:      String(r[0]),
        day:     Number(r[1]),
        name:    String(r[2]),
        desc:    String(r[3]),
        cat:     String(r[4]),
        amount:  Number(r[5]),
        paidBy:  String(r[6]),
        ts:      String(r[7]),
        edited:  r[8] ? String(r[8]) : ""
      });
    }
  }
  return { expenses };
}

function addExpense(p) {
  const sheet = getOrCreateSheet();
  const id = "exp_" + new Date().getTime();
  const ts = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  sheet.appendRow([id, Number(p.day), p.name || "—", p.desc, p.cat, Number(p.amount), p.paidBy || "—", ts, ""]);

  // Color-code category cell
  const catColors = {
    food:      "#fef9c3",
    fuel:      "#f5d5c0",
    stay:      "#cce8f4",
    transport: "#fcd5de",
    entry:     "#e8d5f8",
    misc:      "#c8f0dc"
  };
  sheet.getRange(sheet.getLastRow(), 5).setBackground(catColors[p.cat] || "#ffffff");

  return { success: true, id };
}

function deleteExpense(id) {
  const sheet = getOrCreateSheet();
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return;
    }
  }
}

function updateExpense(p) {
  const sheet = getOrCreateSheet();
  const data  = sheet.getDataRange().getValues();
  const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(p.id)) {
      const row = i + 1;
      sheet.getRange(row, 2).setValue(Number(p.day));
      sheet.getRange(row, 3).setValue(p.name || "—");
      sheet.getRange(row, 4).setValue(p.desc);
      sheet.getRange(row, 5).setValue(p.cat);
      sheet.getRange(row, 6).setValue(Number(p.amount));
      sheet.getRange(row, 7).setValue(p.paidBy || "—");
      sheet.getRange(row, 8).setValue(now); // Update timestamp
      sheet.getRange(row, 9).setValue("Yes"); // Mark as edited

      // Update category color
      const catColors = {
        food:      "#fef9c3",
        fuel:      "#f5d5c0",
        stay:      "#cce8f4",
        transport: "#fcd5de",
        entry:     "#e8d5f8",
        misc:      "#c8f0dc"
      };
      sheet.getRange(row, 5).setBackground(catColors[p.cat] || "#ffffff");

      return { success: true };
    }
  }
  return { error: "Expense not found" };
}

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
