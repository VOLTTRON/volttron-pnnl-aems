"use client";

import {
  FullscreenControl,
  GeolocateControl,
  Map as MapGL,
  NavigationControl,
  ScaleControl,
  useControl,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { compilePreferences, CurrentContext, PreferencesContext } from "../components/providers";
import { MapLayerMouseEvent, RequestTransformFunction } from "maplibre-gl";
import { useLazyQuery } from "@apollo/client";
import { AreaGeographiesDocument } from "@/graphql-codegen/graphql";
import { typeofObject } from "@local/common";
import { MapboxOverlay, MapboxOverlayProps } from "@deck.gl/mapbox";
import { LayersList } from "@deck.gl/core";
import { GeoJsonLayer } from "@deck.gl/layers";

function DeckGLOverlay(props: MapboxOverlayProps) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

export function Map() {
  const [layers, setLayers] = useState<LayersList>([]);

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

  useEffect(() => {
    setLayers([
      new GeoJsonLayer({
        id: "geojson-layer",
        data: geojson,
        filled: true,
        pointRadiusMinPixels: 5,
        pointRadiusMaxPixels: 10,
        getFillColor: [0, 128, 255, 100],
        getLineColor: [0, 0, 0, 200],
        lineWidthMinPixels: 1,
      }),
    ]);
  }, [setLayers, geojson]);

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
        longitude: 0,
        latitude: 0,
        zoom: 1,
        padding: { left: 20, right: 20, top: 20, bottom: 20 },
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
      <DeckGLOverlay layers={layers} interleaved />
      <FullscreenControl />
      <GeolocateControl />
      <NavigationControl />
      <ScaleControl />
    </MapGL>
  );
}
