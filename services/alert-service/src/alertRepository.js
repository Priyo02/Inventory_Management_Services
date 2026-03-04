const fs = require("fs/promises");
const path = require("path");

const DATA_FILE = path.join(__dirname, "..", "data", "alerts.json");

async function ensureStore() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify({ thresholds: {}, activeAlerts: [] }, null, 2), "utf-8");
  }
}

async function readStore() {
  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  const parsed = JSON.parse(raw || "{}");
  if (!parsed.thresholds) parsed.thresholds = {};
  if (!Array.isArray(parsed.activeAlerts)) parsed.activeAlerts = [];
  return parsed;
}

async function writeStore(store) {
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
}

function evaluateAlerts(items, thresholds) {
  const alerts = [];
  for (const item of items) {
    const threshold = thresholds[item.id] ?? (Number(item.reorderLevel) || 0);
    const quantity = Number(item.quantity) || 0;
    if (quantity <= threshold) {
      alerts.push({
        id: `alert_${item.id}`,
        itemId: item.id,
        sku: item.sku,
        name: item.name,
        category: item.category,
        quantity,
        threshold,
        severity: quantity === 0 ? "critical" : "warning",
        createdAt: new Date().toISOString()
      });
    }
  }
  return alerts;
}

async function listThresholds() {
  const store = await readStore();
  return store.thresholds;
}

async function setThreshold(itemId, threshold) {
  const store = await readStore();
  store.thresholds[itemId] = Number(threshold) || 0;
  await writeStore(store);
  return store.thresholds;
}

async function deleteThreshold(itemId) {
  const store = await readStore();
  delete store.thresholds[itemId];
  await writeStore(store);
  return store.thresholds;
}

async function evaluateAndSave(items) {
  const store = await readStore();
  const alerts = evaluateAlerts(items, store.thresholds);
  store.activeAlerts = alerts;
  await writeStore(store);
  return alerts;
}

async function listAlerts() {
  const store = await readStore();
  return store.activeAlerts;
}

module.exports = {
  listThresholds,
  setThreshold,
  deleteThreshold,
  evaluateAndSave,
  listAlerts
};
