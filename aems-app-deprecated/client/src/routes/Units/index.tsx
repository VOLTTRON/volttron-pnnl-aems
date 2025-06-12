import RouteBase from "routes/RouteBase";
import Units from "./Units";

const Root = (props: any) => <RouteBase {...props} renderRoute={(p) => <Units {...p} />} />;

export default Root;
