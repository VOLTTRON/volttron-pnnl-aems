import Layout from "./Layout";
import RouteBase from "routes/RouteBase";

const Root = (props: any) => <RouteBase {...props} renderRoute={(p) => <Layout {...p} />} />;

export default Root;
