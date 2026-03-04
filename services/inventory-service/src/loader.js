const fs = require("fs/promises");
const path = require("path");
const XLSX = require("xlsx");

function normalizeRow(raw) {
  const get = (...keys) => {
    for (const key of keys) {
      if (raw[key] !== undefined && raw[key] !== null && raw[key] !== "") {
        return raw[key];
      }
    }
    return "";
  };

  const quantity = Number(get("quantity", "Quantity", "qty", "Qty", "stock")) || 0;
  const costPrice = Number(get("costPrice", "CostPrice", "cost_price", "cost")) || 0;
  const sellingPrice = Number(get("sellingPrice", "SellingPrice", "selling_price", "price")) || 0;
  const reorderLevel = Number(get("reorderLevel", "ReorderLevel", "threshold", "Threshold")) || 0;

  return {
    sku: String(get("sku", "SKU", "itemCode", "item_code")).trim(),
    name: String(get("name", "Name", "item", "ItemName", "item_name")).trim(),
    category: String(get("category", "Category") || "General").trim(),
    type: String(get("type", "Type") || "raw").toLowerCase() === "finished" ? "finished" : "raw",
    quantity,
    unit: String(get("unit", "Unit") || "pcs").trim(),
    costPrice,
    sellingPrice,
    reorderLevel
  };
}

function parseCsvText(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(",").map((s) => s.trim());

  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const values = lines[i].split(",").map((s) => s.trim());
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

async function loadRowsFromFile(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".csv") {
    const text = await fs.readFile(filePath, "utf-8");
    return parseCsvText(text);
  }

  if (extension === ".xlsx" || extension === ".xls") {
    const workbook = XLSX.readFile(filePath);
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return [];
    const sheet = workbook.Sheets[firstSheetName];
    return XLSX.utils.sheet_to_json(sheet, { defval: "" });
  }

  throw new Error("Unsupported file type. Use .csv, .xlsx, or .xls");
}

async function loadInventoryFile(filePath) {
  const rows = await loadRowsFromFile(filePath);
  return rows
    .map(normalizeRow)
    .filter((row) => row.sku && row.name);
}

module.exports = {
  loadInventoryFile
};
