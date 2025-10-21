"use client";

import {
  FullscreenControl,
  GeolocateControl,
  Map as MapGL,
  NavigationControl,
  ScaleControl,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useContext } from "react";
import { compilePreferences, CurrentContext, PreferencesContext } from "../components/providers";
import { RequestTransformFunction } from "maplibre-gl";

export function Map() {
  const { preferences } = useContext(PreferencesContext);
  const { current } = useContext(CurrentContext);

  const { mode } = compilePreferences(preferences, current?.preferences);

  const origin = typeof window === "undefined" ? undefined : window.location.origin;

  // relative URLs don't work as the map data is fetched on the server
  const transformRequest: RequestTransformFunction = useCallback(
    (url, type) => {
      switch (type) {
        case "Tile":
        case "Image":
          try {
            return { url: new URL(url, origin).toString() };
          } catch (e) {
            console.error("Failed to parse URL:", url, e);
          }
        default:
          return { url };
      }
    },
    [origin]
  );

  return (
    <MapGL
      initialViewState={{
        longitude: -119.281389,
        latitude: 46.279722,
        zoom: 7,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle={mode === "dark" ? process.env.NEXT_PUBLIC_MAP_DARK_STYLE : process.env.NEXT_PUBLIC_MAP_LIGHT_STYLE}
      transformRequest={transformRequest}
      customAttribution={[
        "[© OpenMapTiles](https://openmaptiles.org/)",
        "[© OpenStreetMap contributors](https://www.openstreetmap.org/copyright)",
        "[MapLibre](https://maplibre.org/)",
      ]}
    >
      <FullscreenControl />
      <GeolocateControl />
      <NavigationControl />
      <ScaleControl />
    </MapGL>
  );
}
