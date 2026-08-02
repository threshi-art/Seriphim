# Argus Terra

Argus Terra is the spatial intelligence module inside Argus Vigil.

It provides a browser-based 3D geospatial operations interface for lawful, defensive, educational analysis using public, licensed, simulated, or user-authorized sources.

## Routes

- `/argus-terra`
- `/argus-terra/session/:id`

## Safety Guardrails

- No face recognition.
- No person tracking.
- No private camera discovery.
- No authentication bypass or camera hacking.
- No covert monitoring workflows.
- No doxing or targeting of individuals.
- IP mapping is approximate and low confidence only.

## Environment Variables

- `GOOGLE_MAPS_TILE_API_KEY`
- `OPENSKY_USERNAME` (optional)
- `OPENSKY_PASSWORD` (optional)
- `CELESTRAK_BASE_URL` (defaults to `https://celestrak.org`)
- `ENABLE_PUBLIC_CAMERA_LAYER` (defaults to `false`)

## Notes

- The current implementation is mock-first and graceful-fallback oriented.
- Cesium rendering is scaffolded as a fallback visualization placeholder until CesiumJS is added to the runtime environment.
- OpenSky and CelesTrak adapters use backend caching to reduce source pressure.
