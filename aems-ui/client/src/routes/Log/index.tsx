import Log from "./Log";
import RouteBase from "routes/RouteBase";

const Root = (props: any) => <RouteBase {...props} renderRoute={(p) => <Log {...p} />} />;

export default Root;
