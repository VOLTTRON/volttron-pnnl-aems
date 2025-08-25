import { 
  Button,
  Card,
  FormGroup,
  HTMLSelect,
  InputGroup,
  Intent,
  Label,
  Switch
} from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { useCallback, useState } from "react";
import { get } from "lodash";

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

interface HolidaysProps {
  unit: any;
  editing: DeepPartial<any> | null;
  handleChange: (field: string, editingUnit?: DeepPartial<any> | null) => (value: any) => void;
  readOnly?: boolean;
}

const PREDEFINED_HOLIDAYS = [
  { label: "New Year's Day", month: 1, day: 1, type: "federal" },
  { label: "Martin Luther King Jr. Day", month: 1, day: 15, type: "federal", observance: "third_monday" },
  { label: "Presidents' Day", month: 2, day: 15, type: "federal", observance: "third_monday" },
  { label: "Memorial Day", month: 5, day: 25, type: "federal", observance: "last_monday" },
  { label: "Independence Day", month: 7, day: 4, type: "federal" },
  { label: "Labor Day", month: 9, day: 1, type: "federal", observance: "first_monday" },
  { label: "Columbus Day", month: 10, day: 8, type: "federal", observance: "second_monday" },
  { label: "Veterans Day", month: 11, day: 11, type: "federal" },
  { label: "Thanksgiving", month: 11, day: 22, type: "federal", observance: "fourth_thursday" },
  { label: "Christmas Day", month: 12, day: 25, type: "federal" }
];

const HOLIDAY_TYPES = [
  { value: "federal", label: "Federal Holiday" },
  { value: "state", label: "State Holiday" },
  { value: "local", label: "Local Holiday" },
  { value: "company", label: "Company Holiday" },
  { value: "custom", label: "Custom Holiday" }
];

const OBSERVANCE_TYPES = [
  { value: "", label: "Fixed Date" },
  { value: "first_monday", label: "First Monday" },
  { value: "second_monday", label: "Second Monday" },
  { value: "third_monday", label: "Third Monday" },
  { value: "last_monday", label: "Last Monday" },
  { value: "first_thursday", label: "First Thursday" },
  { value: "fourth_thursday", label: "Fourth Thursday" }
];

