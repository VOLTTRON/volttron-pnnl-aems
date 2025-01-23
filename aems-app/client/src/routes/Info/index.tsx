import Info from "./Info";
import RouteBase from "routes/RouteBase";

const Root = (props: any) => <RouteBase {...props} renderRoute={(p) => <Info {...p} />} />;

export default Root;
