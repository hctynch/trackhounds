# TrackHounds UI

React + Vite + Tailwind user interface for TrackHounds.

The UI is **not** deployed on its own. The Maven build in [`../trackhounds`](../trackhounds) runs
`npm ci && npm run build` here (using a private Node download, so only a JDK is needed) and copies
`dist/` into the application jar, where the embedded server serves it at `/`.

## UI development with hot reload

```bash
# terminal 1: backend in server-only mode (no window, no tray icon) on http://localhost:8080
cd ../trackhounds
./mvnw spring-boot:run -DskipFrontend=true -Dspring-boot.run.arguments=--server

# terminal 2: Vite dev server on http://localhost:3000, API calls go to port 8080
cd ../frontend
npm install
npm run dev
```

`VITE_API_BASE_URL` overrides the backend address if needed.

## Scripts

| Script            | Purpose                                  |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Vite dev server with hot module reload   |
| `npm run build`   | Production build into `dist/`            |
| `npm run preview` | Serve the production build locally       |
| `npm run lint`    | ESLint                                   |
