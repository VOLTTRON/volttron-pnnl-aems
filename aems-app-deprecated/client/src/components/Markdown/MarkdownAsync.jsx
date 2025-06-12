import { useEffect, useState } from "react";
import Markdown from "components/Markdown";

export default function MarkdownAsync(props) {
  const { url, raw } = props;
  const [markDown, setMarkDown] = useState("");
  useEffect(() => {
    if (url) {
      fetch(url)
        .then((response) => {
          return response.text();
        })
        .then((text) => {
          setMarkDown(text);
        });
    } else {
      setMarkDown();
    }
  }, [url]);

  return <Markdown markdown={markDown} raw={raw} />;
}