export function Holidays({ unit, editing, handleChange, readOnly = false }: HolidaysProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [showAddHoliday, setShowAddHoliday] = useState(false);
  const [newHoliday, setNewHoliday] = useState({
    label: '',
    month: 1,
    day: 1,
    type: 'company',
    observance: ''
  });

  const getValue = useCallback((field: string) => {
    return get(editing, field, get(unit, field));
  }, [editing, unit]);

  const getHolidays = useCallback(() => {
    return getValue("configuration.holidays") || [];
  }, [getValue]);

  const handleTemplateApply = useCallback((template: string) => {
    let holidays: any[] = [];
    
    switch (template) {
      case 'federal':
        holidays = PREDEFINED_HOLIDAYS.filter(h => h.type === 'federal');
        break;
      case 'minimal':
        holidays = PREDEFINED_HOLIDAYS.filter(h => 
          ['New Year\'s Day', 'Independence Day', 'Thanksgiving', 'Christmas Day'].includes(h.label)
        );
        break;
      case 'all':
        holidays = [...PREDEFINED_HOLIDAYS];
        break;
    }
    
    if (holidays.length > 0) {
      handleChange("configuration.holidays", editing)(holidays);
      setSelectedTemplate('');
    }
  }, [handleChange, editing]);

  const handleAddHoliday = useCallback(() => {
    const holidays = getHolidays();
    const updatedHolidays = [...holidays, { ...newHoliday, id: Date.now() }];
    handleChange("configuration.holidays", editing)(updatedHolidays);
    setNewHoliday({
      label: '',
      month: 1,
      day: 1,
      type: 'company',
      observance: ''
    });
    setShowAddHoliday(false);
  }, [getHolidays, handleChange, editing, newHoliday]);

  const handleRemoveHoliday = useCallback((index: number) => {
    const holidays = getHolidays();
    const updatedHolidays = holidays.filter((_: any, i: number) => i !== index);
    handleChange("configuration.holidays", editing)(updatedHolidays);
  }, [getHolidays, handleChange, editing]);

  const handleHolidayChange = useCallback((index: number, field: string, value: any) => {
    const holidays = getHolidays();
    const updatedHolidays = [...holidays];
    updatedHolidays[index] = { ...updatedHolidays[index], [field]: value };
    handleChange("configuration.holidays", editing)(updatedHolidays);
  }, [getHolidays, handleChange, editing]);

  const holidays = getHolidays();

  return (
    <div style={{ padding: '1rem' }}>
      {!readOnly && (
        <>
          <FormGroup label="Holiday Templates">
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
              <HTMLSelect
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                options={[
                  { value: '', label: 'Select a template...' },
                  { value: 'federal', label: 'All Federal Holidays' },
                  { value: 'minimal', label: 'Major Holidays Only' },
                  { value: 'all', label: 'All Predefined Holidays' }
                ]}
              />
              <Button
                icon={IconNames.IMPORT}
                intent={Intent.PRIMARY}
                onClick={() => handleTemplateApply(selectedTemplate)}
                disabled={!selectedTemplate}
              >
                Apply Template
              </Button>
            </div>
          </FormGroup>

          <div style={{ marginBottom: '1rem' }}>
            <Button
              icon={IconNames.PLUS}
              intent={Intent.SUCCESS}
              onClick={() => setShowAddHoliday(!showAddHoliday)}
            >
              Add Custom Holiday
            </Button>
          </div>

          {showAddHoliday && (
            <Card style={{ padding: '1rem', marginBottom: '1rem' }}>
              <h4>Add New Holiday</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0.5rem', alignItems: 'end' }}>
                <FormGroup label="Holiday Name">
                  <InputGroup
                    value={newHoliday.label}
                    onChange={(e) => setNewHoliday({ ...newHoliday, label: e.target.value })}
                    placeholder="Enter holiday name"
                  />
                </FormGroup>
                
                <FormGroup label="Month">
                  <HTMLSelect
                    value={newHoliday.month}
                    onChange={(e) => setNewHoliday({ ...newHoliday, month: parseInt(e.target.value) })}
                    options={Array.from({ length: 12 }, (_, i) => ({
                      value: i + 1,
                      label: new Date(2024, i, 1).toLocaleString('default', { month: 'long' })
                    }))}
                  />
                </FormGroup>
                
                <FormGroup label="Day">
                  <HTMLSelect
                    value={newHoliday.day}
                    onChange={(e) => setNewHoliday({ ...newHoliday, day: parseInt(e.target.value) })}
                    options={Array.from({ length: 31 }, (_, i) => ({
                      value: i + 1,
                      label: (i + 1).toString()
                    }))}
                  />
                </FormGroup>
                
                <FormGroup label="Type">
                  <HTMLSelect
                    value={newHoliday.type}
                    onChange={(e) => setNewHoliday({ ...newHoliday, type: e.target.value })}
                    options={HOLIDAY_TYPES}
                  />
                </FormGroup>
              </div>
              
              <FormGroup label="Observance Rule" style={{ marginTop: '0.5rem' }}>
                <HTMLSelect
                  value={newHoliday.observance}
                  onChange={(e) => setNewHoliday({ ...newHoliday, observance: e.target.value })}
                  options={OBSERVANCE_TYPES}
                />
              </FormGroup>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <Button
                  icon={IconNames.CONFIRM}
                  intent={Intent.PRIMARY}
                  onClick={handleAddHoliday}
                  disabled={!newHoliday.label.trim()}
                >
                  Add Holiday
                </Button>
                <Button
                  icon={IconNames.CROSS}
                  onClick={() => setShowAddHoliday(false)}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          )}
        </>
      )}

      <div>
        <h4>Configured Holidays ({holidays.length})</h4>
        {holidays.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--bp5-text-color-muted)' }}>
            No holidays configured. Use templates or add custom holidays above.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {holidays.map((holiday: any, index: number) => (
              <Card key={index} style={{ padding: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '1rem', alignItems: 'center' }}>
                  <div>
                    <strong>{holiday.label}</strong>
                    {holiday.observance && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--bp5-text-color-muted)' }}>
                        {OBSERVANCE_TYPES.find(o => o.value === holiday.observance)?.label}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ fontSize: '0.875rem' }}>
                    {new Date(2024, holiday.month - 1, 1).toLocaleString('default', { month: 'long' })} {holiday.day}
                  </div>
                  
                  <div style={{ fontSize: '0.875rem', textTransform: 'capitalize' }}>
                    {holiday.type}
                  </div>
                  
                  <Switch
                    checked={holiday.enabled !== false}
                    onChange={(e) => handleHolidayChange(index, 'enabled', e.currentTarget.checked)}
                    disabled={readOnly}
                    label="Active"
                  />
                  
                  {!readOnly && (
                    <Button
                      icon={IconNames.TRASH}
                      intent={Intent.DANGER}
                      minimal
                      small
                      onClick={() => handleRemoveHoliday(index)}
                    />
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: 'var(--bp5-background-color-secondary)', borderRadius: '4px' }}>
        <small style={{ color: 'var(--bp5-text-color-muted)' }}>
          <strong>Note:</strong> During holidays, the HVAC system typically operates in unoccupied mode 
          regardless of the normal schedule. Disable holidays that should follow regular schedules.
        </small>
      </div>
    </div>
  );
}
