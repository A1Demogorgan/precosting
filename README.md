# TF Corp Pre-Costing Assistant

TF Corp Pre-Costing Assistant is a Next.js application for exploring footwear design specs, reviewing component-level pre-costing data, and generating AI-assisted cost-reduction recommendations across major cost heads.

The app combines three layers:

- a design-spec browser with image hotspots and component metadata
- a deterministic pre-costing table built from local CSV and JSON data
- an AI recommendation layer that proposes cost changes by cost head and generates advanced commercial insights

## What The App Does

The current app supports three main workflows:

1. Select a footwear design from the home screen
2. Browse the design spec visually through hotspot-based shoe views
3. Open the pre-costing estimator, run cost-head agents, and generate a current-vs-new cost report

The estimator is built around common footwear cost heads:

- Material
- Waste
- Processing
- Labour
- Machine
- Consumables
- Bought-out / Vendor
- Inbound Freight
- Duty / Tariff
- Quality Rejection

Each agent reviews one cost head, compares current values against a synthetic benchmark, and proposes specific component-level changes. When Azure OpenAI is configured, the app requests structured JSON recommendations. When it is not configured, the app falls back to deterministic synthetic recommendations.

## Routes

- `/`
  - Home page with design selection
- `/design-specs?design=<DESIGN_ID>`
  - Visual design-spec browser with hotspot inspection
- `/cost?design=<DESIGN_ID>`
  - Pre-costing workbench and agent execution flow
- `/cost/report?id=<REPORT_ID>`
  - Generated comparison report stored in browser local storage

API routes:

- `/api/agent-insights`
  - Returns structured recommendation payloads for a single cost-head agent
- `/api/advanced-insights`
  - Returns higher-level design, vendor, retail-price, and volume-scenario insights based on a generated report

## Project Structure

```text
app/
  page.tsx                     Home page
  design-specs/page.tsx        Design-spec browser page
  cost/page.tsx                Cost workbench page
  cost/report/page.tsx         Report page
  api/agent-insights/route.ts  Cost-head recommendation API
  api/advanced-insights/route.ts

components/
  app-shell.tsx
  design-selector.tsx
  spec-browser.tsx
  cost-estimator.tsx
  cost-workbench.tsx
  cost-report.tsx
  cost-report-client.tsx

lib/
  design-data.ts
  cost-table.ts
  agent-recommendations.ts
  advanced-insights.ts
  azure-openai.ts

data/
  design.json
  spec-browser.json
  component-shape-metadata.json
  retail-price-comps.json
  vendor-benchmarks.json

whole_shoe_component_cost_table.csv
```

## Data Sources

The app currently relies on local project data rather than a database.

### 1. Cost table

The component cost table is loaded from:

- [whole_shoe_component_cost_table.csv](./whole_shoe_component_cost_table.csv)

This provides the component-level baseline for the estimator and report views.

### 2. Design and spec data

The design browser and component/spec mapping come from:

- [data/design.json](./data/design.json)
- [data/spec-browser.json](./data/spec-browser.json)
- [data/component-shape-metadata.json](./data/component-shape-metadata.json)

These files drive:

- design options shown in the selector
- shoe image views and hotspots
- component specifications, suppliers, and colors
- shape context used to ground AI recommendations

### 3. Commercial benchmarking inputs

The advanced insights flow uses:

- [data/retail-price-comps.json](./data/retail-price-comps.json)
- [data/vendor-benchmarks.json](./data/vendor-benchmarks.json)

These support:

- retail price positioning
- vendor strategy suggestions
- volume-scenario and margin narratives

## AI Behavior

The AI-assisted recommendation system works in two stages.

### Cost-head recommendation agents

The app defines one agent per cost head in [lib/agent-recommendations.ts](./lib/agent-recommendations.ts).

Each agent:

- scans the cost table for the target column
- compares actual values against a synthetic benchmark
- picks high-cost drivers
- enriches each driver with current specification and shape metadata
- requests structured recommendations from Azure OpenAI when configured
- falls back to deterministic synthetic recommendations when Azure is unavailable

### Advanced insights

The advanced-insights layer builds a higher-level commercialization readout from a generated report, including:

- design-change ideas
- vendor strategy options
- retail positioning
- margin snapshot
- volume scenarios

This is intended to translate component-level savings into a more management-ready decision narrative.

## Environment Variables

Create a local env file:

```bash
.env.local
```

Supported variables:

```bash
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_DEPLOYMENT_NAME=
AZURE_OPENAI_API_VERSION=2024-10-21
```

Notes:

- If `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, or deployment name are missing, the app falls back to synthetic recommendation logic.
- The Azure integration expects a chat-completions deployment that supports JSON-formatted responses.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Run lint:

```bash
npm run lint
```

Run production build:

```bash
npm run build
```

## Current Product Flow

### Home

The user starts by selecting one of the sample footwear designs.

### Design Spec Browser

The browser shows multiple shoe views with hotspots. Clicking a hotspot reveals the mapped component, its spec, and related metadata.

### Pre-Costing Workbench

The workbench reads the baseline cost table and allows cost-head agents to generate recommended changes. Those changes are applied to create a new landed-cost scenario.

### Cost Report

The report compares:

- current cost table
- new cost table
- recommendation table

The generated report is currently stored in browser local storage.

## Important Implementation Notes

- The report flow is client-side and depends on browser local storage for persistence.
- The cost engine is deterministic and file-backed.
- The AI layer is advisory and currently produces structured JSON recommendations rather than enforcing optimization constraints through a solver.
- The benchmarking logic is synthetic, not sourced from a live vendor or historical costing system.

## Recommended Next Improvements

- replace synthetic benchmarks with real historical or vendor benchmark data
- move report persistence from local storage to durable backend storage
- add explicit design-to-cost versioning by style and season
- add authentication and access control if used beyond demo scope
- add audit trails for AI-generated recommendations and accepted changes
- document the advanced-insights response format and UI entry point more clearly

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Azure OpenAI via direct REST calls

## Status

This repository is currently a working demo/prototype for TF Corp’s footwear pre-costing workflow. It already demonstrates the end-to-end idea, but some parts are still synthetic or local-only and should be treated as prototype-grade rather than production-ready.
