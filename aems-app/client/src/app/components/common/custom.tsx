import { useContext, useEffect, useState } from "react";
import { NotificationContext } from "../providers";

export default function Custom(props: { url: string }) {
  const { url } = props;
  const [content, setContent] = useState("");
  const { createNotification } = useContext(NotificationContext);

  useEffect(() => {
    // Function to try fetching from URLs with fallback
    const fetchWithFallback = async (primaryUrl: string): Promise<string> => {
      try {
        const response = await fetch(primaryUrl);
        if (response.ok) {
          return await response.text();
        }
        
        // If primary URL fails and it's a deployment-specific template, try default
        if (primaryUrl.includes("/static/templates/") && !primaryUrl.includes("/static/templates/default/")) {
          const filename = primaryUrl.split("/").pop();
          const fallbackUrl = `/static/templates/default/${filename}`;
          
          const fallbackResponse = await fetch(fallbackUrl);
          if (fallbackResponse.ok) {
            return await fallbackResponse.text();
          }
        }
        
        throw new Error(`Failed to load content from ${primaryUrl}`);
      } catch (error) {
        throw error;
      }
    };

    fetchWithFallback(url)
      .then((text) => {
        setContent(text);
      })
      .catch((error: Error | string) => {
        createNotification?.(typeof error === "string" ? error : error?.message);
      });
  }, [createNotification, url]);

  return <div dangerouslySetInnerHTML={{ __html: content }}></div>;
}
