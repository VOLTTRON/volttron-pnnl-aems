"use client";

import { useQuery, useSubscription } from "@apollo/client";
import { OrderBy, ReadBannersDocument, ReadBannersQuery, SubscribeBannersDocument } from "@/graphql-codegen/graphql";
import { Intent, OverlayToaster, Position, Toast2 } from "@blueprintjs/core";
import { useEffect, useState } from "react";

export function Banner() {
  const [banner, setBanner] = useState<NonNullable<ReadBannersQuery["readBanners"]>[0] | undefined>(undefined);
  const [shown, setShown] = useState([] as string[]);

  const {
    data: queryData,
    startPolling,
    stopPolling,
  } = useQuery(ReadBannersDocument, {
    variables: {
      where: {},
      orderBy: { createdAt: OrderBy.Desc },
    },
  });

  const { data: subscribeData } = useSubscription(SubscribeBannersDocument, {
    variables: {
      where: {},
      orderBy: { createdAt: OrderBy.Desc },
    },
    onComplete() {
      stopPolling();
    },
    onError(error) {
      startPolling(5000);
    },
  });

  const data = subscribeData ?? queryData;

  useEffect(() => {
    const now = new Date().getTime();
    const banner = data?.readBanners?.find(
      (v) => (new Date(v.expiration ?? "")?.getTime() ?? 0) > now && !shown.includes(v.id ?? ""),
    );
    if (banner) {
      setBanner(banner);
      setShown([...shown, banner.id ?? ""]);
    }
  }, [setBanner, shown, setShown, data]);

  return (
    <OverlayToaster position={Position.TOP}>
      {banner && <Toast2 message={banner.message} intent={Intent.SUCCESS} onDismiss={() => setBanner(undefined)} />}
    </OverlayToaster>
  );
}
