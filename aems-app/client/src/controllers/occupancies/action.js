import { generateActions, generateSelectors, generateTypes } from "../util";

export const key = "occupancies";

// read occupancies
export const READ_OCCUPANCIES = generateTypes(key, "all");
export const [readOccupancies, readOccupanciesSuccess, readOccupanciesError, readOccupanciesBusy, readOccupanciesPoll] =
  generateActions(READ_OCCUPANCIES);
export const [
  selectReadOccupancies,
  selectReadOccupanciesError,
  selectReadOccupanciesBusy,
  selectReadOccupanciesPoll,
  selectReadOccupanciesRequest,
] = generateSelectors(READ_OCCUPANCIES);

// filter occupancies
export const FILTER_OCCUPANCIES = generateTypes(key, "filter");
export const [
  filterOccupancies,
  filterOccupanciesSuccess,
  filterOccupanciesError,
  filterOccupanciesBusy,
  filterOccupanciesPoll,
] = generateActions(FILTER_OCCUPANCIES);
export const [
  selectFilterOccupancies,
  selectFilterOccupanciesError,
  selectFilterOccupanciesBusy,
  selectFilterOccupanciesPoll,
  selectFilterOccupanciesRequest,
] = generateSelectors(FILTER_OCCUPANCIES);

// create occupancy
export const CREATE_OCCUPANCY = generateTypes(key, "create");
export const [createOccupancy, createOccupancySuccess, createOccupancyError, createOccupancyBusy] =
  generateActions(CREATE_OCCUPANCY);
export const [
  selectCreateOccupancy,
  selectCreateOccupancyError,
  selectCreateOccupancyBusy,
  ,
  selectCreateOccupancyRequest,
] = generateSelectors(CREATE_OCCUPANCY);

// read occupancy
export const READ_OCCUPANCY = generateTypes(key, "read");
export const [readOccupancy, readOccupancySuccess, readOccupancyError, readOccupancyBusy, readOccupancyPoll] =
  generateActions(READ_OCCUPANCY);
export const [selectOccupancy, selectOccupancyError, selectOccupancyBusy, selectOccupancyPoll, selectOccupancyRequest] =
  generateSelectors(READ_OCCUPANCY);

// update occupancy
export const UPDATE_OCCUPANCY = generateTypes(key, "update");
export const [updateOccupancy, updateOccupancySuccess, updateOccupancyError, updateOccupancyBusy] =
  generateActions(UPDATE_OCCUPANCY);
export const [
  selectUpdateOccupancy,
  selectUpdateOccupancyError,
  selectUpdateOccupancyBusy,
  ,
  selectUpdateOccupancyRequest,
] = generateSelectors(UPDATE_OCCUPANCY);

// delete occupancy
export const DELETE_OCCUPANCY = generateTypes(key, "delete");
export const [deleteOccupancy, deleteOccupancySuccess, deleteOccupancyError, deleteOccupancyBusy] =
  generateActions(DELETE_OCCUPANCY);
export const [
  selectDeleteOccupancy,
  selectDeleteOccupancyError,
  selectDeleteOccupancyBusy,
  ,
  selectDeleteOccupancyRequest,
] = generateSelectors(DELETE_OCCUPANCY);
