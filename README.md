# Manufacturing Inventory Management System

Microservices-based inventory application for tracking raw materials and finished goods, with CRUD, stock updates, configurable threshold alerts, and a lightweight web dashboard.

## Architecture

Three services run independently and communicate over HTTP:

1. `inventory-service` (`http://localhost:4001`)
- Owns inventory item CRUD and stock movements.
- Calculates summary metrics.
- Supports importing from `.csv` and `.xlsx`.
- Notifies alert service after inventory changes.

2. `alert-service` (`http://localhost:4002`)
- Stores per-item custom thresholds.
- Evaluates low-stock conditions from incoming inventory data.
- Exposes active alerts.

3. `api-gateway` (`http://localhost:4000`)
- Single entry point for frontend/client calls.
- Proxies API routes to backend services.
- Serves the frontend UI from `public/`.

Frontend:
- Plain HTML/CSS/JS dashboard in `services/api-gateway/public/index.html`.
- Supports summary view, add/update/delete items, stock adjustments, search/filter, import trigger, and threshold configuration.

## Features Delivered

- Inventory summary cards (total items, raw materials, finished goods, total quantity, total stock value).
- Full CRUD on inventory items.
- Quantity adjustment endpoint and UI action.
- Configurable low-stock threshold alerts per item.
- Active alerts panel with refresh.
- Data import from CSV/XLSX files.
- Health endpoints for each service.

## Project Structure

```text
.
├── package.json
├── services
│   ├── inventory-service
│   │   ├── data
│   │   │   ├── inventory.json
│   │   │   └── sample_inventory.csv
│   │   └── src
│   │       ├── inventoryRepository.js
│   │       ├── loader.js
│   │       └── server.js
│   ├── alert-service
│   │   ├── data
│   │   │   └── alerts.json
│   │   └── src
│   │       ├── alertRepository.js
│   │       └── server.js
│   └── api-gateway
│       ├── public
│       │   └── index.html
│       └── src
│           └── server.js
└── docs
    └── API.md
```

## Setup

### 1) Install dependencies

```bash
npm install
```

### 2) Start all services

```bash
npm run dev
```

Expected running ports:
- `4000` gateway + frontend
- `4001` inventory service
- `4002` alert service

Open:
- `http://localhost:4000`

## Input Data Notes (`inventory.csv.xlsx`)

If your assessment input file is available on your machine, import it using:

```bash
curl -X POST http://localhost:4001/seed/load \
  -H "Content-Type: application/json" \
  -d "{\"filePath\":\"C:/path/to/inventory.csv.xlsx\"}"
```

Or from UI: use the import form and pass the absolute path.

Supported file types:
- `.csv`
- `.xlsx` / `.xls`

If the file is missing, the system starts with bundled sample inventory data.

## Environment Variables

- `INVENTORY_PORT` (default `4001`)
- `ALERT_PORT` (default `4002`)
- `GATEWAY_PORT` (default `4000`)
- `ALERT_SERVICE_URL` for inventory service (default `http://localhost:4002`)
- `INVENTORY_SERVICE_URL` for gateway (default `http://localhost:4001`)
- `ALERT_SERVICE_URL` for gateway (default `http://localhost:4002`)

## API Docs

Detailed endpoint documentation: [`docs/API.md`](docs/API.md)
