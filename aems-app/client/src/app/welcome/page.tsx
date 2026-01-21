"use client";

import { useMemo } from "react";
import Custom from "@/app/components/common/custom";

export default function WelcomePage() {
  const templateUrl = useMemo(() => {
    // Get environment variables
    const campus = process.env.NEXT_PUBLIC_VOLTTRON_CAMPUS?.toLowerCase();
    const building = process.env.NEXT_PUBLIC_VOLTTRON_BUILDING?.toLowerCase();

    // If both environment variables are set, use deployment-specific template
    if (campus && building) {
      return `/static/templates/${campus}-${building}/welcome.html`;
    }

    // Otherwise, use default template
    return "/static/templates/default/welcome.html";
  }, []);

  return <Custom url={templateUrl} />;
}
