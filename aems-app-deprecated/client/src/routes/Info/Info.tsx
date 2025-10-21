import "./style.scss";

import Custom from "../../components/Custom";
import { Header } from "components";
import React from "react";
import { RootProps } from "routes";

export default class Info extends React.Component<RootProps, any> {
  render() {
    return (
      <div className={"info"}>
        <Header {...this.props} />
        <Custom url="/info.html" />
      </div>
    );
  }
}
