import {
  generateAction,
  generateActions,
  generateSelector,
  generateSelectors,
  generateType,
  generateTypes,
} from "../util";

export const key = "common";

// reset common state
export const RESET = generateType(key, "reset-this-only");
export const reset = generateAction(RESET);

// view mode
export const MODE = generateType(key, "mode");
export const setMode = generateAction(MODE);
export const selectMode = generateSelector(key, MODE);

// notice
export const NOTICE = generateType(key, "notice");
export const setNotice = generateAction(NOTICE);
export const selectNotice = generateSelector(key, NOTICE);

// load
export const LOAD = generateTypes(key, "load");
export const [doLoad, doLoadSuccess, doLoadError, doLoadBusy, doLoadPoll, updateLoad] = generateActions(LOAD);
export const [selectLoad, selectLoadError, selectLoadBusy, selectLoadPoll, selectLoadRequest] = generateSelectors(LOAD);

// routes
export const ROUTES = generateTypes(key, "routes");
export const [updateRoutes, updateRoutesSuccess, updateRoutesError, updateRoutesBusy, updateRoutesPoll] =
  generateActions(ROUTES);
export const [selectRoutes, selectRoutesError, selectRoutesBusy, selectRoutesPoll, selectRoutesRequest] =
  generateSelectors(ROUTES);

// previous route
export const PREVIOUS_ROUTE = generateType(key, "previous-route");
export const setPreviousRoute = generateAction(PREVIOUS_ROUTE);
export const selectPreviousRoute = generateSelector(key, PREVIOUS_ROUTE);

//current route
export const CURRENT_ROUTE = generateType(key, "current_route");
export const setCurrentRoute = generateAction(CURRENT_ROUTE);
export const selectCurrentRoute = generateSelector(key, CURRENT_ROUTE);

//message
export const MESSAGE = generateType(key, "message");
export const setMessage = generateAction(MESSAGE);
export const selectMessage = generateSelector(key, MESSAGE)

//current model
export const CURRENT_MODEL = generateType(key, "current_model");
export const setCurrentModel = generateAction(CURRENT_MODEL);
export const selectCurrentModel = generateSelector(key, CURRENT_MODEL)

//current dialogue
export const CURRENT_DIALOGUE = generateType(key, "current_dialogue");
export const setCurrentDialogue = generateAction(CURRENT_DIALOGUE);
export const selectCurrentDialogue = generateSelector(key, CURRENT_DIALOGUE)

//build default models
export const DEFAULT_MODELS = generateTypes(key, "default-models");
export const [buildDefaultModels, buildDefaultModelsSuccess, buildDefaultModelsError, buildDefaultModelsBusy, buildDefaultModelsPoll] =
  generateActions(DEFAULT_MODELS);
export const [selectDefaultModels, selectDefaultModelsError, selectDefaultModelsBusy, selectDefaultModelsPoll, selectDefaultModelsRequest] =
  generateSelectors(DEFAULT_MODELS);
