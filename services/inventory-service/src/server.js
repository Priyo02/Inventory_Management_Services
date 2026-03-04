const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const repo = require("./inventoryRepository");
const { loadInventoryFile } = require("./loader");

const app = express();
const PORT = Number(process.env.INVENTORY_PORT) || 4001;
const ALERT_SERVICE_URL = process.env.ALERT_SERVICE_URL || "http://localhost:4002";

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

function validateItemBody(body, partial = false) {
  const required = ["sku", "name"];
  if (!partial) {
    for (const key of required) {
      if (!body[key]) return `${key} is required`;
    }
  }
  if (body.quantity !== undefined && Number.isNaN(Number(body.quantity))) return "quantity must be a number";
  if (body.reorderLevel !== undefined && Number.isNaN(Number(body.reorderLevel))) return "reorderLevel must be a number";
  return null;
}

async function notifyAlertService() {
  try {
    const items = await repo.list();
    await fetch(`${ALERT_SERVICE_URL}/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items })
    });
  } catch (error) {
    console.error("Alert service notification failed:", error.message);
  }
}

app.get("/health", (_req, res) => {
  res.json({ service: "inventory-service", status: "ok" });
});

app.get("/items", async (req, res) => {
  const items = await repo.list(req.query);
  res.json(items);
});

app.get("/items/:id", async (req, res) => {
  const item = await repo.getById(req.params.id);
  if (!item) return res.status(404).json({ error: "Item not found" });
  return res.json(item);
});

app.post("/items", async (req, res) => {
  const error = validateItemBody(req.body);
  if (error) return res.status(400).json({ error });
  const item = await repo.create(req.body);
  await notifyAlertService();
  return res.status(201).json(item);
});

app.put("/items/:id", async (req, res) => {
  const error = validateItemBody(req.body);
  if (error) return res.status(400).json({ error });
  const updated = await repo.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: "Item not found" });
  await notifyAlertService();
  return res.json(updated);
});

app.patch("/items/:id/quantity", async (req, res) => {
  if (Number.isNaN(Number(req.body.change))) {
    return res.status(400).json({ error: "change must be a number" });
  }
  const current = await repo.getById(req.params.id);
  if (!current) return res.status(404).json({ error: "Item not found" });
  const nextQuantity = (Number(current.quantity) || 0) + Number(req.body.change);
  const updated = await repo.update(req.params.id, { quantity: Math.max(0, nextQuantity) });
  await notifyAlertService();
  return res.json(updated);
});

app.delete("/items/:id", async (req, res) => {
  const ok = await repo.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: "Item not found" });
  await notifyAlertService();
  return res.status(204).send();
});

app.get("/summary", async (_req, res) => {
  const summary = await repo.getSummary();
  res.json(summary);
});

app.post("/seed/load", async (req, res) => {
  try {
    const inputPath = req.body.filePath || path.join(__dirname, "..", "data", "sample_inventory.csv");
    const items = await loadInventoryFile(inputPath);
    const saved = await repo.replaceAll(items);
    await notifyAlertService();
    res.json({ loaded: saved.length, source: inputPath });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/seed/default", async (_req, res) => {
  try {
    const inputPath = path.join(__dirname, "..", "data", "sample_inventory.csv");
    const items = await loadInventoryFile(inputPath);
    const saved = await repo.replaceAll(items);
    await notifyAlertService();
    res.json({ loaded: saved.length, source: inputPath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, async () => {
  console.log(`inventory-service running on ${PORT}`);
  const existing = await repo.list();
  if (!existing.length) {
    const defaultPath = path.join(__dirname, "..", "data", "sample_inventory.csv");
    try {
      const items = await loadInventoryFile(defaultPath);
      await repo.replaceAll(items);
      await notifyAlertService();
      console.log(`Loaded default inventory dataset (${items.length} items)`);
    } catch (error) {
      console.error("Default data load failed:", error.message);
    }
  }
});
