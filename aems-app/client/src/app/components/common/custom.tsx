import { useContext, useEffect, useState } from "react";
import { NotificationContext } from "../providers";

export default function Custom(props: { url: string }) {
  const { url } = props;
  const [welcome, setWelcome] = useState("");
  const { createNotification } = useContext(NotificationContext);

  useEffect(() => {
    // Extract filename from the original URL (e.g., "welcome.html" or "info.html")
    const filename = url.split("/").pop() || "";

    // Build array of URLs to try, in order of preference
    const urlsToTry: string[] = [];

    // Try deployment-specific template first if environment variables are available
    if (process.env.NEXT_PUBLIC_VOLTTRON_CAMPUS && process.env.NEXT_PUBLIC_VOLTTRON_BUILDING) {
      const campus = process.env.NEXT_PUBLIC_VOLTTRON_CAMPUS.toLowerCase();
      const building = process.env.NEXT_PUBLIC_VOLTTRON_BUILDING.toLowerCase();
      urlsToTry.push(`/static/templates/${campus}-${building}/${filename}`);
    }

    // Then try default template
    urlsToTry.push(`/static/templates/default/${filename}`);

    // Finally, fall back to original URL (for backward compatibility)
    urlsToTry.push(url);

    // Function to try fetching from each URL in sequence
    const tryFetch = async (urls: string[]): Promise<string> => {
      for (const tryUrl of urls) {
        try {
          const response = await fetch(tryUrl);
          if (response.ok) {
            return await response.text();
          }
        } catch (error) {
          // Continue to next URL
          continue;
        }
      }
      // If all URLs fail, throw error
      throw new Error(`Failed to load content from any template location`);
    };

    tryFetch(urlsToTry)
      .then((text) => {
        setWelcome(text);
      })
      .catch((error: Error | string) => {
        createNotification?.(typeof error === "string" ? error : error?.message);
      });
  }, [createNotification, url]);

  return <div dangerouslySetInnerHTML={{ __html: welcome }}></div>;
}
