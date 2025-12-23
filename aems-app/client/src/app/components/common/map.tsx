"use client";

import {
  ControlPosition,
  FullscreenControl,
  GeolocateControl,
  Map as MapGL,
  NavigationControl,
  ScaleControl,
  useControl,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { compilePreferences, CurrentContext, PreferencesContext } from "../providers";
import { MapLayerMouseEvent, RequestTransformFunction } from "maplibre-gl";
import { useLazyQuery } from "@apollo/client";
import { AreaGeographiesDocument } from "@/graphql-codegen/graphql";
import { MapboxOverlay, MapboxOverlayProps } from "@deck.gl/mapbox";
import { LayersList } from "@deck.gl/core";
import { GeoJsonLayer } from "@deck.gl/layers";
import { IconName, IconNames } from "@blueprintjs/icons";
import { ConfirmDialog } from "@/app/dialog";
import { ItemPredicate, ItemRenderer, Suggest } from "@blueprintjs/select";
import { Button, ButtonGroup, ControlGroup, MenuItem, Spinner, Tooltip } from "@blueprintjs/core";
import { Geography } from "@/graphql-codegen/graphql";
import styles from "./page.module.scss";
import { Mode } from "@local/prisma";
import { Normalization, typeofObject } from "@local/common";

export enum SelectType {
  CenterPoint = "Center Point",
  BoundingBox = "Bounding Box",
  BoundingOval = "Bounding Oval",
  QueryArea = "Query Area",
}

function MapType({
  mode,
  type,
  setType,
}: {
  mode: Mode;
  type: "Navigate" | "Select";
  setType: (type: "Navigate" | "Select") => void;
}) {
  return (
    <ButtonGroup id="maptype-template">
      <Tooltip
        className={mode === Mode.Dark ? "bp5-dark" : ""}
        content="Select Area"
        position="bottom"
        inheritDarkTheme
      >
        <Button icon={IconNames.WIDGET} active={type === "Select"} onClick={() => setType("Select")} />
      </Tooltip>
      <Tooltip
        className={mode === Mode.Dark ? "bp5-dark" : ""}
        content="Navigate Map"
        position="bottom"
        inheritDarkTheme
      >
        <Button icon={IconNames.HAND} active={type === "Navigate"} onClick={() => setType("Navigate")} />
      </Tooltip>
    </ButtonGroup>
  );
}

function MapTypeControl(
  props: { mode: Mode; type: "Navigate" | "Select"; setType: (type: "Navigate" | "Select") => void } & {
    position?: ControlPosition;
  },
) {
  useControl(
    () => ({
      onAdd() {
        document.getElementById("maplibregl-ctrl-maptype")?.remove();
        const maptype = document.getElementById("maptype-template");
        const div = document.createElement("div");
        div.id = "maplibregl-ctrl-maptype";
        div.className = `maplibregl-ctrl maplibregl-ctrl-group ${styles.maptype}`;
        if (maptype) {
          div.appendChild(maptype.parentNode!.removeChild(maptype));
        }
        return div;
      },
      onRemove() {
        const maptype = document.getElementById("maptype-template");
        document.getElementById("maptype-container")?.appendChild(maptype!);
      },
    }),
    { position: props.position ?? "top-left" },
  );
  return (
    <div id="maptype-container" className={styles["maptype-container"]}>
      <MapType {...props} />
    </div>
  );
}

let counter = 0;

function DeckGLOverlay(props: MapboxOverlayProps) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

const toFeatureCollection = (geojson: PrismaJson.GeographyGeoJson): GeoJSON.FeatureCollection => {
  switch (geojson?.type) {
    case "Point":
    case "LineString":
    case "Polygon":
    case "MultiPoint":
    case "MultiLineString":
    case "MultiPolygon":
    case "GeometryCollection":
      return {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: geojson,
            properties: {},
          },
        ],
      };
    case "Feature":
      return {
        type: "FeatureCollection",
        features: [geojson],
      };
    case "FeatureCollection":
    default:
      return geojson;
  }
};

