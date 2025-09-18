import { Button, Card, FormGroup, InputGroup, Intent, Label, Switch, Alert } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { useState } from "react";
import { ReadUnitQuery } from "@/graphql-codegen/graphql";
import { DeepPartial, typeofNonNullable, typeofObject } from "@local/common";
import { cloneDeep, merge } from "lodash";

type UnitType = NonNullable<ReadUnitQuery["readUnit"]>;

export type OccupancyCreateDelete = NonNullable<NonNullable<UnitType["configuration"]>["occupancies"]>[number] & {
  action?: "create" | "delete";
  createdAt?: string;
};

interface OccupanciesProps {
  unit: UnitType | null;
  editing: DeepPartial<UnitType> | null;
  setEditing: (editing: DeepPartial<UnitType> | null) => void;
  readOnly?: boolean;
}

function CreateOccupancy({
  unit,
  editing,
  setEditing,
}: {
  unit: UnitType | null;
  editing: DeepPartial<UnitType> | null;
  setEditing: (editing: DeepPartial<UnitType> | null) => void;
}) {
  const [label, setLabel] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [occupied, setOccupied] = useState(true);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");

  return (
    <>
      <Card style={{ padding: "1rem", marginBottom: "1rem" }}>
        <h4>Create Temporary Occupancy</h4>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "0.5rem", alignItems: "end" }}>
          <FormGroup label="Occupancy Label">
            <InputGroup
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Enter occupancy description"
            />
          </FormGroup>

          <FormGroup label="Date">
            <InputGroup type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </FormGroup>

          <FormGroup label="Start Time">
            <InputGroup
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={!occupied}
            />
          </FormGroup>

          <FormGroup label="End Time">
            <InputGroup type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={!occupied} />
          </FormGroup>
        </div>

        <FormGroup style={{ marginTop: "0.5rem" }}>
          <Switch checked={occupied} onChange={(e) => setOccupied(e.currentTarget.checked)} label="Occupied Period" />
        </FormGroup>

        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
          <Button
            icon={IconNames.CONFIRM}
            intent={Intent.PRIMARY}
            onClick={() => {
              const now = new Date().toISOString();
              const clone = cloneDeep(editing ?? {});
              clone.configuration = clone.configuration ?? {};
              clone.configuration.occupancies = clone.configuration?.occupancies ?? [];
              clone.configuration.occupancies.push({
                id: `${now}`,
                label,
                date,
                schedule: {
                  occupied,
                  startTime: occupied ? startTime : null,
                  endTime: occupied ? endTime : null,
                },
                createdAt: now,
                configurationId: unit?.configuration?.id ?? unit?.configurationId,
                action: "create",
              } as OccupancyCreateDelete);
              setEditing(clone);
              setLabel("");
              setDate(new Date().toISOString().split("T")[0]);
              setOccupied(true);
              setStartTime("08:00");
              setEndTime("17:00");
            }}
            disabled={!label.trim()}
          >
            Add Occupancy
          </Button>
        </div>
      </Card>
    </>
  );
}

