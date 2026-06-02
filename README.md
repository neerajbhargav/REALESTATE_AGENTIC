# CRE Intelligence Platform (NYC Agentic Underwriter)

An autonomous, source-cited commercial real estate underwriting and feasibility platform for NYC brokers and developers. The agent resolves properties, queries live public tax registries, evaluates zoning limits, maps comparable sales, and underwrites development scenarios.

### 🌐 Live Production Application
**[realestate-agentic.vercel.app](https://realestate-agentic.vercel.app)**

---

## ⚡ Core Features

### 1. Speed-Optimized Parallel Pipeline
- Geocodes NYC street addresses via **DCP GeoSearch** to resolve the block, lot, and coordinates.
- Fetches **DoITT PLUTO** lot specifications and queries **ACRIS Deed Sales** registries in parallel using `asyncio.gather` under python.
- Integrates a **Zoning RAG vector database** to retrieve district explanations.
- Feeds all compiled records to Claude in a **single turn** for rapid feasibility synthesis, dropping report latency from ~15 seconds to **~4 seconds** (avoiding Vercel serverless timeouts).

### 2. 🧊 3D Buildable Massing Visualizer
- Visualizes the lot boundaries and the allowable buildable envelope in 3D using pure CSS 3D Transforms (zero heavy webgl library footprints).
- Interactive drag to rotate 3D viewport.
- Sliders for lot coverage footprint % and story height that scale the translucent building solid in real-time.
- Displays zoning utilization ratios and warns if footprint coverage/story heights exceed as-of-right zoning limits.

### 3. 📊 Interactive Pro Forma Underwriting Calculator
- Docked underwriting card calculating construction feasibility.
- Toggle between **Rental Residential** (Yield on Cost, net operating income, target exit cap rates, exit valuations) and **Condo Sellout** (Sponsor marketing fee offsets, net proceeds, development margins, profits).
- Drag sliders to model land costs, hard construction cost/SF, soft costs %, and rent/condo prices to underwrite margins on the fly.

### 4. 🗺️ Comparable Sales Heatmap Map Overlay
- Overlaycomparable deed sales from ACRIS as blue price tag markers directly on the Leaflet map around the subject lot.
- Popups showcase property sale price, transaction dates, block/lot numbers, and implied price per buildable square foot ($/BSF).

### 5. 💬 "Ask the Agent" Chat Drawer
- Slide-over chat widget docked to the viewport.
- Feeds raw PLUTO lot specs and RAG zoning texts as context to Claude, letting users ask specific questions (e.g. setback limits, tax assessments, owner registries).
- Streams responses back dynamically under 2 sentences to keep CRE insights concise and direct.

### 6. 📊 Side-by-Side Site Comparison
- persist successful property lookup history to `localStorage`.
- Multi-select checkbox grid in the sidebar comparing zoning codes, lot dimensions, built FAR vs Allowed FAR, remaining BSF, land values, and risk flags side-by-side.

---

## 🛠️ Technology Stack

* **Frontend**: React (Vite, HMR), Tailwind CSS, Leaflet (Map overlays), Lucide Icons
* **Backend**: FastAPI, Python Async runtime (`asyncio`, `httpx`), Anthropic Python Async Client (Claude Sonnet)
* **APIs & Registries**:
  * **NYC DCP GeoSearch API**: Address resolution and coordinate geocoding.
  * **NYC Open Data Socrata (PLUTO)**: Tax lot attributes, ownership, zoned districts, and residential/commercial FAR limits.
  * **NYC ACRIS Registry API**: Historical arm's-length deed transfer prices.

---

## 🚀 Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/neerajbhargav/REALESTATE_AGENTIC.git
cd REALESTATE_AGENTIC
```

### 2. Run the Backend API
Install dependencies:
```bash
pip install -r api/requirements.txt
```
Set environment variables:
```bash
export ANTHROPIC_API_KEY="your-key-here"
export ANTHROPIC_MODEL="claude-sonnet-4-5-20250929" # or platform default
```
Start FastAPI dev server:
```bash
fastapi dev api/index.py
```

### 3. Run the Frontend Client
Install node packages:
```bash
npm install
```
Start Vite dev server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.
