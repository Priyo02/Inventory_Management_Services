const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const repo = require("./alertRepository");

const app = express();
const PORT = Number(process.env.ALERT_PORT) || 4002;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ service: "alert-service", status: "ok" });
});

app.get("/thresholds", async (_req, res) => {
  const thresholds = await repo.listThresholds();
  res.json(thresholds);
});

app.put("/thresholds/:itemId", async (req, res) => {
  if (Number.isNaN(Number(req.body.threshold))) {
    return res.status(400).json({ error: "threshold must be a number" });
  }
  const thresholds = await repo.setThreshold(req.params.itemId, req.body.threshold);
  return res.json(thresholds);
});

app.delete("/thresholds/:itemId", async (req, res) => {
  const thresholds = await repo.deleteThreshold(req.params.itemId);
  return res.json(thresholds);
});

app.post("/evaluate", async (req, res) => {
  if (!Array.isArray(req.body.items)) {
    return res.status(400).json({ error: "items array required" });
  }
  const alerts = await repo.evaluateAndSave(req.body.items);
  return res.json({ count: alerts.length, alerts });
});

app.get("/alerts", async (_req, res) => {
  const alerts = await repo.listAlerts();
  res.json(alerts);
});

app.listen(PORT, () => {
  console.log(`alert-service running on ${PORT}`);
});
