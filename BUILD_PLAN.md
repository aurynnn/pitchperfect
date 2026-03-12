# PitchPerfect – Production Build Plan

## Core Architecture

```
video pitch
↓
Gemini Files API upload
↓
multimodal embedding (3072)
↓
vector similarity vs style benchmarks
↓
drift analysis (768 vectors)
↓
coaching feedback engine
↓
visual analytics dashboard
```

---

## PHASE 1 — Project Initialization

### Framework Stack
- **Astro** — server rendering + routing
- **Svelte** — UI components  
- **Vite** — dev/build system

### Task 1 — Initialize Astro Project ✅
- [x] Run: `npm create astro@latest pitchperfect`
- [x] Framework: Svelte
- [x] TypeScript: enabled
- [x] Install dependencies: yes

### Task 2 — Install Dependencies
```bash
npm install d3 mediapipe
```
Optional visualization:
```bash
npm install layercake
```

### Task 3 — Project Directory Structure
```
/src
 /actions          # Astro server actions
 /components       # UI components
 /ui
 /recorder
 /charts
 /lib
   /ai            # Gemini API client
   /analysis      # similarity & drift algorithms
 /pages
   index.astro
   record.astro
   results/[id].astro
   middleware.ts
 /data
   /styles        # style configs + vectors
 /scripts         # offline style processing
```

---

## PHASE 2 — Environment Setup

### Task 4 — Environment Variables
Create `.env`:
```env
GEMINI_API_KEY=
GEMINI_API_ENDPOINT=
```

---

## PHASE 3 — Dynamic Style System

### Task 5 — Style Directory Structure
```
/data/styles/
 /visionary/
   style.json
   style_vector.json
 /storyteller/
   style.json
   style_vector.json
 /closer/
   style.json
   style_vector.json
```

### Task 6 — Style Metadata Format
Each style folder contains `style.json`:
```json
{
  "name": "Visionary",
  "description": "Steve Jobs visionary keynote style",
  "benchmarkVideos": [
    "jobs_iphone.mp4",
    "jobs_ipod_launch.mp4"
  ]
}
```

### Task 7 — Style Loader
File: `src/actions/loadStyles.ts`
- Scan `/data/styles` directories
- Read `style.json` files
- Return style list

### Task 8 — Style Selector UI
Component: `StyleSelector.svelte`
- Display: Visionary, Storyteller, Closer
- Users select desired speaking style

---

## PHASE 4 — Benchmark Style Embeddings

*Generated offline once*

### Task 9 — Benchmark Processor
File: `scripts/processStyleBenchmarks.ts`
Pipeline:
1. Load benchmark video
2. Upload to Gemini Files API
3. Generate embedding
4. Store vector

Model: `gemini-embedding-2-preview`

### Task 10 — Asymmetric Task Type
For benchmarks: `task_type = RETRIEVAL_DOCUMENT`

### Task 11 — High Resolution Vectors
Request: `output_dimensionality: 3072`

Output: `style_vector[3072]`

Storage: `/data/styles/[style]/style_vector.json`

---

## PHASE 5 — Video Recording System

### Task 12 — Camera Preview
Component: `CameraPreview.svelte`
- Use: `navigator.mediaDevices.getUserMedia()`
- Config: video + audio enabled

### Task 13 — Video Recording
Component: `Recorder.svelte`
- Use: MediaRecorder API
- Output: `video/webm`

### Task 14 — Enforce Duration Limit
MAX_DURATION = 80 seconds
- Auto-stop when exceeded
- Ensures Gemini embeds tone + speech + body language

---

## PHASE 6 — Gemini Files API Upload

### Task 15 — Client Upload
Endpoint: `https://generativelanguage.googleapis.com/upload/v1beta/files`

Process:
1. Client uploads video directly
2. Gemini stores file
3. Returns `fileUri`

*Files stored for 48 hours*

---

## PHASE 7 — Generate Pitch Embedding

