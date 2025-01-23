import "./style.scss";

import FooterContent from "components/Footer/FooterContent";
import { RouteProps } from "routes";

function Footer(props: RouteProps) {
  return (
    <div className="footer">
      <FooterContent {...props} />
    </div>
  );
}

export default Footer;
