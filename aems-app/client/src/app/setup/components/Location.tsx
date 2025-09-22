"use client";

import { useState, useEffect, useRef } from "react";
import { InputGroup, Button, FormGroup, Label, NumericInput, Tooltip, MenuItem } from "@blueprintjs/core";
import { Suggest } from "@blueprintjs/select";
import { IconNames } from "@blueprintjs/icons";
import { cloneDeep } from "lodash";
import { createGoogleMapsUrl, formatLocationName } from "@/utils/location";
import { DeepPartial } from "@local/common";
import { ReadUnitQuery } from "@/graphql-codegen/graphql";

type UnitType = NonNullable<ReadUnitQuery["readUnit"]>;

interface LocationResult {
  display_name: string;
  name: string;
  lat: string;
  lon: string;
}

interface LocationProps {
  unit?: UnitType | null;
  editing: DeepPartial<UnitType> | null;
  setEditing?: (editing: DeepPartial<UnitType> | null) => void;
  readOnly?: boolean;
}

export function Location({ unit, editing, setEditing, readOnly = false }: LocationProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Get current location value (merged from base and editing)
  const location = editing?.location || unit?.location || null;

  // Debounced search function
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const endpoints = [`${process.env.NEXT_PUBLIC_NOMINATIM_URL ?? ""}&q=${encodeURIComponent(searchQuery)}`];

      let data: LocationResult[] = [];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint);
          if (response.ok) {
            data = await response.json();
            break;
          }
        } catch (error) {
          console.warn(`Failed to fetch from ${endpoint}:`, error);
          continue;
        }
      }

      setResults(data);
    } catch (error) {
      console.error("Location search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle query changes with debouncing
  const handleQueryChange = (query: string) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setQuery(query);

    // can't use autocomplete on public API
    if ((process.env.NEXT_PUBLIC_NOMINATIM_URL ?? "").includes("nominatim.openstreetmap.org")) {
      return;
    }

    // Set new timeout for debounced search
    timeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 500);
  };

  // Handle location selection from search results
  const handleLocationSelect = (result: LocationResult) => {
    const selectedLocation = {
      name: result.display_name || result.name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    };

    const clone = cloneDeep(editing ?? {});
    clone.location = selectedLocation;
    setEditing?.(clone);

    setResults([]);
  };

  // Render location item in dropdown
  const renderLocationItem = (item: LocationResult, { handleClick, modifiers }: any) => {
    return (
      <MenuItem
        active={modifiers.active}
        disabled={modifiers.disabled}
        key={item.display_name || item.name}
        onClick={handleClick}
        text={item.display_name || item.name}
      />
    );
  };

  // Handle manual location name change
  const handleLocationNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clone = cloneDeep(editing ?? {});
    clone.location = clone.location ?? {};
    clone.location.name = e.target.value;
    setEditing?.(clone);
  };

  // Handle longitude change
  const handleLongitudeChange = (value: number) => {
    const clone = cloneDeep(editing ?? {});
    clone.location = clone.location ?? {};
    clone.location.longitude = value;
    setEditing?.(clone);
  };

  // Handle latitude change
  const handleLatitudeChange = (value: number) => {
    const clone = cloneDeep(editing ?? {});
    clone.location = clone.location ?? {};
    clone.location.latitude = value;
    setEditing?.(clone);
  };

  // Handle manual search button click
  const handleManualSearch = (query: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    performSearch(query);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <FormGroup label="Unit Location">
          <Label>
            <b>Unit Location</b>
            <InputGroup
              type="text"
              value={formatLocationName(location)}
              readOnly
              rightElement={
                <Tooltip content={createGoogleMapsUrl(location)}>
                  <Button
                    icon={IconNames.MAP}
                    onClick={() => window.open(createGoogleMapsUrl(location), "_blank")}
                    minimal
                  />
                </Tooltip>
              }
            />
          </Label>
        </FormGroup>

        <FormGroup label="Location Search">
          <Label>
            <b>Search Location</b>
            <Suggest<LocationResult>
              items={results}
              itemRenderer={renderLocationItem}
              onItemSelect={handleLocationSelect}
              onQueryChange={handleQueryChange}
              inputValueRenderer={(item) => item.display_name || item.name}
              noResults={<MenuItem disabled text="No results found" />}
              disabled={readOnly}
              fill
              inputProps={{
                placeholder: "Search for location...",
                rightElement: (
                  <Button
                    icon={IconNames.SEARCH}
                    minimal
                    onClick={() => handleManualSearch(query)}
                    loading={loading}
                    disabled={readOnly}
                  />
                ),
              }}
              popoverProps={{
                minimal: true,
                matchTargetWidth: true,
              }}
            />
          </Label>
        </FormGroup>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
        <FormGroup label="Coordinates">
          <Label>
            <b>Longitude</b>
            <NumericInput
              value={location?.longitude || 0}
              onValueChange={handleLongitudeChange}
              min={-180}
              max={180}
              stepSize={0.0001}
              minorStepSize={0.0001}
              fill
              disabled={readOnly}
            />
          </Label>
        </FormGroup>

        <FormGroup label="Latitude">
          <Label>
            <b>Latitude</b>
            <NumericInput
              value={location?.latitude || 0}
              onValueChange={handleLatitudeChange}
              min={-90}
              max={90}
              stepSize={0.0001}
              minorStepSize={0.0001}
              fill
              disabled={readOnly}
            />
          </Label>
        </FormGroup>
      </div>
    </div>
  );
}
