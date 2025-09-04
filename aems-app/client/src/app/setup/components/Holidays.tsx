import { 
  Alert,
  Button,
  InputGroup,
  Intent,
  Label,
  Menu,
  MenuItem,
  Popover
} from "@blueprintjs/core";
import { DatePicker3 } from "@blueprintjs/datetime2";
import { IconNames } from "@blueprintjs/icons";
import { useCallback, useState } from "react";
import { get, isEmpty, merge } from "lodash";
import { Holiday } from "./Holiday";
import { HolidayType, ObservanceType } from "@local/common";

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

interface HolidaysProps {
  unit: DeepPartial<any> | any;
  editing: DeepPartial<any> | null;
  handleChange: (field: string, editingUnit?: DeepPartial<any> | null) => (value: any) => void;
  readOnly?: boolean;
  bulkUpdate?: boolean;
}

const holidayOrder = HolidayType.values.map((a: any) => a.label);

const minDate = new Date("2024-01-01");
minDate.setFullYear(2024, 0, 1);

const maxDate = new Date("2024-12-31");
maxDate.setFullYear(2024, 11, 31);

const dateFactory = () => {
  const date = new Date("2024-01-01");
  date.setFullYear(2024, 0, 1);
  return date;
};

function CreateHoliday({
  unit,
  editing,
  handleChange,
  holidays,
}: {
  unit: DeepPartial<any> | any;
  editing: DeepPartial<any> | null;
  handleChange: (field: string, unit?: DeepPartial<any> | null) => (value: any) => void;
  holidays: any[];
}) {
  const [label, setLabel] = useState("");
  const [date, setDate] = useState(dateFactory());
  const [observance, setObservance] = useState("");
  const [open, setOpen] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '1rem', alignItems: 'end', marginBottom: '1rem' }}>
      <div>
        <Label>
          <b>Holiday Label</b>
          <InputGroup type="text" value={label} onChange={(e) => setLabel(e.target.value)} />
        </Label>
      </div>
      <div>
        <Label>
          <b>Date</b>
          <Popover
            content={
              <DatePicker3
                canClearSelection={false}
                minDate={minDate}
                maxDate={maxDate}
                value={date}
                onChange={(d: any, u: any) => {
                  if (d) {
                    setDate(d);
                  }
                  setOpen(!u);
                }}
              />
            }
            isOpen={open}
            placement="bottom-start"
          >
            <Button rightIcon={IconNames.CALENDAR} onClick={() => setOpen(true)} minimal>
              {formatDate(date)}
            </Button>
          </Popover>
        </Label>
      </div>
      <div>
        <Label>
          <b>Observance</b>
          <Popover
            content={
              <Menu>
                <MenuItem text="Always on Date" onClick={() => setObservance("")} />
                {ObservanceType.values.map((o: any) => (
                  <MenuItem key={o.name} text={o.label} onClick={() => setObservance(o.label)} />
                ))}
              </Menu>
            }
            placement="bottom-start"
          >
            <Button rightIcon={IconNames.CARET_DOWN} minimal>
              {observance || "Always on Date"}
            </Button>
          </Popover>
        </Label>
      </div>
      <div>
        <Button
          icon={IconNames.NEW_LAYER}
          intent={Intent.PRIMARY}
          minimal
          disabled={isEmpty(label) || holidays.find((v) => v.label === label) !== undefined}
          onClick={() => {
            const i = Math.max(
              get(unit, "configuration.holidays.length", 0),
              get(editing, "configuration.holidays.length", 0)
            );
            const now = new Date().toISOString();
            handleChange(
              `configuration.holidays.${i}`,
              editing
            )({
              type: "Custom",
              label,
              month: date.getMonth() + 1,
              day: date.getDate(),
              observance,
              configurationId: unit?.configuration?.id,
              createdAt: now,
              action: "create",
            });
            setLabel("");
            setDate(dateFactory());
            setObservance("");
          }}
        >
          Create Holiday
        </Button>
      </div>
    </div>
  );
}

export function Holidays({ unit, editing, handleChange, readOnly = false, bulkUpdate = false }: HolidaysProps) {
  const [deleting, setDeleting] = useState<DeepPartial<any> | undefined>(undefined);

  const holidays = merge([], unit.configuration?.holidays, get(editing, "configuration.holidays")) as (any & {
    index: number;
  })[];
  holidays.forEach((h, i) => (h.index = i));

  const handleDelete = useCallback((holiday: any) => {
    setDeleting(holiday);
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleting?.id) {
      // For holidays with IDs, we need to mark them for deletion
      const path = `configuration.holidays.${deleting.index}`;
      handleChange(path, editing)({ id: deleting.id, action: "delete" });
    }
    setDeleting(undefined);
  }, [deleting, handleChange, editing]);

  return (
    <div style={{ padding: '1rem' }}>
      {!bulkUpdate && (
        <>
          <Label>
            <h3>Create Holiday</h3>
            <CreateHoliday unit={unit} editing={editing} handleChange={handleChange} holidays={holidays} />
          </Label>
          
          <Label>
            <h3>Custom Holidays</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {isEmpty(holidays.filter((a) => a.type === "Custom" && a.action !== "delete")) ? (
                <li key={"empty"} style={{ padding: '1rem', textAlign: 'center', color: 'var(--bp5-text-color-muted)' }}>
                  No Custom Holidays Defined
                </li>
              ) : (
                holidays
                  .filter((a) => a.type === "Custom" && a.action !== "delete")
                  .sort((a, b) => {
                    const aDate = new Date(a.createdAt || 0).valueOf();
                    const bDate = new Date(b.createdAt || 0).valueOf();
                    return bDate - aDate;
                  })
                  .map((holiday, i) => (
                    <li key={holiday.index} style={{ marginBottom: '0.5rem' }}>
                      <Holiday
                        key={holiday.index}
                        path={`configuration.holidays.${holiday.index}`}
                        unit={unit}
                        editing={editing}
                        holiday={holiday}
                        handleChange={handleChange}
                        readOnly={readOnly}
                      />
                    </li>
                  ))
              )}
            </ul>
          </Label>
        </>
      )}
      
      <Label>
        <h3>Predefined Holidays</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {holidays
            .filter((a) => a.type !== "Custom")
            .sort((a, b) => holidayOrder.indexOf(a.label) - holidayOrder.indexOf(b.label))
            .map((holiday, i) => (
              <li key={holiday.index} style={{ marginBottom: '0.5rem' }}>
                <Holiday
                  key={holiday.index}
                  path={`configuration.holidays.${holiday.index}`}
                  unit={unit}
                  editing={editing}
                  holiday={holiday}
                  handleChange={handleChange}
                  readOnly={readOnly}
                />
              </li>
            ))}
        </ul>
      </Label>
      
      <Alert
        intent={Intent.DANGER}
        isOpen={deleting !== undefined}
        confirmButtonText="Yes"
        cancelButtonText="Cancel"
        onConfirm={confirmDelete}
        onClose={() => setDeleting(undefined)}
      >
        <p>Permanently delete the holiday {deleting?.label}?</p>
      </Alert>
    </div>
  );
}
