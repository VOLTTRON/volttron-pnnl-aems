import { Intent, Position, Toast, Toaster } from "@blueprintjs/core";
import { clearError, selectErrorTokens } from "controllers/error/action";
import { useDispatch, useSelector } from "react-redux";

import { isEmpty } from "lodash";

function Warning() {
  const errors = useSelector(selectErrorTokens);
  const dispatch = useDispatch();
  const errorKey =
    errors &&
    Object.keys(errors)
      .filter((k) => !errors[k].cleared)
      .sort((a, b) => errors[a].timestamp - errors[b].timestamp)
      .find(() => true);
  const errorToken = errors && errorKey && errors[errorKey];
  const showError = !isEmpty(errorToken && errorToken.error);
  return (
    <Toaster position={Position.BOTTOM_LEFT}>
      {showError && (
        <Toast
          message={errorToken.error}
          icon="warning-sign"
          intent={Intent.WARNING}
          onDismiss={() => dispatch(clearError(errorKey))}
          timeout={Math.min(Math.max((errorToken && errorToken.error ? errorToken.error.length : 0) * 50, 3000), 8000)}
        />
      )}
    </Toaster>
  );
}

export default Warning;
