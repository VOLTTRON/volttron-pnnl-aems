import Account from "./Account";
import RouteBase from "routes/RouteBase";

const Root = (props: any) => <RouteBase {...props} renderRoute={(p) => <Account {...p} />} />;

export default Root;