export function Occupancies({ unit, editing, setEditing, readOnly = false }: OccupanciesProps) {
  const editingOccupancies = (editing?.configuration?.occupancies ?? [])
    .filter(typeofNonNullable)
    .reduce((a, v) => ({ ...a, [v?.id ?? ""]: v }), {} as Record<string, OccupancyCreateDelete>);
  const occupancies = (unit?.configuration?.occupancies ?? [])
    .filter(typeofNonNullable)
    .map((v) => merge({}, v, editingOccupancies[v.id ?? ""])) as OccupancyCreateDelete[];
  Object.values(editingOccupancies)
    .filter((v) => typeofObject<OccupancyCreateDelete>(v, (v) => v.action === "create"))
    .forEach((v) => occupancies.push(v));

  return (
    <div style={{ padding: "1rem" }}>
      {!readOnly && <CreateOccupancy unit={unit} editing={editing} setEditing={setEditing} />}
      <div>
        <h4>Temporary Occupancies ({occupancies.length})</h4>
        {occupancies.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--bp5-text-color-muted)" }}>
            No temporary occupancies configured. Add occupancies above to override normal schedules for specific dates.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {occupancies
              .sort((a, b) => new Date(b.date ?? "").getTime() - new Date(a.date ?? "").getTime())
              .map((occupancy, index) => {
                const { id, label, date, schedule } = occupancy;
                const { occupied, startTime, endTime } = schedule ?? {};
                return (
                  <Card key={index} style={{ padding: "0.75rem" }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr 1fr 1fr auto auto",
                        gap: "1rem",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <strong>{occupancy.label}</strong>
                        <div style={{ fontSize: "0.75rem", color: "var(--bp5-text-color-muted)" }}>
                          {new Date(occupancy.date ?? "").toLocaleDateString()}
                        </div>
                      </div>

                      <Switch
                        checked={occupied ?? false}
                        onChange={(e) => {
                          const clone = cloneDeep(editing ?? {});
                          clone.configuration = clone.configuration ?? {};
                          clone.configuration.occupancies = clone.configuration?.occupancies ?? [];
                          let value: OccupancyCreateDelete | undefined = clone.configuration.occupancies.find(
                            (o) => o?.id === id,
                          );
                          if (!value) {
                            value = { id };
                            clone.configuration.occupancies.push(value);
                          }
                          value.schedule = value.schedule ?? {};
                          value.schedule.occupied = e.currentTarget.checked;
                          setEditing(clone);
                        }}
                        disabled={readOnly}
                        label="Occupied"
                      />

                      <div>
                        <Label style={{ margin: 0, fontSize: "0.75rem" }}>Start Time</Label>
                        <InputGroup
                          type="time"
                          value={startTime || "08:00"}
                          onChange={(e) => {
                            const clone = cloneDeep(editing ?? {});
                            clone.configuration = clone.configuration ?? {};
                            clone.configuration.occupancies = clone.configuration?.occupancies ?? [];
                            let value: OccupancyCreateDelete | undefined = clone.configuration.occupancies.find(
                              (o) => o?.id === id,
                            );
                            if (!value) {
                              value = { id };
                              clone.configuration.occupancies.push(value);
                            }
                            value.schedule = value.schedule ?? {};
                            value.schedule.startTime = e.target.value;
                            setEditing(clone);
                          }}
                          disabled={readOnly || !occupied}
                          small
                        />
                      </div>

                      <div>
                        <Label style={{ margin: 0, fontSize: "0.75rem" }}>End Time</Label>
                        <InputGroup
                          type="time"
                          value={endTime || "17:00"}
                          onChange={(e) => {
                            const clone = cloneDeep(editing ?? {});
                            clone.configuration = clone.configuration ?? {};
                            clone.configuration.occupancies = clone.configuration?.occupancies ?? [];
                            let value: OccupancyCreateDelete | undefined = clone.configuration.occupancies.find(
                              (o) => o?.id === id,
                            );
                            if (!value) {
                              value = { id };
                              clone.configuration.occupancies.push(value);
                            }
                            value.schedule = value.schedule ?? {};
                            value.schedule.endTime = e.target.value;
                            setEditing(clone);
                          }}
                          disabled={readOnly || !occupied}
                          small
                        />
                      </div>

                      <div style={{ fontSize: "0.75rem", color: "var(--bp5-text-color-muted)" }}>
                        {occupied ? `${startTime} - ${endTime}` : "Unoccupied"}
                      </div>

                      {!readOnly && (
                        <Button
                          icon={IconNames.TRASH}
                          intent={Intent.DANGER}
                          minimal
                          small
                          onClick={() => {
                            const clone = cloneDeep(editing ?? {});
                            clone.configuration = clone.configuration ?? {};
                            clone.configuration.occupancies = clone.configuration?.occupancies ?? [];
                            let value: OccupancyCreateDelete | undefined = clone.configuration.occupancies.find(
                              (o) => o?.id === id,
                            );
                            if (!value) {
                              value = { id };
                              clone.configuration.occupancies.push(value);
                            }
                            value.action = "delete";
                            setEditing(clone);
                          }}
                        />
                      )}
                    </div>
                  </Card>
                );
              })}
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: "1rem",
          padding: "0.5rem",
          backgroundColor: "var(--bp5-background-color-secondary)",
          borderRadius: "4px",
        }}
      >
        <small style={{ color: "var(--bp5-text-color-muted)" }}>
          <strong>Note:</strong> Temporary occupancies override the normal weekly schedule for specific dates. Use this
          for special events, meetings, or one-time schedule changes.
        </small>
      </div>
    </div>
  );
}
