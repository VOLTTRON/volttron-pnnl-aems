import "./style.css";

import { FocusStyleManager } from "@blueprintjs/core";
import { Provider } from "react-redux";
import Routing from "routes/Routing";
import configureStore from "controllers/store";
import rootSaga from "controllers/saga";

// disable focus borders when using a mouse
FocusStyleManager.onlyShowFocusOnTabs();

const reduxStore = configureStore((window as any).REDUX_INITIAL_DATA);
reduxStore.runSaga(rootSaga);

function App() {
  return (
    <div className="App">
      <Provider store={reduxStore}>
        <Routing />
      </Provider>
    </div>
  );
}

export default App;
