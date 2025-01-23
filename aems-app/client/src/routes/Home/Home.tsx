import "./style.scss";

import Custom from "../../components/Custom";
import { Header } from "components";
import React from "react";
import { RootProps } from "routes";

export default class Home extends React.Component<RootProps, any> {
  render() {
    return (
      <div className={"home"}>
        <Header {...this.props} />
        <Custom url="/welcome.html" />
      </div>
    );
  }
}
