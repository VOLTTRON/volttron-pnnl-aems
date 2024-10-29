import Home from "./Home";
import RouteBase from "routes/RouteBase";

const Root = (props: any) => <RouteBase {...props} renderRoute={(p) => <Home {...p} />} />;

export default Root;
