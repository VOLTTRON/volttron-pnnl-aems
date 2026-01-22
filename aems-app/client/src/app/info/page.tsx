import Custom from "@/app/components/common/custom";

export default function InfoPage() {
  // Get environment variables at runtime on the server
  const campus = process.env.VOLTTRON_CAMPUS?.toLowerCase();
  const building = process.env.VOLTTRON_BUILDING?.toLowerCase();

  // Build template URL based on environment variables
  let templateUrl = "/static/templates/default/info.html";
  if (campus && building) {
    templateUrl = `/static/templates/${campus}-${building}/info.html`;
  }

  return <Custom url={templateUrl} />;
}
