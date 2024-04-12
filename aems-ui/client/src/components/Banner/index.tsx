import { ILog, readLogs, readLogsPoll, selectReadLogs } from "controllers/logs/action";
import { Intent, Position, Toast, Toaster } from "@blueprintjs/core";
import { clone, isEmpty } from "lodash";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { LogType } from "common";
import { fastPollInterval } from "controllers/poll/action";

function Banner() {
  const logs = useSelector(selectReadLogs) as ILog[] | undefined;
  const [cleared, setCleared] = useState([] as number[]);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(readLogs({ type: LogType.BannerType.label }));
    dispatch(readLogsPoll(fastPollInterval));
  }, [dispatch]);
  const clearBanner = useCallback(
    (id: number) => () => {
      const temp = clone(cleared);
      temp.push(id);
      setCleared(temp);
    },
    [cleared]
  );
  const banner =
    logs &&
    logs
      .filter((k) => k.type === LogType.BannerType.label)
      .filter((k) => !cleared.includes(k.id || k.sequence || 0))
      .find(() => true);
  const showBanner = !isEmpty(banner && banner.message);
  return (
    <Toaster position={Position.TOP}>
      {banner && showBanner && (
        <Toast
          message={banner.message}
          icon="info-sign"
          intent={Intent.DANGER}
          onDismiss={clearBanner(banner.id || banner.sequence || 0)}
          timeout={0}
        />
      )}
    </Toaster>
  );
}

export default Banner;
