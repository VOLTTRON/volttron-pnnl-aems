import { render } from "@testing-library/react";
import configureStore from "controllers/store";
import { Provider } from "react-redux";
import { HashRouter } from "react-router-dom";
import { buildTree } from "utils/tree";
import Info from ".";
import route from "./route";

const reduxStore = configureStore(window.REDUX_INITIAL_DATA);

describe("<Info />", () => {
  it("should render with properties specified.", () => {
    const properties = { page: route, node: buildTree([route]).root };
    render(
      <Provider store={reduxStore}>
        <HashRouter>
          <Info {...properties} />
        </HashRouter>
      </Provider>
    );
  });
});