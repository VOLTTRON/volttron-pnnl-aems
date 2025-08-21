"use client";

import { FormGroup, InputGroup, NumericInput, Switch, HTMLSelect } from "@blueprintjs/core";
import React, { useCallback, useEffect, useState } from "react";
import { IconName } from "@blueprintjs/icons";
import {
  ReadUnitsDocument,
  ReadUnitsQuery,
  DeleteUnitDocument,
  CreateUnitDocument,
  UpdateUnitDocument,
} from "@/graphql-codegen/graphql";
import { useMutation } from "@apollo/client";
import { Term } from "@/utils/client";
import { CreateDialog, DeleteDialog, UpdateDialog } from "../dialog";

export function CreateUnit({
  open,
  setOpen,
  icon,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
}) {
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [campus, setCampus] = useState("");
  const [building, setBuilding] = useState("");
  const [system, setSystem] = useState("");
  const [timezone, setTimezone] = useState("");
  const [correlation, setCorrelation] = useState("");
  const [message, setMessage] = useState("");
  
  // RTU Configuration fields
  const [coolingCapacity, setCoolingCapacity] = useState<number | undefined>();
  const [compressors, setCompressors] = useState<number | undefined>();
  const [coolingLockout, setCoolingLockout] = useState<number | undefined>();
  const [optimalStartLockout, setOptimalStartLockout] = useState<number | undefined>();
  const [optimalStartDeviation, setOptimalStartDeviation] = useState<number | undefined>();
  const [earliestStart, setEarliestStart] = useState<number | undefined>();
  const [latestStart, setLatestStart] = useState<number | undefined>();
  const [heatPump, setHeatPump] = useState(false);
  const [heatPumpBackup, setHeatPumpBackup] = useState<number | undefined>();
  const [heatPumpLockout, setHeatPumpLockout] = useState<number | undefined>();
  const [economizer, setEconomizer] = useState(false);
  const [economizerSetpoint, setEconomizerSetpoint] = useState<number | undefined>();
  const [coolingPeakOffset, setCoolingPeakOffset] = useState<number | undefined>();
  const [heatingPeakOffset, setHeatingPeakOffset] = useState<number | undefined>();
  const [peakLoadExclude, setPeakLoadExclude] = useState(false);
  
  // Zone configuration
  const [zoneLocation, setZoneLocation] = useState("");
  const [zoneMass, setZoneMass] = useState("");
  const [zoneOrientation, setZoneOrientation] = useState("");
  const [zoneBuilding, setZoneBuilding] = useState("");

  const [createUnit] = useMutation(CreateUnitDocument, {
    refetchQueries: [ReadUnitsDocument],
  });

  const onCreate = useCallback(async () => {
    await createUnit({
      variables: {
        create: {
          name,
          label,
          campus,
          building,
          system,
          timezone,
          ...(correlation && { correlation }),
          ...(message && { message }),
          ...(coolingCapacity !== undefined && { coolingCapacity }),
          ...(compressors !== undefined && { compressors }),
          ...(coolingLockout !== undefined && { coolingLockout }),
          ...(optimalStartLockout !== undefined && { optimalStartLockout }),
          ...(optimalStartDeviation !== undefined && { optimalStartDeviation }),
          ...(earliestStart !== undefined && { earliestStart }),
          ...(latestStart !== undefined && { latestStart }),
          heatPump,
          ...(heatPumpBackup !== undefined && { heatPumpBackup }),
          ...(heatPumpLockout !== undefined && { heatPumpLockout }),
          economizer,
          ...(economizerSetpoint !== undefined && { economizerSetpoint }),
          ...(coolingPeakOffset !== undefined && { coolingPeakOffset }),
          ...(heatingPeakOffset !== undefined && { heatingPeakOffset }),
          peakLoadExclude,
          ...(zoneLocation && { zoneLocation }),
          ...(zoneMass && { zoneMass }),
          ...(zoneOrientation && { zoneOrientation }),
          ...(zoneBuilding && { zoneBuilding }),
        },
      },
    });
  }, [
    createUnit, name, label, campus, building, system, timezone, correlation, message,
    coolingCapacity, compressors, coolingLockout, optimalStartLockout, optimalStartDeviation,
    earliestStart, latestStart, heatPump, heatPumpBackup, heatPumpLockout, economizer,
    economizerSetpoint, coolingPeakOffset, heatingPeakOffset, peakLoadExclude,
    zoneLocation, zoneMass, zoneOrientation, zoneBuilding
  ]);

  useEffect(() => {
    if (open) {
      setName("");
      setLabel("");
      setCampus("");
      setBuilding("");
      setSystem("");
      setTimezone("");
      setCorrelation("");
      setMessage("");
      setCoolingCapacity(undefined);
      setCompressors(undefined);
      setCoolingLockout(undefined);
      setOptimalStartLockout(undefined);
      setOptimalStartDeviation(undefined);
      setEarliestStart(undefined);
      setLatestStart(undefined);
      setHeatPump(false);
      setHeatPumpBackup(undefined);
      setHeatPumpLockout(undefined);
      setEconomizer(false);
      setEconomizerSetpoint(undefined);
      setCoolingPeakOffset(undefined);
      setHeatingPeakOffset(undefined);
      setPeakLoadExclude(false);
      setZoneLocation("");
      setZoneMass("");
      setZoneOrientation("");
      setZoneBuilding("");
    }
  }, [open]);

  return (
    <CreateDialog title="Create Unit" icon={icon} open={open} setOpen={setOpen} onCreate={onCreate}>
      <FormGroup label="Name">
        <InputGroup id="name" name="name" value={name} onChange={(event) => setName(event.target.value)} fill />
      </FormGroup>
      <FormGroup label="Label">
        <InputGroup id="label" name="label" value={label} onChange={(event) => setLabel(event.target.value)} fill />
      </FormGroup>
      <FormGroup label="Campus">
        <InputGroup id="campus" name="campus" value={campus} onChange={(event) => setCampus(event.target.value)} fill />
      </FormGroup>
      <FormGroup label="Building">
        <InputGroup id="building" name="building" value={building} onChange={(event) => setBuilding(event.target.value)} fill />
      </FormGroup>
      <FormGroup label="System">
        <InputGroup id="system" name="system" value={system} onChange={(event) => setSystem(event.target.value)} fill />
      </FormGroup>
      <FormGroup label="Timezone">
        <InputGroup id="timezone" name="timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)} fill />
      </FormGroup>
      <FormGroup label="Correlation">
        <InputGroup
          id="correlation"
          name="correlation"
          value={correlation}
          onChange={(event) => setCorrelation(event.target.value)}
          fill
        />
      </FormGroup>
      <FormGroup label="Message">
        <InputGroup
          id="message"
          name="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          fill
        />
      </FormGroup>
      
      <h4>RTU Configuration</h4>
      <FormGroup label="Cooling Capacity (tons)">
        <NumericInput
          value={coolingCapacity}
          onValueChange={setCoolingCapacity}
          min={0}
          stepSize={0.5}
          minorStepSize={0.1}
          fill
        />
      </FormGroup>
      <FormGroup label="Number of Compressors">
        <NumericInput
          value={compressors}
          onValueChange={setCompressors}
          min={1}
          stepSize={1}
          fill
        />
      </FormGroup>
      <FormGroup label="Heat Pump">
        <Switch checked={heatPump} onChange={(e) => setHeatPump(e.currentTarget.checked)} />
      </FormGroup>
      {heatPump && (
        <>
          <FormGroup label="Heat Pump Backup (kW)">
            <NumericInput
              value={heatPumpBackup}
              onValueChange={setHeatPumpBackup}
              min={0}
              stepSize={0.5}
              fill
            />
          </FormGroup>
          <FormGroup label="Heat Pump Lockout Temperature (°F)">
            <NumericInput
              value={heatPumpLockout}
              onValueChange={setHeatPumpLockout}
              stepSize={1}
              fill
            />
          </FormGroup>
        </>
      )}
      <FormGroup label="Economizer">
        <Switch checked={economizer} onChange={(e) => setEconomizer(e.currentTarget.checked)} />
      </FormGroup>
      {economizer && (
        <>
          <FormGroup label="Economizer Setpoint (°F)">
            <NumericInput
              value={economizerSetpoint}
              onValueChange={setEconomizerSetpoint}
              stepSize={1}
              fill
            />
          </FormGroup>
          <FormGroup label="Cooling Lockout Temperature (°F)">
            <NumericInput
              value={coolingLockout}
              onValueChange={setCoolingLockout}
              stepSize={1}
              fill
            />
          </FormGroup>
        </>
      )}
      
      <h4>Grid Services</h4>
      <FormGroup label="Exclude from Peak Load">
        <Switch checked={peakLoadExclude} onChange={(e) => setPeakLoadExclude(e.currentTarget.checked)} />
      </FormGroup>
      {!peakLoadExclude && (
        <>
          <FormGroup label="Cooling Peak Offset (°F)">
            <NumericInput
              value={coolingPeakOffset}
              onValueChange={setCoolingPeakOffset}
              stepSize={0.5}
              fill
            />
          </FormGroup>
          <FormGroup label="Heating Peak Offset (°F)">
            <NumericInput
              value={heatingPeakOffset}
              onValueChange={setHeatingPeakOffset}
              stepSize={0.5}
              fill
            />
          </FormGroup>
        </>
      )}
      
      <h4>Zone Configuration</h4>
      <FormGroup label="Zone Location">
        <HTMLSelect value={zoneLocation} onChange={(e) => setZoneLocation(e.target.value)} fill>
          <option value="">Select location...</option>
          <option value="interior">Interior</option>
          <option value="perimeter">Perimeter</option>
          <option value="corner">Corner</option>
        </HTMLSelect>
      </FormGroup>
      <FormGroup label="Zone Mass">
        <HTMLSelect value={zoneMass} onChange={(e) => setZoneMass(e.target.value)} fill>
          <option value="">Select mass...</option>
          <option value="light">Light</option>
          <option value="medium">Medium</option>
          <option value="heavy">Heavy</option>
        </HTMLSelect>
      </FormGroup>
      <FormGroup label="Zone Orientation">
        <HTMLSelect value={zoneOrientation} onChange={(e) => setZoneOrientation(e.target.value)} fill>
          <option value="">Select orientation...</option>
          <option value="north">North</option>
          <option value="south">South</option>
          <option value="east">East</option>
          <option value="west">West</option>
        </HTMLSelect>
      </FormGroup>
      <FormGroup label="Zone Building Type">
        <HTMLSelect value={zoneBuilding} onChange={(e) => setZoneBuilding(e.target.value)} fill>
          <option value="">Select building type...</option>
          <option value="office">Office</option>
          <option value="retail">Retail</option>
          <option value="warehouse">Warehouse</option>
          <option value="school">School</option>
        </HTMLSelect>
      </FormGroup>
    </CreateDialog>
  );
}

