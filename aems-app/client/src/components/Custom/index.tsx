import { useEffect, useState } from "react";

export default function Custom(props: { url: string }) {
  const { url } = props;
  const [welcome, setWelcome] = useState("");
  useEffect(() => {
    fetch(url)
      .then((response) => {
        return response.text();
      })
      .then((text) => {
        setWelcome(text);
      });
  }, [url]);

  return <div dangerouslySetInnerHTML={{ __html: welcome }}></div>;
}
