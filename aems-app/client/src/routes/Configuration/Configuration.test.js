import Configuration from ".";
import { HashRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { buildTree } from "utils/tree";
import configureStore from "controllers/store";
import { render } from "@testing-library/react";
import route from "./route";

const reduxStore = configureStore(window.REDUX_INITIAL_DATA);

describe("<Configuration />", () => {
  it("should render with properties specified.", () => {
    const properties = { page: route, node: buildTree([route]).root };
    render(
      <Provider store={reduxStore}>
        <HashRouter>
          <Configuration {...properties} />
        </HashRouter>
      </Provider>
    );
  });
});
