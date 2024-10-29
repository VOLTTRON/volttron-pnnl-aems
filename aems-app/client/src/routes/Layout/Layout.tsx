import "./style.scss";

import { Footer } from "components";
import Message from "components/Message";
import { Outlet } from "react-router";
import { RootProps } from "routes";

export interface LayoutProps extends RootProps {}

const Layout = (props: LayoutProps) => {
  const { currentRoute } = props;
  return (
    <div className={currentRoute?.footer? "layout" : "layout without-footer"}>
      <Outlet />
      <Message />
      {currentRoute?.footer && <Footer {...props} />}
    </div>
  );
};

export default Layout;
