import { generateActions, generateSelectors, generateTypes } from "../util";

export const key = "locations";

// read locations
export const READ_LOCATIONS = generateTypes(key, "all");
export const [readLocations, readLocationsSuccess, readLocationsError, readLocationsBusy, readLocationsPoll] =
  generateActions(READ_LOCATIONS);
export const [
  selectReadLocations,
  selectReadLocationsError,
  selectReadLocationsBusy,
  selectReadLocationsPoll,
  selectReadLocationsRequest,
] = generateSelectors(READ_LOCATIONS);

// filter locations
export const FILTER_LOCATIONS = generateTypes(key, "filter");
export const [filterLocations, filterLocationsSuccess, filterLocationsError, filterLocationsBusy, filterLocationsPoll] =
  generateActions(FILTER_LOCATIONS);
export const [
  selectFilterLocations,
  selectFilterLocationsError,
  selectFilterLocationsBusy,
  selectFilterLocationsPoll,
  selectFilterLocationsRequest,
] = generateSelectors(FILTER_LOCATIONS);

// create location
export const CREATE_LOCATION = generateTypes(key, "create");
export const [createLocation, createLocationSuccess, createLocationError, createLocationBusy] =
  generateActions(CREATE_LOCATION);
export const [
  selectCreateLocation,
  selectCreateLocationError,
  selectCreateLocationBusy,
  ,
  selectCreateLocationRequest,
] = generateSelectors(CREATE_LOCATION);

// read location
export const READ_LOCATION = generateTypes(key, "read");
export const [readLocation, readLocationSuccess, readLocationError, readLocationBusy, readLocationPoll] =
  generateActions(READ_LOCATION);
export const [selectLocation, selectLocationError, selectLocationBusy, selectLocationPoll, selectLocationRequest] =
  generateSelectors(READ_LOCATION);

// update location
export const UPDATE_LOCATION = generateTypes(key, "update");
export const [updateLocation, updateLocationSuccess, updateLocationError, updateLocationBusy] =
  generateActions(UPDATE_LOCATION);
export const [
  selectUpdateLocation,
  selectUpdateLocationError,
  selectUpdateLocationBusy,
  ,
  selectUpdateLocationRequest,
] = generateSelectors(UPDATE_LOCATION);

// delete location
export const DELETE_LOCATION = generateTypes(key, "delete");
export const [deleteLocation, deleteLocationSuccess, deleteLocationError, deleteLocationBusy] =
  generateActions(DELETE_LOCATION);
export const [
  selectDeleteLocation,
  selectDeleteLocationError,
  selectDeleteLocationBusy,
  ,
  selectDeleteLocationRequest,
] = generateSelectors(DELETE_LOCATION);

// read locations search
export const READ_LOCATIONS_SEARCH = generateTypes(key, "search");
export const [
  readLocationsSearch,
  readLocationsSearchSuccess,
  readLocationsSearchError,
  readLocationsSearchBusy,
  readLocationsSearchPoll,
] = generateActions(READ_LOCATIONS_SEARCH);
export const [
  selectLocationsSearch,
  selectLocationsSearchError,
  selectLocationsSearchBusy,
  selectLocationsSearchPoll,
  selectLocationsSearchRequest,
] = generateSelectors(READ_LOCATIONS_SEARCH);

// query locations search
export const QUERY_LOCATIONS_SEARCH = generateTypes(key, "query");
export const [queryLocationsSearch, queryLocationsSearchSuccess, queryLocationsSearchError, queryLocationsSearchBusy] =
  generateActions(QUERY_LOCATIONS_SEARCH);
export const [
  selectQueryLocationsSearch,
  selectQueryLocationsSearchError,
  selectQueryLocationsSearchBusy,
  ,
  selectQueryLocationsSearchRequest,
] = generateSelectors(QUERY_LOCATIONS_SEARCH);
