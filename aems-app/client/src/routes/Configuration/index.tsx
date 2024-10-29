import Configuration from "./Configuration";
import RouteBase from "routes/RouteBase";

const Root = (props: any) => <RouteBase {...props} renderRoute={(p) => <Configuration {...p} />} />;

export default Root;
