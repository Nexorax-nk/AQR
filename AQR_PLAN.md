# 🌍 AQR — Air Quality Routing
## What is AQR?
AQR (Air Quality Routing) is an intelligent navigation platform that helps people choose healthier routes, not just the fastest routes. Normal navigation apps mainly optimize for distance, travel time, and traffic. AQR adds another important factor: How polluted is the route?

It combines air-quality data, weather conditions, traffic, geospatial information, and route data to analyze different routes between two locations and recommend the route that provides the best balance between travel time and pollution exposure.

## 🚗 What does AQR actually do?
Imagine you need to travel from Chennai Central → Anna Nagar.

A normal map gives:
Route A
- 🕐 22 min
- 🚗 Heavy traffic
- Doesn't consider pollution exposure

AQR analyzes multiple possible routes:
| Route   | Time   | AQI Exposure | AQR Recommendation |
|---------|--------|--------------|--------------------|
| Route A | 22 min | 180          | Fastest            |
| Route B | 25 min | 110          | ⭐ Balanced        |
| Route C | 29 min | 72           | 🌿 Cleanest        |

Then AQR tells you:
**Recommended: Route B** - 3 minutes slower than the fastest route, but significantly lower pollution exposure.
So instead of asking: "What's the fastest route?" AQR asks: "What's the best route considering both travel and air quality?"

## 🧠 How AQR works (The Pipeline)
USER -> (Origin + Destination) -> ROUTING ENGINE -> ROUTE CANDIDATES -> AIR QUALITY ANALYSIS -> WEATHER + TRAFFIC -> AQR INTELLIGENCE -> FASTEST / BALANCED / CLEANEST

## 🗺️ What the user sees
1. Search
📍 From: Chennai Central
📍 To: Anna Nagar

2. Multiple routes appear on the map with Travel time, Distance, Traffic, AQI exposure, PM2.5 exposure, Pollution level.

## 🌫️ The Bigger Idea: An Air Intelligence Platform
AQR isn't just "Google Maps but with AQI." It answers:
- **Air:** What's the AQI around me?
- **Pollution:** Why is the AQI high?
- **Routing:** Which route has lower pollution?
- **Forecast:** When will the air be cleaner?
- **Outdoor activity:** What's the best time to run?
- **Events:** Is there a pollution spike happening?
- **Zones:** Which parts of the city are currently polluted?
- **Alerts:** Tell me if AQI crosses 150.
- **AI:** Why is this area polluted today?

**Google Maps gets you there. AQR helps you breathe while you do. 🌿**
Core product flow: Detect → Understand → Compare → Route → Advise

---

# 🚀 Implementation Roadmap (Phase by Phase)

## Stack Selections:
- **Routing Engine:** Mapbox Directions API (Provides multiple route alternatives and geometries).
- **AQI API:** WAQI (World Air Quality Index) / OpenWeatherMap Air Pollution API (Free and easy).

## Phase 1: The API Data Stack & Routing Setup
1. Setup standard utility files for API integrations (`src/lib/api-routing.ts`, `src/lib/api-aqi.ts`).
2. Integrate Mapbox Directions API to fetch multiple alternative routes.
3. Extract Polylines and decode them for route geometries.

## Phase 2: The AQR Routing Algorithm
1. Route Sampling: Divide the route into equidistant waypoints.
2. Environmental Querying: Fetch AQI data for the waypoints.
3. Exposure Calculation: Calculate Total Pollution Exposure `Sum(AQI * Time)`.
4. Route Classification: Tag routes as Fastest, Cleanest, and Balanced.

## Phase 3: UI Integration
1. Render multiple routes on `AQRMapInner` with distinct colors.
2. Update the `AQIDetailsDrawer` (or route panel) to show route cards.

## Phase 4: The Neural Engine (AI Context)
1. Pass route context into `AQRFloatingAgent` to provide dynamic environmental advice.
