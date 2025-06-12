"use client";

import {
  FullscreenControl,
  GeolocateControl,
  Layer,
  Map as MapGL,
  NavigationControl,
  ScaleControl,
  Source,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useContext, useMemo } from "react";
import { compilePreferences, CurrentContext, PreferencesContext } from "../components/providers";
import { MapLayerMouseEvent, RequestTransformFunction } from "maplibre-gl";
import { useLazyQuery } from "@apollo/client";
import { AreaGeographiesDocument } from "@/graphql-codegen/graphql";
import { typeofObject } from "@local/common";
import { Colors } from "@blueprintjs/core";

export function Map() {
  const { preferences } = useContext(PreferencesContext);
  const { current } = useContext(CurrentContext);

  const { mode } = compilePreferences(preferences, current?.preferences);

  const origin = typeof window === "undefined" ? undefined : window.location.origin;

  const [areaGeographies, { data }] = useLazyQuery(AreaGeographiesDocument, {});

  const geojson: GeoJSON.FeatureCollection = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: data?.areaGeographies?.map((r) => r.geojson).filter((f) => typeofObject<GeoJSON.Feature>(f)) ?? [],
    }),
    [data],
  );

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
    [origin],
  );

  const handleMapClick = useCallback(
    (event: MapLayerMouseEvent) =>
      areaGeographies({ variables: { area: { type: "Point", coordinates: [event.lngLat.lng, event.lngLat.lat] } } }),
    [areaGeographies],
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
        "[geoBoundaries](https://www.geoboundaries.org/)",
        "[MarineRegions](https://marineregions.org/)",
      ]}
      onClick={handleMapClick}
    >
      <Source type="geojson" data={geojson} id="areas">
        <Layer id="areas" type="fill" paint={{ "fill-color": Colors.CERULEAN3, "fill-opacity": 0.5 }} />
      </Source>
      <FullscreenControl />
      <GeolocateControl />
      <NavigationControl />
      <ScaleControl />
    </MapGL>
  );
}
