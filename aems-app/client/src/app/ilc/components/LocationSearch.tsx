"use client";

import { useState, useEffect, useRef } from "react";
import { InputGroup, Button, Menu, MenuItem, Spinner, Intent, Popover, Position } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";

interface LocationResult {
  display_name: string;
  name: string;
  lat: string;
  lon: string;
}

interface LocationSearchProps {
  value?: string;
  onLocationSelect: (location: { name: string; latitude: number; longitude: number }) => void;
  placeholder?: string;
}

export function LocationSearch({ value = "", onLocationSelect, placeholder = "Search for location..." }: LocationSearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Debounced search function
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // Using Nominatim OpenStreetMap API for location search
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=10&addressdetails=1`
      );
      
      if (response.ok) {
        const data: LocationResult[] = await response.json();
        setResults(data);
      } else {
        console.error("Location search failed:", response.statusText);
        setResults([]);
      }
    } catch (error) {
      console.error("Location search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced search
    timeoutRef.current = setTimeout(() => {
      performSearch(newQuery);
    }, 500);
  };

  // Handle manual search button click
  const handleSearch = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    performSearch(query);
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  // Handle location selection
  const handleLocationSelect = (location: LocationResult) => {
    const selectedLocation = {
      name: location.display_name || location.name,
      latitude: parseFloat(location.lat),
      longitude: parseFloat(location.lon),
    };
    
    setQuery(selectedLocation.name);
    setIsOpen(false);
    onLocationSelect(selectedLocation);
  };

  // Handle focus to show results
  const handleFocus = () => {
    if (results.length > 0) {
      setIsOpen(true);
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const menu = (
    <Menu>
      {loading && (
        <MenuItem disabled text={<><Spinner size={16} /> Searching...</>} />
      )}
      {!loading && results.length === 0 && query.length >= 3 && (
        <MenuItem disabled text="No results found" />
      )}
      {!loading && results.length === 0 && query.length < 3 && query.length > 0 && (
        <MenuItem disabled text="Type at least 3 characters to search" />
      )}
      {!loading && results.map((result, index) => (
        <MenuItem
          key={index}
          text={result.display_name || result.name}
          onClick={() => handleLocationSelect(result)}
          onMouseDown={(e) => e.preventDefault()} // Prevent input blur
        />
      ))}
    </Menu>
  );

  return (
    <Popover
      content={menu}
      isOpen={isOpen && (loading || results.length > 0 || (query.length > 0 && query.length < 3))}
      onInteraction={(nextOpenState: boolean) => {
        if (!nextOpenState) {
          setIsOpen(false);
        }
      }}
      position={Position.BOTTOM_LEFT}
      minimal
      popoverClassName="location-search-popover"
    >
      <InputGroup
        inputRef={searchRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        placeholder={placeholder}
        rightElement={
          <Button
            icon={IconNames.SEARCH}
            minimal
            onClick={handleSearch}
            loading={loading}
            intent={Intent.PRIMARY}
          />
        }
      />
    </Popover>
  );
}
