import { generateActions, generateSelectors, generateTypes } from "../util";

export const key = "configurations";

// read configurations
export const READ_CONFIGURATIONS = generateTypes(key, "all");
export const [
  readConfigurations,
  readConfigurationsSuccess,
  readConfigurationsError,
  readConfigurationsBusy,
  readConfigurationsPoll,
] = generateActions(READ_CONFIGURATIONS);
export const [
  selectReadConfigurations,
  selectReadConfigurationsError,
  selectReadConfigurationsBusy,
  selectReadConfigurationsPoll,
  selectReadConfigurationsRequest,
] = generateSelectors(READ_CONFIGURATIONS);

// filter configurations
export const FILTER_CONFIGURATIONS = generateTypes(key, "filter");
export const [
  filterConfigurations,
  filterConfigurationsSuccess,
  filterConfigurationsError,
  filterConfigurationsBusy,
  filterConfigurationsPoll,
] = generateActions(FILTER_CONFIGURATIONS);
export const [
  selectFilterConfigurations,
  selectFilterConfigurationsError,
  selectFilterConfigurationsBusy,
  selectFilterConfigurationsPoll,
  selectFilterConfigurationsRequest,
] = generateSelectors(FILTER_CONFIGURATIONS);

// create configuration
export const CREATE_CONFIGURATION = generateTypes(key, "create");
export const [createConfiguration, createConfigurationSuccess, createConfigurationError, createConfigurationBusy] =
  generateActions(CREATE_CONFIGURATION);
export const [
  selectCreateConfiguration,
  selectCreateConfigurationError,
  selectCreateConfigurationBusy,
  ,
  selectCreateConfigurationRequest,
] = generateSelectors(CREATE_CONFIGURATION);

// read configuration
export const READ_CONFIGURATION = generateTypes(key, "read");
export const [
  readConfiguration,
  readConfigurationSuccess,
  readConfigurationError,
  readConfigurationBusy,
  readConfigurationPoll,
] = generateActions(READ_CONFIGURATION);
export const [
  selectConfiguration,
  selectConfigurationError,
  selectConfigurationBusy,
  selectConfigurationPoll,
  selectConfigurationRequest,
] = generateSelectors(READ_CONFIGURATION);

// update configuration
export const UPDATE_CONFIGURATION = generateTypes(key, "update");
export const [updateConfiguration, updateConfigurationSuccess, updateConfigurationError, updateConfigurationBusy] =
  generateActions(UPDATE_CONFIGURATION);
export const [
  selectUpdateConfiguration,
  selectUpdateConfigurationError,
  selectUpdateConfigurationBusy,
  ,
  selectUpdateConfigurationRequest,
] = generateSelectors(UPDATE_CONFIGURATION);

// delete configuration
export const DELETE_CONFIGURATION = generateTypes(key, "delete");
export const [deleteConfiguration, deleteConfigurationSuccess, deleteConfigurationError, deleteConfigurationBusy] =
  generateActions(DELETE_CONFIGURATION);
export const [
  selectDeleteConfiguration,
  selectDeleteConfigurationError,
  selectDeleteConfigurationBusy,
  ,
  selectDeleteConfigurationRequest,
] = generateSelectors(DELETE_CONFIGURATION);
