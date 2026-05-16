# Advanced Weather App

A production-grade, highly interactive weather application built with Next.js 15, TypeScript, Tailwind CSS, and shadcn/ui. 

## Features
- **"Should I?" Activity Engine:** Scores the suitability of 11 activities (running, cycling, beach, etc.) for today and the next 7 days based on complex weather thresholds.
- **15-Minute Nowcast:** Short-term precipitation forecasting with a custom SVG timeline.
- **Climate Anomalies:** Compares today's temperatures against the 1991–2020 historical climate normals using IndexedDB for efficient caching.
- **AI Morning Briefing:** Generates a personalized daily weather briefing using the Anthropic API (requires bringing your own key in Settings).
- **Ambient Canvas Background:** Dynamic background effects (rain, snow, fog, clear skies) that react to the current weather in real-time.
- **Robust Engineering:** Built with strict TypeScript, Zod API validation, and React Query for flawless state management. 

## Getting Started Locally

1. Clone this repository:
   ```bash
   git clone https://github.com/hugo2000-pixel/weather.git
   cd weather
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the app running.

## Deployment

To share this app with others so they can visit it through a web link, you should deploy it to [Vercel](https://vercel.com). Because this application uses Next.js server features, it needs a hosting platform like Vercel rather than just GitHub.
