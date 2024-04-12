import Control from "./Control";
import RouteBase from "routes/RouteBase";

const Root = (props: any) => <RouteBase {...props} renderRoute={(p) => <Control {...p} />} />;

export default Root;
