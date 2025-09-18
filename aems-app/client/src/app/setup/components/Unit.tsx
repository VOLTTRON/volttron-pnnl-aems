import { InputGroup, Label, NumericInput, Switch, FormGroup, HTMLSelect, Button, Tooltip } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { cloneDeep, merge } from "lodash";
import { createGoogleMapsUrl, formatLocationName } from "@/utils/location";
import { Zone, DeepPartial } from "@local/common";
import { ReadUnitQuery } from "@/graphql-codegen/graphql";

type UnitType = NonNullable<ReadUnitQuery["readUnit"]>;

interface UnitProps {
  unit: UnitType | null;
  editing: DeepPartial<UnitType> | null;
  setEditing?: (editing: DeepPartial<UnitType> | null) => void;
  readOnly?: boolean;
}

export function Unit({ unit, editing, setEditing, readOnly = false }: UnitProps) {
  const value = merge({}, unit, editing);
  const {
    location,
    label,
    zoneLocation,
    heatPumpBackup,
    heatPumpLockout,
    economizer,
    economizerSetpoint,
    coolingLockout,
    zoneMass,
    zoneOrientation,
    zoneBuilding,
    coolingCapacity,
    compressors,
    optimalStartLockout,
    optimalStartDeviation,
    earliestStart,
    latestStart,
    heatPump,
  } = value;

  return (
    <div style={{ padding: "1rem" }}>
      <FormGroup label="Unit Information">
        <Label>
          <b>Unit Label</b>
          <InputGroup
            type="text"
            value={label ?? ""}
            onChange={(e) => {
              const clone = cloneDeep(editing ?? {});
              clone.label = e.target.value;
              setEditing?.(clone);
            }}
            readOnly={readOnly}
            placeholder="Enter unit label"
          />
        </Label>
      </FormGroup>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
        <FormGroup label="Unit Location">
          <Label>
            <b>Unit Location</b>
            <InputGroup
              type="text"
              value={formatLocationName(location)}
              readOnly
              rightElement={
                <Tooltip content={createGoogleMapsUrl(location)}>
                  <Button
                    icon={IconNames.MAP}
                    onClick={() => window.open(createGoogleMapsUrl(location), "_blank")}
                    minimal
                  />
                </Tooltip>
              }
            />
          </Label>
        </FormGroup>

        <FormGroup label="Location Update">
          <Label>
            <b>Location Name</b>
            <InputGroup
              type="text"
              value={location?.name ?? ""}
              onChange={(e) => {
                const clone = cloneDeep(editing ?? {});
                clone.location = clone?.location ?? {};
                clone.location.name = e.target.value;
                setEditing?.(clone);
              }}
              disabled={readOnly}
              placeholder="Enter location name"
            />
          </Label>
        </FormGroup>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
        <FormGroup label="Coordinates">
          <Label>
            <b>Longitude</b>
            <NumericInput
              value={location?.longitude || 0}
              onValueChange={(value) => {
                const clone = cloneDeep(editing ?? {});
                clone.location = clone.location ?? {};
                clone.location.longitude = value;
                setEditing?.(clone);
              }}
              min={-180}
              max={180}
              stepSize={0.0001}
              minorStepSize={0.0001}
              fill
              disabled={readOnly}
            />
          </Label>
        </FormGroup>

        <FormGroup label="Latitude">
          <Label>
            <b>Latitude</b>
            <NumericInput
              value={location?.latitude || 0}
              onValueChange={(value) => {
                const clone = cloneDeep(editing ?? {});
                clone.location = clone.location ?? {};
                clone.location.latitude = value;
                setEditing?.(clone);
              }}
              min={-90}
              max={90}
              stepSize={0.0001}
              minorStepSize={0.0001}
              fill
              disabled={readOnly}
            />
          </Label>
        </FormGroup>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
        <FormGroup label="Zone Configuration">
          <Label>
            <b>Zone Location</b>
            <HTMLSelect
              value={zoneLocation || ""}
              onChange={(e) => {
                const clone = cloneDeep(editing ?? {});
                clone.zoneLocation = e.target.value;
                setEditing?.(clone);
              }}
              disabled={readOnly}
              options={[
                { value: "", label: "Select zone location..." },
                ...Zone.values.filter((v) => v.type === "location").map((z) => ({ value: z.name, label: z.label })),
              ]}
            />
          </Label>
        </FormGroup>

        <FormGroup label="Zone Mass">
          <Label>
            <b>Zone Mass</b>
            <HTMLSelect
              value={zoneMass || ""}
              onChange={(e) => {
                const clone = cloneDeep(editing ?? {});
                clone.zoneMass = e.target.value;
                setEditing?.(clone);
              }}
              disabled={readOnly}
              options={[
                { value: "", label: "Select zone mass..." },
                ...Zone.values.filter((v) => v.type === "mass").map((z) => ({ value: z.name, label: z.label })),
              ]}
            />
          </Label>
        </FormGroup>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
        <FormGroup label="Zone Orientation">
          <Label>
            <b>Zone Orientation</b>
            <HTMLSelect
              value={zoneOrientation || ""}
              onChange={(e) => {
                const clone = cloneDeep(editing ?? {});
                clone.zoneOrientation = e.target.value;
                setEditing?.(clone);
              }}
              disabled={readOnly}
              options={[
                { value: "", label: "Select orientation..." },
                ...Zone.values.filter((v) => v.type === "orientation").map((z) => ({ value: z.name, label: z.label })),
              ]}
            />
          </Label>
        </FormGroup>

        <FormGroup label="Zone Building Type">
          <Label>
            <b>Building Type</b>
            <HTMLSelect
              value={zoneBuilding || ""}
              onChange={(e) => {
                const clone = cloneDeep(editing ?? {});
                clone.zoneBuilding = e.target.value;
                setEditing?.(clone);
              }}
              disabled={readOnly}
              options={[
                { value: "", label: "Select building type..." },
                ...Zone.values.filter((v) => v.type === "building").map((z) => ({ value: z.name, label: z.label })),
              ]}
            />
          </Label>
        </FormGroup>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
        <FormGroup label="Cooling Capacity">
          <Label>
            <b>Rated Cooling Capacity (tons)</b>
            <NumericInput
              value={coolingCapacity || 0}
              onValueChange={(value) => {
                const clone = cloneDeep(editing ?? {});
                clone.coolingCapacity = value;
                setEditing?.(clone);
              }}
              min={0}
              max={100}
              stepSize={0.5}
              fill
              disabled={readOnly}
            />
          </Label>
        </FormGroup>

        <FormGroup label="Compressors">
          <Label>
            <b>Number of Compressors</b>
            <NumericInput
              value={compressors || 1}
              onValueChange={(value) => {
                const clone = cloneDeep(editing ?? {});
                clone.compressors = value;
                setEditing?.(clone);
              }}
              min={1}
              max={10}
              stepSize={1}
              fill
              disabled={readOnly}
            />
          </Label>
        </FormGroup>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
        <FormGroup label="Optimal Start Configuration">
          <Label>
            <b>Optimal Start Lockout Temperature (°F)</b>
            <NumericInput
              value={optimalStartLockout || 35}
              onValueChange={(value) => {
                const clone = cloneDeep(editing ?? {});
                clone.optimalStartLockout = value;
                setEditing?.(clone);
              }}
              min={0}
              max={50}
              stepSize={1}
              fill
              disabled={readOnly}
            />
          </Label>
        </FormGroup>

        <FormGroup label="Temperature Deviation">
          <Label>
            <b>Allowable Zone Temperature Deviation (°F)</b>
            <NumericInput
              value={optimalStartDeviation || 2}
              onValueChange={(value) => {
                const clone = cloneDeep(editing ?? {});
                clone.optimalStartDeviation = value;
                setEditing?.(clone);
              }}
              min={0.5}
              max={5}
              stepSize={0.5}
              fill
              disabled={readOnly}
            />
          </Label>
        </FormGroup>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
        <FormGroup label="Start Time Limits">
          <Label>
            <b>Earliest Start Time (minutes before occupancy)</b>
            <NumericInput
              value={earliestStart || 120}
              onValueChange={(value) => {
                const clone = cloneDeep(editing ?? {});
                clone.earliestStart = value;
                setEditing?.(clone);
              }}
              min={30}
              max={300}
              stepSize={15}
              fill
              disabled={readOnly}
            />
          </Label>
        </FormGroup>

        <FormGroup label="Latest Start Time">
          <Label>
            <b>Latest Start Time (minutes before occupancy)</b>
            <NumericInput
              value={latestStart || 30}
              onValueChange={(value) => {
                const clone = cloneDeep(editing ?? {});
                clone.latestStart = value;
                setEditing?.(clone);
              }}
              min={15}
              max={120}
              stepSize={15}
              fill
              disabled={readOnly}
            />
          </Label>
        </FormGroup>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <FormGroup>
          <Label>
            <Switch
              checked={heatPump || false}
              onChange={(e) => {
                const clone = cloneDeep(editing ?? {});
                clone.heatPump = e.currentTarget.checked;
                setEditing?.(clone);
              }}
              disabled={readOnly}
              label="Heat Pump System"
            />
          </Label>
        </FormGroup>
      </div>

      {heatPump && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
          <FormGroup label="Heat Pump Backup">
            <Label>
              <b>Electric Backup Capacity (kW)</b>
              <NumericInput
                value={heatPumpBackup || 0}
                onValueChange={(value) => {
                  const clone = cloneDeep(editing ?? {});
                  clone.heatPumpBackup = value;
                  setEditing?.(clone);
                }}
                min={0}
                max={50}
                stepSize={0.5}
                fill
                disabled={readOnly}
              />
            </Label>
          </FormGroup>

          <FormGroup label="Heat Pump Lockout">
            <Label>
              <b>Auxiliary Heat Lockout Temperature (°F)</b>
              <NumericInput
                value={heatPumpLockout || 25}
                onValueChange={(value) => {
                  const clone = cloneDeep(editing ?? {});
                  clone.heatPumpLockout = value;
                  setEditing?.(clone);
                }}
                min={0}
                max={50}
                stepSize={1}
                fill
                disabled={readOnly}
              />
            </Label>
          </FormGroup>
        </div>
      )}

      <div style={{ marginTop: "1rem" }}>
        <FormGroup>
          <Label>
            <Switch
              checked={economizer || false}
              onChange={(e) => {
                const clone = cloneDeep(editing ?? {});
                clone.economizer = e.currentTarget.checked;
                setEditing?.(clone);
              }}
              disabled={readOnly}
              label="Economizer System"
            />
          </Label>
        </FormGroup>
      </div>

      {economizer && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
          <FormGroup label="Economizer Setpoint">
            <Label>
              <b>Switchover Temperature Setpoint (°F)</b>
              <NumericInput
                value={economizerSetpoint || 65}
                onValueChange={(value) => {
                  const clone = cloneDeep(editing ?? {});
                  clone.economizerSetpoint = value;
                  setEditing?.(clone);
                }}
                min={50}
                max={80}
                stepSize={1}
                fill
                disabled={readOnly}
              />
            </Label>
          </FormGroup>

          <FormGroup label="Cooling Lockout">
            <Label>
              <b>Compressor Cooling Lockout Temperature (°F)</b>
              <NumericInput
                value={coolingLockout || 55}
                onValueChange={(value) => {
                  const clone = cloneDeep(editing ?? {});
                  clone.coolingLockout = value;
                  setEditing?.(clone);
                }}
                min={40}
                max={70}
                stepSize={1}
                fill
                disabled={readOnly}
              />
            </Label>
          </FormGroup>
        </div>
      )}

      <div
        style={{
          marginTop: "1rem",
          padding: "0.5rem",
          backgroundColor: "var(--bp5-background-color-secondary)",
          borderRadius: "4px",
        }}
      >
        <small style={{ color: "var(--bp5-text-color-muted)" }}>
          <strong>Note:</strong> RTU configuration settings affect system performance and energy efficiency. Consult
          with HVAC professionals when making significant changes to these parameters.
        </small>
      </div>
    </div>
  );
}
