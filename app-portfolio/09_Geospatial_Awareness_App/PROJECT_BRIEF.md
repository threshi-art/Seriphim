# Geospatial Awareness App

## Mission Statement

Create a map-first dashboard for public-source situational awareness using weather, aircraft, marine traffic, satellites, and user-authorized layers.

## Product Thesis

Argus Terra, flights, marine traffic, weather, and satellite ideas already exist in Seraphim. A standalone geospatial tool could make those layers coherent.

## Proposed Architecture

- Frontend: interactive map, layer panel, object inspector, timeline, and report drawer.
- Backend: source adapters for public APIs and cached simulated fallback data.
- Data: saved sessions, manual notes, map centers, enabled layers, and generated reports.
- Integrations: Open-Meteo, OpenSky-style flight data, CelesTrak, marine feeds, public camera sources only when explicitly authorized.
- Safety model: no private surveillance, no person tracking, no targeting workflow.

## Source Material

- `Seraphim/client/src/components/terra/`
- `Seraphim/client/src/pages/dashboard/ArgusTerraPage.tsx`
- Flight, weather, marine, and Terra routers

## MVP Scope

- Map view
- Weather and simulated aircraft layers
- Session save
- Markdown session report

## Open Questions

- Should Google Maps, Leaflet, Cesium, or MapLibre be used first?
- Should real-time feeds wait until after the UI is stable?
