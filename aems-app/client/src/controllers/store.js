import { createStore, applyMiddleware } from "redux";
import { fromJS } from "immutable";
import { composeWithDevTools } from "redux-devtools-extension";
import createSagaMiddleware from "redux-saga";
import reducer from "./reducer";
// import logger from "redux-logger";

export default function configureStore(initialState) {
  const sagaMiddleware = createSagaMiddleware();
  let enhancers = null;
  let middleware = [];
  switch (process.env.NODE_ENV) {
    case "production":
    case "test":
      middleware = [sagaMiddleware];
      enhancers = applyMiddleware(...middleware);
      break;
    default:
      // uncomment to add additional redux logging
      // middleware = [logger, sagaMiddleware];
      middleware = [sagaMiddleware];
      enhancers = applyMiddleware(...middleware);
      const composeEnhancers = composeWithDevTools({
        trace: true,
        traceLimit: 10,
      });
      enhancers = composeEnhancers(applyMiddleware(...middleware));
  }
  return {
    ...createStore(reducer, fromJS(initialState), enhancers),
    runSaga: sagaMiddleware.run,
  };
}
