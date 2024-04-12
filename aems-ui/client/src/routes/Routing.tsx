import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Intent, Spinner } from "@blueprintjs/core";
import React, { Suspense } from "react";
import { doLoad, selectRoutes } from "controllers/common/action";
import { isEmpty, isEqual, max, omit } from "lodash";

import Banner from "components/Banner";
import { Node } from "utils/tree";
import { PreserveScroll } from "components";
import { RouteType } from "./types";
import Warning from "components/Warning";
import { connect } from "react-redux";
import { constructPath } from "routes";

let current: string[][] = [];

const printRoute = (route: Node<RouteType>) => {
  if (route) {
    const path = constructPath(route);
    if (!isEmpty(path)) {
      current.push([`(${route.data?.id})`, `[${route.data?.name}]`, `${path}`]);
    }
    route.children?.forEach((c) => printRoute(c));
  }
};

const printRoutes = (route: Node<RouteType>) => {
  const prev = current;
  current = [["id", "name", "path"]];
  printRoute(route);
  const [m0, m1] = [max(current.map((c) => c[0].length)), max(current.map((c) => c[1].length))] as [number, number];
  const print = current.map(
    (c, i) =>
      `${"\xa0".repeat(3 - `${i}`.length)}${c[0]}${"\xa0".repeat(m0 - c[0].length + 1)}${c[1]}${"\xa0".repeat(
        m1 - c[1].length + 1
      )}${c[2]}`
  );
  if (!isEqual(prev, current)) {
    // keep this logging statement as it only prints for development
    console.log({ routes: print });
  }
};

const renderRoute = (route: Node<RouteType>) => {
  const { data } = route;
  if (!data) {
    return null;
  }
  const { buildProps } = data;
  const Element = data.element;
  const props = buildProps?.() || {};
  const isIndex = data.path === "/";
  if (isIndex) {
    return <Route key={data.name} index element={<Element node={route} page={omit(data, ["element"])} {...props} />} />;
  } else {
    return (
      <Route
        key={data.name}
        path={data.path ? data.path : "/"}
        element={<Element node={route} page={omit(data, ["element"])} {...props} />}
      >
        {isEmpty(route.children) ? undefined : route.children.map((child) => renderRoute(child))}
      </Route>
    );
  }
};

class Routing extends React.Component<any> {
  componentDidMount() {
    this.props.doLoad();
  }

  render() {
    const { routes } = this.props;
    if (process.env.NODE_ENV === "development") {
      printRoutes(routes?.root);
    }
    return (
      <BrowserRouter>
        <PreserveScroll />
        <Warning />
        <Banner />
        <Suspense
          fallback={
            <div className="global-loading">
              <Spinner intent={Intent.PRIMARY} />
            </div>
          }
        >
          <Routes>{routes?.root.children.map((child: Node<RouteType>) => renderRoute(child))}</Routes>
        </Suspense>
      </BrowserRouter>
    );
  }
}

const mapStateToProps = (state: any): any => ({
  routes: selectRoutes(state),
});

const mapActionToProps = {
  doLoad,
};

export default connect(mapStateToProps, mapActionToProps)(Routing);