export function UpdateUnit({
  open,
  setOpen,
  icon,
  unit: unitData,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
  unit?: Term<NonNullable<ReadUnitsQuery["readUnits"]>[0]>;
}) {
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [campus, setCampus] = useState("");
  const [building, setBuilding] = useState("");
  const [system, setSystem] = useState("");
  const [timezone, setTimezone] = useState("");
  const [correlation, setCorrelation] = useState("");
  const [message, setMessage] = useState("");
  
  // RTU Configuration fields
  const [coolingCapacity, setCoolingCapacity] = useState<number | undefined>();
  const [compressors, setCompressors] = useState<number | undefined>();
  const [coolingLockout, setCoolingLockout] = useState<number | undefined>();
  const [optimalStartLockout, setOptimalStartLockout] = useState<number | undefined>();
  const [optimalStartDeviation, setOptimalStartDeviation] = useState<number | undefined>();
  const [earliestStart, setEarliestStart] = useState<number | undefined>();
  const [latestStart, setLatestStart] = useState<number | undefined>();
  const [heatPump, setHeatPump] = useState(false);
  const [heatPumpBackup, setHeatPumpBackup] = useState<number | undefined>();
  const [heatPumpLockout, setHeatPumpLockout] = useState<number | undefined>();
  const [economizer, setEconomizer] = useState(false);
  const [economizerSetpoint, setEconomizerSetpoint] = useState<number | undefined>();
  const [coolingPeakOffset, setCoolingPeakOffset] = useState<number | undefined>();
  const [heatingPeakOffset, setHeatingPeakOffset] = useState<number | undefined>();
  const [peakLoadExclude, setPeakLoadExclude] = useState(false);
  
  // Zone configuration
  const [zoneLocation, setZoneLocation] = useState("");
  const [zoneMass, setZoneMass] = useState("");
  const [zoneOrientation, setZoneOrientation] = useState("");
  const [zoneBuilding, setZoneBuilding] = useState("");

  const [updateUnit] = useMutation(UpdateUnitDocument, {
    refetchQueries: [ReadUnitsDocument],
  });

  const onUpdate = useCallback(async () => {
    const updateData: any = {};
    
    if (name !== unitData?.name) updateData.name = name;
    if (label !== unitData?.label) updateData.label = label;
    if (campus !== unitData?.campus) updateData.campus = campus;
    if (building !== unitData?.building) updateData.building = building;
    if (system !== unitData?.system) updateData.system = system;
    if (timezone !== unitData?.timezone) updateData.timezone = timezone;
    if (correlation !== unitData?.correlation) updateData.correlation = correlation;
    if (message !== unitData?.message) updateData.message = message;
    if (coolingCapacity !== unitData?.coolingCapacity) updateData.coolingCapacity = coolingCapacity;
    if (compressors !== unitData?.compressors) updateData.compressors = compressors;
    if (coolingLockout !== unitData?.coolingLockout) updateData.coolingLockout = coolingLockout;
    if (optimalStartLockout !== unitData?.optimalStartLockout) updateData.optimalStartLockout = optimalStartLockout;
    if (optimalStartDeviation !== unitData?.optimalStartDeviation) updateData.optimalStartDeviation = optimalStartDeviation;
    if (earliestStart !== unitData?.earliestStart) updateData.earliestStart = earliestStart;
    if (latestStart !== unitData?.latestStart) updateData.latestStart = latestStart;
    if (heatPump !== unitData?.heatPump) updateData.heatPump = heatPump;
    if (heatPumpBackup !== unitData?.heatPumpBackup) updateData.heatPumpBackup = heatPumpBackup;
    if (heatPumpLockout !== unitData?.heatPumpLockout) updateData.heatPumpLockout = heatPumpLockout;
    if (economizer !== unitData?.economizer) updateData.economizer = economizer;
    if (economizerSetpoint !== unitData?.economizerSetpoint) updateData.economizerSetpoint = economizerSetpoint;
    if (coolingPeakOffset !== unitData?.coolingPeakOffset) updateData.coolingPeakOffset = coolingPeakOffset;
    if (heatingPeakOffset !== unitData?.heatingPeakOffset) updateData.heatingPeakOffset = heatingPeakOffset;
    if (peakLoadExclude !== unitData?.peakLoadExclude) updateData.peakLoadExclude = peakLoadExclude;
    if (zoneLocation !== unitData?.zoneLocation) updateData.zoneLocation = zoneLocation;
    if (zoneMass !== unitData?.zoneMass) updateData.zoneMass = zoneMass;
    if (zoneOrientation !== unitData?.zoneOrientation) updateData.zoneOrientation = zoneOrientation;
    if (zoneBuilding !== unitData?.zoneBuilding) updateData.zoneBuilding = zoneBuilding;

    await updateUnit({
      variables: {
        where: { id: unitData?.id },
        update: updateData,
      },
    });
  }, [
    updateUnit, unitData, name, label, campus, building, system, timezone, correlation, message,
    coolingCapacity, compressors, coolingLockout, optimalStartLockout, optimalStartDeviation,
    earliestStart, latestStart, heatPump, heatPumpBackup, heatPumpLockout, economizer,
    economizerSetpoint, coolingPeakOffset, heatingPeakOffset, peakLoadExclude,
    zoneLocation, zoneMass, zoneOrientation, zoneBuilding
  ]);

  useEffect(() => {
    if (open && unitData) {
      setName(unitData.name ?? "");
      setLabel(unitData.label ?? "");
      setCampus(unitData.campus ?? "");
      setBuilding(unitData.building ?? "");
      setSystem(unitData.system ?? "");
      setTimezone(unitData.timezone ?? "");
      setCorrelation(unitData.correlation ?? "");
      setMessage(unitData.message ?? "");
      setCoolingCapacity(unitData.coolingCapacity ?? undefined);
      setCompressors(unitData.compressors ?? undefined);
      setCoolingLockout(unitData.coolingLockout ?? undefined);
      setOptimalStartLockout(unitData.optimalStartLockout ?? undefined);
      setOptimalStartDeviation(unitData.optimalStartDeviation ?? undefined);
      setEarliestStart(unitData.earliestStart ?? undefined);
      setLatestStart(unitData.latestStart ?? undefined);
      setHeatPump(unitData.heatPump ?? false);
      setHeatPumpBackup(unitData.heatPumpBackup ?? undefined);
      setHeatPumpLockout(unitData.heatPumpLockout ?? undefined);
      setEconomizer(unitData.economizer ?? false);
      setEconomizerSetpoint(unitData.economizerSetpoint ?? undefined);
      setCoolingPeakOffset(unitData.coolingPeakOffset ?? undefined);
      setHeatingPeakOffset(unitData.heatingPeakOffset ?? undefined);
      setPeakLoadExclude(unitData.peakLoadExclude ?? false);
      setZoneLocation(unitData.zoneLocation ?? "");
      setZoneMass(unitData.zoneMass ?? "");
      setZoneOrientation(unitData.zoneOrientation ?? "");
      setZoneBuilding(unitData.zoneBuilding ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <UpdateDialog title="Update Unit" icon={icon} open={open} setOpen={setOpen} onUpdate={onUpdate}>
      <FormGroup label="Name">
        <InputGroup id="name" name="name" value={name} onChange={(event) => setName(event.target.value)} fill />
      </FormGroup>
      <FormGroup label="Label">
        <InputGroup id="label" name="label" value={label} onChange={(event) => setLabel(event.target.value)} fill />
      </FormGroup>
      <FormGroup label="Campus">
        <InputGroup id="campus" name="campus" value={campus} onChange={(event) => setCampus(event.target.value)} fill />
      </FormGroup>
      <FormGroup label="Building">
        <InputGroup id="building" name="building" value={building} onChange={(event) => setBuilding(event.target.value)} fill />
      </FormGroup>
      <FormGroup label="System">
        <InputGroup id="system" name="system" value={system} onChange={(event) => setSystem(event.target.value)} fill />
      </FormGroup>
      <FormGroup label="Timezone">
        <InputGroup id="timezone" name="timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)} fill />
      </FormGroup>
      <FormGroup label="Correlation">
        <InputGroup
          id="correlation"
          name="correlation"
          value={correlation}
          onChange={(event) => setCorrelation(event.target.value)}
          fill
        />
      </FormGroup>
      <FormGroup label="Message">
        <InputGroup
          id="message"
          name="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          fill
        />
      </FormGroup>
      
      <h4>RTU Configuration</h4>
      <FormGroup label="Cooling Capacity (tons)">
        <NumericInput
          value={coolingCapacity}
          onValueChange={setCoolingCapacity}
          min={0}
          stepSize={0.5}
          minorStepSize={0.1}
          fill
        />
      </FormGroup>
      <FormGroup label="Number of Compressors">
        <NumericInput
          value={compressors}
          onValueChange={setCompressors}
          min={1}
          stepSize={1}
          fill
        />
      </FormGroup>
      <FormGroup label="Heat Pump">
        <Switch checked={heatPump} onChange={(e) => setHeatPump(e.currentTarget.checked)} />
      </FormGroup>
      {heatPump && (
        <>
          <FormGroup label="Heat Pump Backup (kW)">
            <NumericInput
              value={heatPumpBackup}
              onValueChange={setHeatPumpBackup}
              min={0}
              stepSize={0.5}
              fill
            />
          </FormGroup>
          <FormGroup label="Heat Pump Lockout Temperature (°F)">
            <NumericInput
              value={heatPumpLockout}
              onValueChange={setHeatPumpLockout}
              stepSize={1}
              fill
            />
          </FormGroup>
        </>
      )}
      <FormGroup label="Economizer">
        <Switch checked={economizer} onChange={(e) => setEconomizer(e.currentTarget.checked)} />
      </FormGroup>
      {economizer && (
        <>
          <FormGroup label="Economizer Setpoint (°F)">
            <NumericInput
              value={economizerSetpoint}
              onValueChange={setEconomizerSetpoint}
              stepSize={1}
              fill
            />
          </FormGroup>
          <FormGroup label="Cooling Lockout Temperature (°F)">
            <NumericInput
              value={coolingLockout}
              onValueChange={setCoolingLockout}
              stepSize={1}
              fill
            />
          </FormGroup>
        </>
      )}
      
      <h4>Grid Services</h4>
      <FormGroup label="Exclude from Peak Load">
        <Switch checked={peakLoadExclude} onChange={(e) => setPeakLoadExclude(e.currentTarget.checked)} />
      </FormGroup>
      {!peakLoadExclude && (
        <>
          <FormGroup label="Cooling Peak Offset (°F)">
            <NumericInput
              value={coolingPeakOffset}
              onValueChange={setCoolingPeakOffset}
              stepSize={0.5}
              fill
            />
          </FormGroup>
          <FormGroup label="Heating Peak Offset (°F)">
            <NumericInput
              value={heatingPeakOffset}
              onValueChange={setHeatingPeakOffset}
              stepSize={0.5}
              fill
            />
          </FormGroup>
        </>
      )}
      
      <h4>Zone Configuration</h4>
      <FormGroup label="Zone Location">
        <HTMLSelect value={zoneLocation} onChange={(e) => setZoneLocation(e.target.value)} fill>
          <option value="">Select location...</option>
          <option value="interior">Interior</option>
          <option value="perimeter">Perimeter</option>
          <option value="corner">Corner</option>
        </HTMLSelect>
      </FormGroup>
      <FormGroup label="Zone Mass">
        <HTMLSelect value={zoneMass} onChange={(e) => setZoneMass(e.target.value)} fill>
          <option value="">Select mass...</option>
          <option value="light">Light</option>
          <option value="medium">Medium</option>
          <option value="heavy">Heavy</option>
        </HTMLSelect>
      </FormGroup>
      <FormGroup label="Zone Orientation">
        <HTMLSelect value={zoneOrientation} onChange={(e) => setZoneOrientation(e.target.value)} fill>
          <option value="">Select orientation...</option>
          <option value="north">North</option>
          <option value="south">South</option>
          <option value="east">East</option>
          <option value="west">West</option>
        </HTMLSelect>
      </FormGroup>
      <FormGroup label="Zone Building Type">
        <HTMLSelect value={zoneBuilding} onChange={(e) => setZoneBuilding(e.target.value)} fill>
          <option value="">Select building type...</option>
          <option value="office">Office</option>
          <option value="retail">Retail</option>
          <option value="warehouse">Warehouse</option>
          <option value="school">School</option>
        </HTMLSelect>
      </FormGroup>
    </UpdateDialog>
  );
}

export function DeleteUnit({
  open,
  setOpen,
  icon,
  unit,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
  unit?: Term<NonNullable<ReadUnitsQuery["readUnits"]>[0]>;
}) {
  const [deleteUnit] = useMutation(DeleteUnitDocument, {
    refetchQueries: [ReadUnitsDocument],
  });

  const onDelete = useCallback(async () => {
    await deleteUnit({
      variables: {
        where: { id: unit?.id },
      },
    });
  }, [deleteUnit, unit]);

  return (
    <DeleteDialog title="Delete Unit" icon={icon} open={open} setOpen={setOpen} onDelete={onDelete}>
      <p>{`Are you sure you want to delete the unit '${unit?.label || unit?.name}'?`}</p>
    </DeleteDialog>
  );
}
