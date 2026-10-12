# VidiQ AI Frontend

React + Vite frontend for the single-video YouTube RAG demo. It includes Dashboard, Main Chat, and My Videos pages inspired by the provided Google Stitch exports.

## Requirements
- Node.js (recommended: current LTS)
- Existing backend running locally at `http://localhost:3000`

## Run locally
```bash
npm install
cp .env.example .env
npm run dev
```
Open the URL printed by Vite (usually `http://localhost:5173`).

## Backend connection
The chat page sends `POST /generate` with:
```json
{ "query": "your question", "video_id": "9wXcjnJ2TN8" }
```
The frontend expects the backend response shape `{ "success": true, "answer": "..." }`.

To use a different backend URL, set `VITE_API_BASE_URL` in `.env`, for example:
```env
VITE_API_BASE_URL=http://localhost:3000
```
Restart Vite after changing environment variables. Never put Gemini, Groq, or database keys in frontend environment variables.

## Important scope notes
- This version is intentionally configured for the one pre-indexed video `9wXcjnJ2TN8`.
- The Add Video button currently navigates to the dashboard; it does not ingest new URLs because the backend described for this project only has `/generate` today.
- The My Videos screen lists the one configured video. Status labels are UI descriptions, not live database telemetry.
- The video thumbnail uses YouTube's public thumbnail URL and requires an internet connection.

## Production build
```bash
npm run build
npm run preview
```
