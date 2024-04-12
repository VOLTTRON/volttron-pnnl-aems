import "./style.scss";

import { BUSY_GLOBAL, BusyTokens, selectBusyTokens } from "controllers/busy/action";
import { Intent, Spinner } from "@blueprintjs/core";
import React, { ReactNode } from "react";
import { RootProps, constructPath } from "routes";
import {
  selectCurrentRoute,
  selectNotice,
  selectPreviousRoute,
  selectRoutes,
  setCurrentRoute,
  setPreviousRoute,
} from "controllers/common/action";
import { selectLoginUserBusy, selectUser } from "controllers/user/action";

import { Analytics } from "utils/analytics";
import Login from "components/Login";
import Notice from "components/Notice";
import { connect } from "react-redux";
import { parseBoolean } from "utils/utils";

export interface RouteBaseProps extends RootProps {
  renderRoute: (props: RootProps) => ReactNode;
}

interface IProps extends RouteBaseProps {
  loginBusy: any;
  busyTokens: BusyTokens;
}

const isNotice = parseBoolean(process.env.REACT_APP_NOTICE || "");
const isLogin = parseBoolean(process.env.REACT_APP_LOGIN || "");

class Root extends React.Component<IProps> {
  componentDidMount() {
    const { node, page } = this.props;
    if (node.isLeaf()) {
      this.props.setCurrentRoute?.(page);
      Analytics.getInstance().pageview(constructPath(node));
    }
  }
  componentWillUnmount() {
    const { node, page } = this.props;
    if (node.isLeaf()) {
      this.props.setPreviousRoute?.(page);
    }
  }

  renderLoading() {
    return (
      <div className="global-loading">
        <Spinner intent={Intent.PRIMARY} />
      </div>
    );
  }

  render() {
    const { notice, user, loginBusy, busyTokens, page, renderRoute } = this.props;
    const globalBusy = Object.values(busyTokens || {}).filter((t) => t.type === BUSY_GLOBAL).length > 0;
    if (isNotice && !notice) {
      return <Notice />;
    } else if (isLogin && loginBusy) {
      return this.renderLoading();
    } else if (isLogin && page.user && !user) {
      return <Login isOpen={true} />;
    } else if (renderRoute) {
      return (
        <>
          {renderRoute(this.props)}
          {globalBusy && this.renderLoading()}
        </>
      );
    }
  }
}

const mapStateToProps = (state: any) => ({
  notice: selectNotice(state),
  user: selectUser(state),
  routes: selectRoutes(state),
  currentRoute: selectCurrentRoute(state),
  previousRoute: selectPreviousRoute(state),
  loginBusy: selectLoginUserBusy(state),
  busyTokens: selectBusyTokens(state),
});

const mapActionToProps = { setCurrentRoute, setPreviousRoute };

export default connect(mapStateToProps, mapActionToProps)(Root);
