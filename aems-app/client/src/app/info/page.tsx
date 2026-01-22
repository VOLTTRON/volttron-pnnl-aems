"use client";

import { useState, useEffect } from "react";
import { Spinner } from "@blueprintjs/core";
import Custom from "@/app/components/common/custom";

export default function InfoPage() {
  const [templateUrl, setTemplateUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch deployment info from server API
    fetch("/api/grafana/info")
      .then((res) => res.json())
      .then((data: { campus?: string; building?: string }) => {
        const campus = data.campus?.toLowerCase();
        const building = data.building?.toLowerCase();
        
        // Build template URL
        if (campus && building) {
          setTemplateUrl(`/static/templates/${campus}-${building}/info.html`);
        } else {
          setTemplateUrl("/static/templates/default/info.html");
        }
      })
      .catch((error) => {
        console.error("Failed to fetch deployment info:", error);
        // Fallback to default template
        setTemplateUrl("/static/templates/default/info.html");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading || !templateUrl) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
        <Spinner size={50} />
      </div>
    );
  }

  return <Custom url={templateUrl} />;
}
