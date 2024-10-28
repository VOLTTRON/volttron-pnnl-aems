"use client";

import { useSubscription } from "@apollo/client";
import { ReadBannersQuery, SubscribeBannersDocument } from "@/generated/graphql-codegen/graphql";
import { Intent, OverlayToaster, Position, Toast2 } from "@blueprintjs/core";
import { useState } from "react";

export function Banner() {
  const [banner, setBanner] = useState<NonNullable<ReadBannersQuery["readBanners"]>[0] | undefined>(undefined);
  const [shown, setShown] = useState([] as string[]);

  useSubscription(SubscribeBannersDocument, {
    onData: ({ data }) => {
      const now = Date.now();
      const banner = data.data?.readBanners
        ?.filter((v) => (v.expiration?.valueOf() ?? now) > now && !shown.includes(v.id ?? ""))
        .find((v) => v);
      if (banner) {
        setBanner(banner);
        setShown([...shown, banner.id ?? ""]);
      }
    },
  });

  return (
    <OverlayToaster position={Position.TOP}>
      {banner && <Toast2 message={banner.message} intent={Intent.SUCCESS} onDismiss={() => setBanner(undefined)} />}
    </OverlayToaster>
  );
}
