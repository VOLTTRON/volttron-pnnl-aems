"use client";

import styles from "./page.module.scss";
import { useContext, useEffect, useState } from "react";
import { Alignment, Button, Card, CardList, Collapse, Intent } from "@blueprintjs/core";
import { PaletteDemo } from "./palette";
import { IconNames } from "@blueprintjs/icons";
import { LoadingContext, LoadingType, NotificationContext, NotificationType } from "@/app/components/providers";
import { Chart } from "./chart";
import { Locations } from "./locations";
import { Map } from "./map";
import { Table } from "@/app/components/common";
import { useRouter } from "next/navigation";
import { findBook, findBooks } from "./books";

type Book = typeof findBook extends (isbn: string) => Promise<infer T> ? T & {} : never;

function Section({
  title,
  open,
  setOpen,
  children,
}: {
  title: string;
  open: string;
  setOpen: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <Card className={styles.section} interactive>
      <Button
        rightIcon={title === open ? IconNames.CHEVRON_UP : IconNames.CHEVRON_DOWN}
        onClick={() => setOpen(title === open ? "" : title)}
        outlined
        minimal
        fill
        alignText={Alignment.LEFT}
        intent={Intent.NONE}
      >
        <h3>{title}</h3>
      </Button>
      <Collapse isOpen={title === open}>{children}</Collapse>
    </Card>
  );
}

export default function Page() {
  const [open, setOpen] = useState("");
  const [error, setError] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);

  const router = useRouter();

  const { createLoading, clearLoading } = useContext(LoadingContext);
  const { createNotification } = useContext(NotificationContext);

  useEffect(() => {
    findBooks().then((v) => setBooks(v));
  }, []);

  function localLoading() {
    setTimeout(() => {
      const token = createLoading?.(LoadingType.GLOBAL);
      if (token) {
        try {
          setTimeout(() => {
            clearLoading?.(token);
          }, 5000);
        } catch (_e) {
          clearLoading?.(token);
        }
      }
    }, 1000);
  }

  if (error) {
    throw new Error("Goodbye World!");
  }

  return (
    <div className={styles.page}>
      <CardList>
        <Section title="Palette" open={open} setOpen={setOpen}>
          <PaletteDemo />
        </Section>
        <Section title="Loading" open={open} setOpen={setOpen}>
          <div>
            <Button intent={Intent.PRIMARY} onClick={localLoading}>
              Start Global Loading
            </Button>
          </div>
        </Section>
        <Section title="Error" open={open} setOpen={setOpen}>
          <div>
            <Button intent={Intent.PRIMARY} onClick={() => setError(true)}>
              Throw Error
            </Button>
          </div>
        </Section>
        <Section title="Notification" open={open} setOpen={setOpen}>
          <div>
            <Button
              intent={Intent.WARNING}
              onClick={() => createNotification?.("Hello World!", NotificationType.Notification)}
            >
              Send Notification
            </Button>
          </div>
          <div>
            <Button
              intent={Intent.DANGER}
              onClick={() => createNotification?.("You broke it!", NotificationType.Error)}
            >
              Send Error
            </Button>
          </div>
        </Section>
        <Section title="Charts" open={open} setOpen={setOpen}>
          <Chart />
        </Section>
        <Section title="Dynamic Routing" open={open} setOpen={setOpen}>
          <div className={styles.table}>
            <Table
              rowKey="isbn"
              rows={books}
              columns={[{ field: "title", label: "Title", type: "string" }]}
              actions={{
                values: [{ id: "view", icon: IconNames.EYE_OPEN, intent: Intent.PRIMARY }],
                onClick(id, row) {
                  switch (id) {
                    case "view":
                      return router.push(`/demo/${row.isbn}`);
                    default:
                      return;
                  }
                },
              }}
            />
          </div>
        </Section>
        <Section title="Nominatim" open={open} setOpen={setOpen}>
          <Locations />
        </Section>
        <Section title="Mapbox" open={open} setOpen={setOpen}>
          <div className={styles.map}>
            <Map />
          </div>
        </Section>
      </CardList>
    </div>
  );
}
