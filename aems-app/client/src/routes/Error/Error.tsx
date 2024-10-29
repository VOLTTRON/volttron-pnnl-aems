import { Callout, Intent } from "@blueprintjs/core";

import React from "react";

class Error extends React.Component {
  render() {
    return (
      <div>
        <Callout intent={Intent.DANGER} title={`${process.env.REACT_APP_TITLE} has encountered an error.`} />
      </div>
    );
  }
}

export default Error;
