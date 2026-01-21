"use client";

import { useState, useEffect } from "react";
import { Button, Card, HTMLSelect, Tab, Tabs, Callout } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import Custom from "@/app/components/common/custom";

// Available template deployments
const DEPLOYMENTS = [
  { value: "default", label: "Default" },
  { value: "pnnl-rob", label: "PNNL-ROB" },
  { value: "gmreit-2080oakley", label: "GMREIT-2080Oakley" },
  { value: "gmreit-9964university", label: "GMREIT-9964University" },
];

const TEMPLATES = [
  { id: "welcome", label: "Welcome" },
  { id: "info", label: "Info" },
];

export default function TemplatePreviewPage() {
  const [selectedDeployment, setSelectedDeployment] = useState("default");
  const [selectedTab, setSelectedTab] = useState<string>("welcome");
  const [key, setKey] = useState(0);

  // Build the template URL based on selected deployment
  const getTemplateUrl = (templateId: string) => {
    return `/static/templates/${selectedDeployment}/${templateId}.html`;
  };

  // Get current environment variables
  const envCampus = process.env.NEXT_PUBLIC_VOLTTRON_CAMPUS || "Not set";
  const envBuilding = process.env.NEXT_PUBLIC_VOLTTRON_BUILDING || "Not set";

  // Force re-render when deployment changes
  useEffect(() => {
    setKey((prev) => prev + 1);
  }, [selectedDeployment]);

  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1>Template Preview Tool</h1>
        <p style={{ color: "#5c7080", marginTop: "5px" }}>
          Preview and test deployment-specific welcome and info templates without changing environment variables.
        </p>
      </div>

      {/* Environment Info */}
      <Callout intent="primary" icon={IconNames.INFO_SIGN} style={{ marginBottom: "20px" }}>
        <strong>Current Environment:</strong> VOLTTRON_CAMPUS={envCampus}, VOLTTRON_BUILDING={envBuilding}
        <br />
        <small>The previewer below shows templates from different deployments regardless of these settings.</small>
      </Callout>

      {/* Controls */}
      <Card style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <strong>Deployment:</strong>
            <HTMLSelect
              value={selectedDeployment}
              onChange={(e) => setSelectedDeployment(e.target.value)}
              options={DEPLOYMENTS}
              fill={false}
              large
            />
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>
            <Button icon={IconNames.REFRESH} text="Refresh" onClick={() => window.location.reload()} minimal />
          </div>
        </div>
      </Card>

      {/* Template Path Info */}
      <Callout intent="none" icon={IconNames.FOLDER_OPEN} style={{ marginBottom: "20px", fontSize: "13px" }}>
        <strong>Template Directory:</strong> <code>/static/templates/{selectedDeployment}/</code>
        <br />
        <strong>Current File:</strong>{" "}
        <code>
          /static/templates/{selectedDeployment}/{selectedTab}.html
        </code>
      </Callout>

      {/* Tabs */}
      <Card>
        <Tabs
          id="template-tabs"
          selectedTabId={selectedTab}
          onChange={(newTabId) => setSelectedTab(newTabId as string)}
          large
        >
          {TEMPLATES.map((template) => (
            <Tab
              key={template.id}
              id={template.id}
              title={template.label}
              panel={
                <div style={{ marginTop: "20px" }}>
                  <div
                    style={{
                      borderRadius: "3px",
                      minHeight: "600px",
                      padding: "20px",
                    }}
                  >
                    <Custom url={getTemplateUrl(template.id)} key={`${key}-${template.id}`} />
                  </div>

                  <Callout intent="success" icon={IconNames.TICK} style={{ marginTop: "15px", fontSize: "12px" }}>
                    Using the same <code>Custom</code> component that the app uses. This preview shows exactly how the
                    template will appear in the actual application.
                  </Callout>
                </div>
              }
            />
          ))}
          <Tabs.Expander />
        </Tabs>
      </Card>

      {/* Instructions */}
      <Card style={{ marginTop: "20px" }}>
        <h3>How to Use</h3>
        <ol style={{ marginLeft: "20px", color: "#5c7080" }}>
          <li>Select a deployment from the dropdown above</li>
          <li>Switch between Welcome and Info tabs to preview templates</li>
          <li>The Custom component automatically loads the correct template based on the selected deployment</li>
          <li>
            Edit template files in <code>/static/templates/&#123;deployment&#125;/*.html</code>
          </li>
          <li>Click &quot;Refresh&quot; to see your changes</li>
        </ol>

        <h3 style={{ marginTop: "20px" }}>Creating New Deployments</h3>
        <ol style={{ marginLeft: "20px", color: "#5c7080" }}>
          <li>
            Create a new directory: <code>/static/templates/&#123;campus&#125;-&#123;building&#125;/</code>
          </li>
          <li>
            Copy template files from <code>default/</code>
          </li>
          <li>Edit the templates to customize for your deployment</li>
          <li>Add the deployment to the DEPLOYMENTS array in this page (optional)</li>
          <li>
            Set environment variables in <code>aems-app/.env</code> to use in production
          </li>
        </ol>
      </Card>
    </div>
  );
}