### Task 16 — Astro Action
File: `src/actions/processPitch.ts`
- Input: `fileUri`, `selectedStyle`

### Task 17 — Generate Embedding
Module: `src/lib/ai/generateEmbedding.ts`

Request:
```json
{
  "model": "gemini-embedding-2-preview",
  "task_type": "RETRIEVAL_QUERY",
  "output_dimensionality": 3072
}
```

Output: `pitch_vector[3072]`

---

## PHASE 8 — Style Similarity Matching

### Task 18 — Cosine Similarity
File: `src/lib/analysis/similarity.ts`

Formula: `similarity = cosine(vectorA, vectorB)`

Example Output:
- Visionary: 0.73
- Storyteller: 0.86
- Closer: 0.61

---

## PHASE 9 — Vector Drift Analysis

### Task 19 — Sliding Window Segmentation
Split pitch into overlapping windows:
- 0-10s
- 5-15s  
- 10-20s
- ...

### Task 20 — Segment Embeddings
Each window → vector using MRL (Matryoshka Representation Learning)
- Request: `output_dimensionality: 768`

### Task 21 — Compare Segment Vectors
Example:
- 0-10s → 0.82
- 10-20s → 0.74
- 20-30s → 0.63
- 30-40s → 0.48

*Drop indicates style drift*

### Task 22 — Similarity Trajectory
Timeline dataset: `{ time, similarity }`

---

## PHASE 10 — Explainability Pipeline

### Task 23 — Gesture Tracking
Techniques:
- MediaPipe Pose
- MediaPipe FaceMesh

Metrics:
- gesture amplitude
- movement frequency
- eye contact

### Task 24 — Keyword Density
Optional transcript analysis
- storytelling structure detection
- problem statements, vision statements, CTA phrases

*Note: STT not required for similarity detection*

---

## PHASE 11 — Coaching Feedback Engine

### Task 25 — Rule Engine
File: `src/lib/feedback/rules.ts`

Example:
```typescript
IF closing_similarity < 0.6
THEN feedback = "Weak Finish"
```

### Task 26 — AI Coaching Layer
Optional LLM step

Input:
- similarity score
- drift data
- gesture analysis

Output:
> "Your pitch matches the Storyteller style by 84%. However, your closing segment drops to 52% similarity. Try increasing vocal energy and gesture amplitude when delivering your final message."

---

## PHASE 12 — Results Dashboard

### Task 27 — Radar Chart
Component: `RadarChart.svelte`

Displays:
- Authority
- Energy
- Clarity
- Gestures
- Emotional Alignment

### Task 28 — Drift Timeline
Component: `DriftChart.svelte`

Shows: similarity vs time
- Strong intro
- Weak middle
- Strong close

---

## Final System Flow

```
User selects speaking style
↓
User records pitch (max 80 seconds)
↓
Video uploaded to Gemini Files API
↓
Gemini returns fileUri
↓
Embedding generated (3072 vector)
↓
Compared with benchmark style vectors
↓
Segment drift analysis (768 vectors)
↓
Explainability analysis runs
↓
Feedback engine generates coaching
↓
Results dashboard visualizes insight
```

---

## Implementation Status

| Phase | Task | Status |
|-------|------|--------|
| 1 | Initialize Astro | ✅ Complete |
| 1 | Install Dependencies | 🔄 |
| 1 | Directory Structure | 🔄 |
| 2 | Environment Setup | 🔄 |
| 3 | Dynamic Style System | 🔄 |
| 4 | Benchmark Embeddings | ⏳ Offline |
| 5 | Video Recording | 🔄 |
| 6 | Gemini Upload | 🔄 |
| 7 | Pitch Embedding | ⏳ |
| 8 | Similarity Matching | ⏳ |
| 9 | Drift Analysis | ⏳ |
| 10 | Explainability | ⏳ |
| 11 | Coaching Engine | ⏳ |
| 12 | Results Dashboard | ⏳ |
