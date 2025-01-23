import "./style.scss";

import { Toast, Toaster } from "@blueprintjs/core";
import { selectMessage, setMessage } from "controllers/common/action";
import { useDispatch, useSelector } from "react-redux";

import { isEmpty } from "lodash";

function Message() {
  const message = useSelector(selectMessage);
  const dispatch = useDispatch();
  return (
    <Toaster className="message" position="bottom">
      {!isEmpty(message) && (
        <Toast icon="tick-circle" message={message} onDismiss={() => dispatch(setMessage(""))} timeout={5000} />
      )}
    </Toaster>
  );
}

export default Message;
