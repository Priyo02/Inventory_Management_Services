# API Reference

Base URLs:
- Gateway: `http://localhost:4000`
- Inventory service: `http://localhost:4001`
- Alert service: `http://localhost:4002`

Recommended client path: use gateway routes.

## Health

1. `GET /health` (on each service)
- Returns service status.

## Inventory APIs (via gateway prefix `/api/inventory`)

1. `GET /api/inventory/items`
- Query params:
  - `search` (optional)
  - `type=raw|finished` (optional)
  - `category` (optional)
  - `lowStock=true` (optional)

2. `GET /api/inventory/items/:id`

3. `POST /api/inventory/items`
- Body:
```json
{
  "sku": "RM-COP-01",
  "name": "Copper Wire",
  "category": "Metals",
  "type": "raw",
  "quantity": 100,
  "unit": "kg",
  "costPrice": 50,
  "sellingPrice": 0,
  "reorderLevel": 30
}
```

4. `PUT /api/inventory/items/:id`
- Full item replacement payload (same fields as create).

5. `PATCH /api/inventory/items/:id/quantity`
- Body:
```json
{
  "change": -10
}
```

6. `DELETE /api/inventory/items/:id`

7. `GET /api/inventory/summary`
- Returns aggregate inventory summary.

8. `POST /api/inventory/seed/default`
- Loads bundled sample dataset.

9. `POST /api/inventory/seed/load`
- Body:
```json
{
  "filePath": "C:/path/to/inventory.csv.xlsx"
}
```

## Alert APIs (via gateway prefix `/api/alerts`)

1. `GET /api/alerts/thresholds`
- Returns configured custom thresholds keyed by `itemId`.

2. `PUT /api/alerts/thresholds/:itemId`
- Body:
```json
{
  "threshold": 20
}
```

3. `DELETE /api/alerts/thresholds/:itemId`

4. `POST /api/alerts/evaluate`
- Body:
```json
{
  "items": []
}
```
- Intended for service-to-service/internal usage.

5. `GET /api/alerts/alerts`
- Returns active low-stock alerts.

## Dashboard API

1. `GET /api/dashboard/summary`
- Combines inventory summary with active alert count.
