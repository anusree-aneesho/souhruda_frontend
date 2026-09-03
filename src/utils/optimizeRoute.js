// src/utils/optimizeRoute.js
import { homeCollections } from "../data/homeCollections";

export function getOptimizableStops() {
  return homeCollections.filter((hc) => hc.status === "Assigned" || hc.status === "En Route");
}

// Simple mock "optimization": sort by distance ascending, since we don't
// have real coordinates — swap for a real routing API later.
export function getOptimizedRoute() {
  const stops = getOptimizableStops();
  return [...stops].sort((a, b) => {
    const distA = parseFloat(a.distance) || 0;
    const distB = parseFloat(b.distance) || 0;
    return distA - distB;
  });
}