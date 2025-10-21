import { HashRouter } from "react-router-dom";
import ILC from ".";
import { Provider } from "react-redux";
import { buildTree } from "utils/tree";
import configureStore from "controllers/store";
import { render } from "@testing-library/react";
import route from "./route";

const reduxStore = configureStore(window.REDUX_INITIAL_DATA);

describe("<ILC />", () => {
  it("should render with properties specified.", () => {
    const properties = { page: route, node: buildTree([route]).root };
    render(
      <Provider store={reduxStore}>
        <HashRouter>
          <ILC {...properties} />
        </HashRouter>
      </Provider>
    );
  });
});
