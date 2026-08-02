export function mapIpToGeoApproximation(ip: string) {
  const octets = ip.split(".").map(part => Number.parseInt(part, 10));
  const seed = octets.reduce((acc, value) => acc + (Number.isFinite(value) ? value : 0), 0);
  return {
    latitude: ((seed % 140) - 70) + 0.25,
    longitude: ((seed * 2) % 360) - 180,
    confidence: "low" as const,
    note: "Approximate mapping derived from weak IP heuristics, not precise geolocation.",
  };
}

export function mapNetworkFlowToRegion(flow: { sourceIp: string; destinationIp: string }) {
  return {
    source: mapIpToGeoApproximation(flow.sourceIp),
    destination: mapIpToGeoApproximation(flow.destinationIp),
    confidence: "low" as const,
    note: "Region-level context only. Do not use for person-level location claims.",
  };
}

export function showNetworkEventOnGlobe(event: { sourceIp: string; destinationIp: string }) {
  return mapNetworkFlowToRegion(event);
}
