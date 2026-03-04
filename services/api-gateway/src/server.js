const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const app = express();
const PORT = Number(process.env.GATEWAY_PORT) || 4000;
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || "http://localhost:4001";
const ALERT_SERVICE_URL = process.env.ALERT_SERVICE_URL || "http://localhost:4002";

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

async function forward(req, res, targetBase, routePath) {
  try {
    const query = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    const response = await fetch(`${targetBase}${routePath}${query}`, {
      method: req.method,
      headers: { "Content-Type": "application/json" },
      body: ["GET", "HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body || {})
    });

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      return res.status(response.status).json(data);
    }

    const text = await response.text();
    return res.status(response.status).send(text);
  } catch (error) {
    return res.status(502).json({ error: "Upstream service unavailable", detail: error.message });
  }
}

app.get("/health", (_req, res) => {
  res.json({ service: "api-gateway", status: "ok" });
});

app.all("/api/inventory/*", (req, res) => {
  const pathAfterPrefix = req.path.replace("/api/inventory", "");
  return forward(req, res, INVENTORY_SERVICE_URL, pathAfterPrefix);
});

app.all("/api/alerts/*", (req, res) => {
  const pathAfterPrefix = req.path.replace("/api/alerts", "");
  return forward(req, res, ALERT_SERVICE_URL, pathAfterPrefix);
});

app.get("/api/dashboard/summary", async (_req, res) => {
  try {
    const [summaryRes, alertsRes] = await Promise.all([
      fetch(`${INVENTORY_SERVICE_URL}/summary`),
      fetch(`${ALERT_SERVICE_URL}/alerts`)
    ]);
    const summary = await summaryRes.json();
    const alerts = await alertsRes.json();
    res.json({
      ...summary,
      activeAlerts: alerts.length
    });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

app.use(express.static(path.join(__dirname, "..", "public")));

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`api-gateway running on ${PORT}`);
});
