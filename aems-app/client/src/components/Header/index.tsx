import "./style.scss";

import HeaderContent from "./HeaderContent";
import { RootProps } from "routes";

const Header = (props: RootProps) => {
  return <HeaderContent {...props} />;
};

export default Header;
