const fs = require("fs/promises");
const path = require("path");

const DATA_FILE = path.join(__dirname, "..", "data", "inventory.json");

async function ensureStore() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify({ items: [] }, null, 2), "utf-8");
  }
}

async function readStore() {
  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  const parsed = JSON.parse(raw || "{}");
  if (!Array.isArray(parsed.items)) {
    parsed.items = [];
  }
  return parsed;
}

async function writeStore(store) {
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
}

function nowIso() {
  return new Date().toISOString();
}

function withMeta(item) {
  return {
    id: item.id || `inv_${Math.random().toString(36).slice(2, 10)}`,
    sku: item.sku,
    name: item.name,
    category: item.category || "General",
    type: item.type === "finished" ? "finished" : "raw",
    quantity: Number(item.quantity) || 0,
    unit: item.unit || "pcs",
    costPrice: Number(item.costPrice) || 0,
    sellingPrice: Number(item.sellingPrice) || 0,
    reorderLevel: Number(item.reorderLevel) || 0,
    createdAt: item.createdAt || nowIso(),
    updatedAt: nowIso()
  };
}

function applyFilters(items, query) {
  return items.filter((item) => {
    if (query.type && item.type !== query.type) return false;
    if (query.category && item.category.toLowerCase() !== String(query.category).toLowerCase()) return false;
    if (query.lowStock === "true" && item.quantity > item.reorderLevel) return false;
    if (query.search) {
      const search = String(query.search).toLowerCase();
      const target = `${item.sku} ${item.name} ${item.category}`.toLowerCase();
      if (!target.includes(search)) return false;
    }
    return true;
  });
}

function summarize(items) {
  const summary = {
    totalItems: items.length,
    rawMaterialItems: 0,
    finishedGoodsItems: 0,
    totalQuantity: 0,
    totalStockValue: 0
  };

  for (const item of items) {
    if (item.type === "raw") summary.rawMaterialItems += 1;
    if (item.type === "finished") summary.finishedGoodsItems += 1;
    summary.totalQuantity += Number(item.quantity) || 0;
    summary.totalStockValue += (Number(item.quantity) || 0) * (Number(item.costPrice) || 0);
  }

  return summary;
}

async function list(query = {}) {
  const store = await readStore();
  return applyFilters(store.items, query);
}

async function getById(id) {
  const store = await readStore();
  return store.items.find((item) => item.id === id) || null;
}

async function create(item) {
  const store = await readStore();
  const entity = withMeta(item);
  store.items.push(entity);
  await writeStore(store);
  return entity;
}

async function update(id, patch) {
  const store = await readStore();
  const idx = store.items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  store.items[idx] = withMeta({ ...store.items[idx], ...patch, id, createdAt: store.items[idx].createdAt });
  await writeStore(store);
  return store.items[idx];
}

async function remove(id) {
  const store = await readStore();
  const before = store.items.length;
  store.items = store.items.filter((i) => i.id !== id);
  if (store.items.length === before) return false;
  await writeStore(store);
  return true;
}

async function replaceAll(items) {
  const store = { items: items.map((item) => withMeta(item)) };
  await writeStore(store);
  return store.items;
}

async function getSummary() {
  const items = await list({});
  return summarize(items);
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  replaceAll,
  getSummary
};
