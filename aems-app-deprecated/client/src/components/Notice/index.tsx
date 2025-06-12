import "./style.scss";

import { Button, Dialog, H2 } from "@blueprintjs/core";
import {
  DIALOG_BODY,
  DIALOG_FOOTER,
  DIALOG_FOOTER_ACTIONS,
  DIALOG_HEADER,
} from "@blueprintjs/core/lib/esm/common/classes";
import { selectNotice, setNotice } from "controllers/common/action";
import { useDispatch, useSelector } from "react-redux";

import { Analytics } from "utils/analytics";
import { useEffect } from "react";

interface NoticeProps {}

export default function Notice(props: NoticeProps) {
  const dispatch = useDispatch();

  const notice = useSelector(selectNotice);

  useEffect(() => {
    Analytics.getInstance().event("Notice", "Opened");
    return () => {};
  }, []);

  const handleSubmit = (event: any) => {
    event.preventDefault();
    dispatch(setNotice({ viewed: true }));
  };

  return (
    <Dialog className="notice" isOpen={!notice?.viewed}>
      <div className={DIALOG_HEADER}>
        <H2>Notice</H2>
      </div>
      <form onSubmit={handleSubmit}>
        <div className={DIALOG_BODY}>
          <p>{process.env.REACT_APP_NOTICE_CONTENT}</p>
        </div>
        <div className={DIALOG_FOOTER}>
          <div className={DIALOG_FOOTER_ACTIONS}>
            <Button className="button-submit" intent="primary" type="submit" text="Accept" />
          </div>
        </div>
      </form>
    </Dialog>
  );
}
