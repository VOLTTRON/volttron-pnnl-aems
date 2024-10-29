import "./style.scss";

import { RouteProps } from "routes";
import moment from "moment";

export default function FooterContent(props: RouteProps) {
  return (
    <div className="footer-content">
      <div className="footer-right">
        <div>Last update: {moment(process.env.REACT_APP_DATE).format("MMMM YYYY")}</div>
      </div>
    </div>
  );
}
