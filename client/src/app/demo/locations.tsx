"use client";

import { Button, InputGroup, Label, MenuItem, Tooltip } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { Select } from "@blueprintjs/select";
import { useContext, useEffect, useRef, useState } from "react";
import { NotificationContext, NotificationType } from "../components/providers";

interface NominatimJsonV2 {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: string;
  boundingbox: [number, number, number, number];
  lat: string; // number
  lon: string; // number
  display_name: string;
  category: string;
  type: string;
  importance: number;
  place_rank: number;
  icon: string; // URL
  address: {
    city: string;
    state_district: string;
    state: string;
    "ISO3166-2-lvl4": string;
    postcode: string;
    country: string;
    country_code: string;
  };
  extratags: {
    capital: string; // yes | no
    website: string; // URL
    wikidata: string;
    wikipedia: string;
    population: string; // number
  };
}

export function Locations() {
  const searchRef = useRef(null);

  const [query, setQuery] = useState("");
  const [location, setLocation] = useState<NominatimJsonV2 | null>(null);
  const [locations, setLocations] = useState<NominatimJsonV2[]>([]);

  const { createNotification } = useContext(NotificationContext);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_EXT_PATH || "/ext"}/nominatim/search?q=${query}&format=jsonv2`, { method: "GET" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.message || res.statusText || "Unknown error");
        }
        return json as NominatimJsonV2[];
      })
      .then((locations) => setLocations(locations))
      .catch((error) => {
        console.error("Error fetching locations:", error);
        createNotification?.("Unable to fetch locations", NotificationType.Error);
      });
  }, [query, createNotification]);

  const mapUrl = location
    ? `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lon}`
    : `https://www.google.com/maps/@?api=1&map_action=map`;

  return (
    <Label>
      <b>Location Search</b>
      <Select
        items={locations}
        itemRenderer={(v, { handleClick, modifiers }) => (
          <MenuItem
            active={location?.display_name === v.display_name}
            disabled={modifiers.disabled}
            key={v.display_name}
            text={v.display_name}
            onClick={handleClick}
          />
        )}
        onItemSelect={(v) => {
          setLocation(v);
          setQuery(v.display_name);
        }}
        noResults={<MenuItem disabled={true} text="No results" />}
        filterable={false}
        popoverProps={{
          autoFocus: false,
        }}
      >
        <InputGroup
          inputRef={searchRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rightElement={
            <Tooltip content={mapUrl}>
              <Button icon={IconNames.MAP} onClick={() => window.open(mapUrl, "_blank")} minimal />
            </Tooltip>
          }
        />
      </Select>
    </Label>
  );
}
