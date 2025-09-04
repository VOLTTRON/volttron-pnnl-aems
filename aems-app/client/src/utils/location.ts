// Location management utilities

export interface ILocation {
  id?: number;
  name?: string;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocationSearchInfo {
  autoComplete?: boolean;
  addressSearch?: boolean;
}

export interface LocationSearchResult {
  name: string;
  display_name?: string;
  lat: string;
  lon: string;
}

export const createGoogleMapsUrl = (location?: ILocation | null): string => {
  if (location?.latitude && location?.longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
  }
  return `https://www.google.com/maps/@?api=1&map_action=map`;
};

export const formatLocationName = (location?: ILocation | null): string => {
  return location?.name || "No location set";
};

export const isValidLocation = (location?: ILocation | null): boolean => {
  return !!(location?.latitude && location?.longitude);
};

export const createLocationFromSearchResult = (result: LocationSearchResult): ILocation => {
  return {
    name: result.display_name || result.name,
    latitude: parseFloat(result.lat),
    longitude: parseFloat(result.lon)
  };
};
