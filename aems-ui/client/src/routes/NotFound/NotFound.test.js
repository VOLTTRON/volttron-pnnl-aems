import NotFound from ".";
import { Provider } from "react-redux";
import configureStore from "controllers/store";
import { render } from "@testing-library/react";

const reduxStore = configureStore(window.REDUX_INITIAL_DATA);

describe("<NotFound />", () => {
  it("should render with no properties specified.", () => {
    const properties = {};
    render(
      <Provider store={reduxStore}>
        <NotFound {...properties} />
      </Provider>
    );
  });
});
