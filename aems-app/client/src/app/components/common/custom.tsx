import { useContext, useEffect, useState } from "react";
import { NotificationContext } from "../providers";

export default function Custom(props: { url: string }) {
  const { url } = props;
  const [welcome, setWelcome] = useState("");
  const { createNotification } = useContext(NotificationContext);
  useEffect(() => {
    fetch(url)
      .then((response) => {
        return response.text();
      })
      .then((text) => {
        setWelcome(text);
      })
      .catch((error: Error | string) => {
        createNotification?.(typeof error === "string" ? error : error?.message);
      });
  }, [createNotification, url]);

  return <div dangerouslySetInnerHTML={{ __html: welcome }}></div>;
}
