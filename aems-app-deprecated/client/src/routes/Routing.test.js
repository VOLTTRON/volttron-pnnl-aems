import Routing from "./Routing";
import { Provider } from "react-redux";
import configureStore from "controllers/store";
import { render } from "@testing-library/react";

const reduxStore = configureStore(window.REDUX_INITIAL_DATA);

test("renders Routing", () => {
  render(
    <Provider store={reduxStore}>
      <Routing />
    </Provider>
  );
});