const normalizer = Normalization.process(Normalization.Lowercase);

const itemFilter: ItemPredicate<Geography> = (query, item, _i, exact) => {
  const normalizedQuery = normalizer(query);
  const normalizedName = normalizer(item.name || "");
  if (exact) {
    return normalizedName === normalizedQuery;
  }
  return normalizedName.indexOf(normalizedQuery) >= 0;
};

const inputRenderer = (item: Geography | null) => {
  return item ? item.name || "Unnamed" : "";
};

const itemRenderer: ItemRenderer<Geography> = (item: Geography, { handleClick, modifiers }) => {
  if (!modifiers.matchesPredicate) {
    return null;
  }
  return (
    <MenuItem
      key={item.id}
      onClick={handleClick}
      active={modifiers.active}
      disabled={modifiers.disabled}
      text={inputRenderer(item)}
    />
  );
};

export function GeographyPicker({
  open,
  setOpen,
  title,
  icon,
  onConfirm,
  disabled,
  selectTypes,
  initialGeography,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  icon?: IconName;
  onConfirm: (selected: Geography | null) => Promise<void>;
  disabled?: boolean;
  selectTypes?: SelectType[];
  initialGeography?: Geography | null;
}) {
  const [area, setArea] = useState<GeoJSON.Polygon | null>(null);
  const [layers, setLayers] = useState<LayersList>([]);
  const [selected, setSelected] = useState<Geography | null>(initialGeography ?? null);
  const [custom, setCustom] = useState<(Geography & { geojson: GeoJSON.Polygon | GeoJSON.Point })[]>([]);
  const [type, setType] = useState<"Navigate" | "Select">("Select");

  const bbox = useMemo(() => {
    if (!initialGeography) {
      return null;
    }
    const boundsGeography = typeofObject<Geography>(initialGeography?.geojson, (v) => v?.type)
      ? initialGeography
      : null;
    if (initialGeography && !boundsGeography) {
      console.warn(
        `Initial geography "${initialGeography.name}" is not a valid GeoJSON object. Falling back to default bounds.`,
      );
      return null;
    }
    if (boundsGeography) {
      if (boundsGeography.geojson?.bbox && boundsGeography.geojson.bbox.length === 4) {
        return boundsGeography.geojson.bbox;
      }

      const featureCollection = toFeatureCollection(boundsGeography?.geojson!);

      // Initialize bbox with proper infinity values
      let minLng = Infinity;
      let minLat = Infinity;
      let maxLng = -Infinity;
      let maxLat = -Infinity;

      // Extract all coordinates from the geometry
      const extractCoordinates = (geometry: GeoJSON.Geometry): number[][] => {
        switch (geometry.type) {
          case "Point":
            return [geometry.coordinates];
          case "MultiPoint":
          case "LineString":
            return geometry.coordinates;
          case "MultiLineString":
            return geometry.coordinates.flat();
          case "Polygon":
            return geometry.coordinates.flat();
          case "MultiPolygon":
            return geometry.coordinates.flat(2);
          case "GeometryCollection":
            return geometry.geometries.flatMap((geom) => extractCoordinates(geom));
          default:
            return [];
        }
      };

      // Process all features to find the bounding box
      for (const feature of featureCollection.features) {
        const coordinates = extractCoordinates(feature.geometry);

        for (const coord of coordinates) {
          // Validate coordinates are numbers and properly formatted [lng, lat]
          if (Array.isArray(coord) && coord.length >= 2) {
            const lng = Number(coord[0]);
            const lat = Number(coord[1]);

            // Skip invalid coordinates
            if (!isFinite(lng) || !isFinite(lat)) {
              continue;
            }

            // Update bounds
            minLng = Math.min(minLng, lng);
            minLat = Math.min(minLat, lat);
            maxLng = Math.max(maxLng, lng);
            maxLat = Math.max(maxLat, lat);
          }
        }
      }

      // Ensure we found valid coordinates
      if (!isFinite(minLng) || !isFinite(minLat) || !isFinite(maxLng) || !isFinite(maxLat)) {
        console.warn(
          `Could not calculate valid bounding box for geography "${initialGeography.name}". No valid coordinates found.`,
        );
        return null;
      }

      // Return bounding box as [minLng, minLat, maxLng, maxLat]
      return [minLng, minLat, maxLng, maxLat] as [number, number, number, number];
    }
  }, [initialGeography]);

  useEffect(() => {
    setArea(null);
    setLayers([]);
    setSelected(null);
    setCustom([]);
    setType("Select");
  }, [open]);

  const { preferences } = useContext(PreferencesContext);
  const { current } = useContext(CurrentContext);

  const { mode } = compilePreferences(preferences, current?.preferences);

  const origin = typeof window === "undefined" ? undefined : window.location.origin;

  const [areaGeographies, { data, loading }] = useLazyQuery(AreaGeographiesDocument, {});

  const items = useMemo(() => [...custom, ...(data?.areaGeographies ?? [])], [custom, data]);

  useEffect(() => {
    setLayers([
      new GeoJsonLayer({
        id: "area-layer",
        data: {
          type: "FeatureCollection" as const,
          features: area ? [{ type: "Feature", geometry: area, properties: {} }] : [],
        },
        filled: true,
        pointRadiusMinPixels: 5,
        pointRadiusMaxPixels: 10,
        getFillColor: [0, 255, 128, 100],
        getLineColor: [0, 0, 0, 200],
        lineWidthMinPixels: 2,
      }),
      new GeoJsonLayer({
        id: "selected-layer",
        data: selected?.geojson
          ? toFeatureCollection(selected.geojson)
          : {
              type: "FeatureCollection",
              features: [],
            },
        filled: true,
        pointRadiusMinPixels: 5,
        pointRadiusMaxPixels: 10,
        getFillColor: [0, 128, 255, 100],
        getLineColor: [0, 0, 0, 200],
        lineWidthMinPixels: 2,
      }),
    ]);
  }, [setLayers, area, selected]);

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

  const handleMapMouse = useCallback(
    (event: MapLayerMouseEvent) => {
      if (type !== "Select") return;
      switch (event.type) {
        case "mousedown":
          setArea({
            type: "Polygon",
            coordinates: [
              [
                [event.lngLat.lng, event.lngLat.lat],
                [event.lngLat.lng, event.lngLat.lat],
                [event.lngLat.lng, event.lngLat.lat],
                [event.lngLat.lng, event.lngLat.lat],
                [event.lngLat.lng, event.lngLat.lat],
              ],
            ],
          });
          break;
        case "mousemove":
          if (area) {
            setArea({
              type: "Polygon",
              coordinates: [
                [
                  [area.coordinates[0][0][0], area.coordinates[0][0][1]],
                  [event.lngLat.lng, area.coordinates[0][0][1]],
                  [event.lngLat.lng, event.lngLat.lat],
                  [area.coordinates[0][0][0], event.lngLat.lat],
                  [area.coordinates[0][0][0], area.coordinates[0][0][1]],
                ],
              ],
            });
          }
          break;
        case "mouseup":
          if (area) {
            const geojsonRectangle: GeoJSON.Polygon = {
              type: "Polygon",
              coordinates: [
                [
                  [area.coordinates[0][0][0], area.coordinates[0][0][1]],
                  [event.lngLat.lng, area.coordinates[0][0][1]],
                  [event.lngLat.lng, event.lngLat.lat],
                  [area.coordinates[0][0][0], event.lngLat.lat],
                  [area.coordinates[0][0][0], area.coordinates[0][0][1]],
                ],
              ],
            };
            const rectangle = {
              id: `rectangle-${counter++}`,
              name: SelectType.BoundingBox,
              type: "Rectangle",
              group: "User Defined",
              geojson: geojsonRectangle,
            };
            // Calculate the bounds of the rectangle
            const minLng = Math.min(area.coordinates[0][0][0], event.lngLat.lng);
            const maxLng = Math.max(area.coordinates[0][0][0], event.lngLat.lng);
            const minLat = Math.min(area.coordinates[0][0][1], event.lngLat.lat);
            const maxLat = Math.max(area.coordinates[0][0][1], event.lngLat.lat);

            // Calculate center point as the geometric center of the bounding box
            const centerLng = (minLng + maxLng) / 2.0;
            const centerLat = (minLat + maxLat) / 2.0;

            const geojsonPoint: GeoJSON.Point = {
              type: "Point",
              coordinates: [centerLng, centerLat],
            };
            const point = {
              id: `point-${counter++}`,
              name: SelectType.CenterPoint,
              type: "Point",
              group: "User Defined",
              geojson: geojsonPoint,
            };

            // Calculate radii as half the width and height of the bounding box
            const radiusLng = (maxLng - minLng) / 2.0;
            const radiusLat = (maxLat - minLat) / 2.0;
            const geojsonCircle: GeoJSON.Polygon = {
              type: "Polygon",
              coordinates: [
                Array.from({ length: 37 }, (_, i) => {
                  const angle = (i / 36) * 2 * Math.PI;
                  return [centerLng + radiusLng * Math.cos(angle), centerLat + radiusLat * Math.sin(angle)];
                }),
              ],
            };
            const circle = {
              id: `circle-${counter++}`,
              name: SelectType.BoundingOval,
              type: "Oval",
              group: "User Defined",
              geojson: geojsonCircle,
            };
            const list = (Math.max(radiusLat, radiusLng) > 0.001 ? [rectangle, point, circle] : [point]).filter(
              (v) => selectTypes?.includes(v.name) ?? true,
            );
            setCustom(list);
            setSelected(list[0] ?? null);
            setArea(null);
            if (selectTypes?.includes(SelectType.QueryArea) ?? true) {
              areaGeographies({ variables: { area: geojsonRectangle } });
            }
          }
          break;
        case "mouseleave":
          setArea(null);
          break;
        default:
          break;
      }
    },
    [areaGeographies, area, type, selectTypes],
  );

  if (bbox === undefined) {
    return null;
  }

  return (
    <ConfirmDialog
      open={open}
      setOpen={setOpen}
      title={title}
      icon={icon ?? IconNames.GLOBE}
      onConfirm={() => onConfirm(selected)}
      disabled={disabled || !selected}
    >
      <ControlGroup>
        <Suggest
          noResults={
            <MenuItem
              disabled={true}
              text={selected ? "No geographies found." : "Drag a bounding box to select an area."}
            />
          }
          selectedItem={selected}
          onItemSelect={(v) => setSelected(v)}
          items={items}
          itemRenderer={itemRenderer}
          inputValueRenderer={inputRenderer}
          itemPredicate={itemFilter}
          closeOnSelect
          fill
        />
        <div className={styles.mapSpinner} hidden={!loading}>
          <Spinner size={20} />
        </div>
      </ControlGroup>
      <div style={{ aspectRatio: "16 / 9" }}>
        <MapGL
          dragPan={type === "Navigate"}
          initialViewState={
            bbox
              ? { bounds: bbox, padding: { left: 20, right: 20, top: 20, bottom: 20 } }
              : { longitude: 0, latitude: 0, zoom: 1, padding: { left: 20, right: 20, top: 20, bottom: 20 } }
          }
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
          onMouseDown={handleMapMouse}
          onMouseMove={handleMapMouse}
          onMouseUp={handleMapMouse}
          onMouseLeave={handleMapMouse}
        >
          <DeckGLOverlay layers={layers} interleaved />
          <MapTypeControl mode={mode} type={type} setType={setType} />
          <FullscreenControl />
          <GeolocateControl />
          <NavigationControl />
          <ScaleControl />
        </MapGL>
      </div>
    </ConfirmDialog>
  );
}
