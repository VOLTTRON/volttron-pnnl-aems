import { Callout, Intent } from "@blueprintjs/core";
import React from "react";

class NotFound extends React.Component {
  render() {
    return (
      <div>
        <Callout intent={Intent.WARNING} title={`The page you requested could not be found.`} />
      </div>
    );
  }
}

export default NotFound;
