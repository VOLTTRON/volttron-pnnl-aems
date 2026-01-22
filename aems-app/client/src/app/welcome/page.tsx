import Custom from "@/app/components/common/custom";

export default function WelcomePage() {
  // Get environment variables at runtime on the server
  const campus = process.env.VOLTTRON_CAMPUS?.toLowerCase();
  const building = process.env.VOLTTRON_BUILDING?.toLowerCase();

  // Build template URL based on environment variables
  let templateUrl = "/static/templates/default/welcome.html";
  if (campus && building) {
    templateUrl = `/static/templates/${campus}-${building}/welcome.html`;
  }

  return <Custom url={templateUrl} />;
}
