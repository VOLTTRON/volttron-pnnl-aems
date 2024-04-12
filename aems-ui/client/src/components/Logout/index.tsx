import "./style.scss";

import { Button, Dialog, H2 } from "@blueprintjs/core";
import {
  DIALOG_BODY,
  DIALOG_FOOTER,
  DIALOG_FOOTER_ACTIONS,
  DIALOG_HEADER,
} from "@blueprintjs/core/lib/esm/common/classes";
import { logoutUser, selectLogoutUser, selectLogoutUserError } from "controllers/user/action";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Analytics } from "utils/analytics";
import moment from "moment";
import { useNavigate } from "react-router-dom";

interface LogoutProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Logout(props: LogoutProps) {
  const { isOpen, onClose } = props;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const success = useSelector(selectLogoutUser);
  const error = useSelector(selectLogoutUserError);

  const [submitted, setSubmitted] = useState("");

  const shouldClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    const timestamp = success?.timestamp ? moment(success.timestamp) : undefined;
    if (submitted && timestamp && timestamp.isAfter(moment(submitted))) {
      if (onClose) {
        shouldClose();
      } else {
        navigate("/");
      }
    }
  }, [success, submitted, setSubmitted, onClose, shouldClose, navigate]);

  useEffect(() => {
    if (isOpen) {
      Analytics.getInstance().event("Logout", "Opened");
    }
    return () => {};
  }, [isOpen]);

  const handleSubmit = (event: any) => {
    event.preventDefault();
    setSubmitted(moment().format());
    dispatch(logoutUser());
  };

  const handleRedirect = () => navigate("/");

  return (
    <Dialog className="logout" isOpen={isOpen}>
      <div className={DIALOG_HEADER}>
        <H2>Log Out</H2>
        <Button minimal intent="primary" icon="cross" onClick={onClose ? shouldClose : handleRedirect} />
      </div>
      <form onSubmit={handleSubmit}>
        <div className={DIALOG_BODY}>{error ? <p className="red">{error.error}</p> : ""}</div>
        <div className={DIALOG_FOOTER}>
          <div className={DIALOG_FOOTER_ACTIONS}>
            <Button
              className="button-right"
              minimal
              intent="primary"
              key="cancel"
              text="Cancel"
              onClick={onClose ? shouldClose : handleRedirect}
            />
            <Button className="button-submit" intent="primary" type="submit" text="Log Out" />
          </div>
        </div>
      </form>
    </Dialog>
  );
}
