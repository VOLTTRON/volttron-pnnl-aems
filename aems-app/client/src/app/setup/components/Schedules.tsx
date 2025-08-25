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

interface SchedulesProps {
  unit: any;
  editing: DeepPartial<any> | null;
  handleChange: (field: string, editingUnit?: DeepPartial<any> | null) => (value: any) => void;
  readOnly?: boolean;
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
];

const DEFAULT_SCHEDULE: Record<string, { occupied: boolean; startTime: string; endTime: string }> = {
  monday: { occupied: true, startTime: '08:00', endTime: '17:00' },
  tuesday: { occupied: true, startTime: '08:00', endTime: '17:00' },
  wednesday: { occupied: true, startTime: '08:00', endTime: '17:00' },
  thursday: { occupied: true, startTime: '08:00', endTime: '17:00' },
  friday: { occupied: true, startTime: '08:00', endTime: '17:00' },
  saturday: { occupied: false, startTime: '08:00', endTime: '17:00' },
  sunday: { occupied: false, startTime: '08:00', endTime: '17:00' }
};

export function Schedules({ unit, editing, handleChange, readOnly = false }: SchedulesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const getValue = useCallback((field: string) => {
    return get(editing, field, get(unit, field));
  }, [editing, unit]);

  const getSchedule = useCallback(() => {
    const schedule = getValue("configuration.schedule") || {};
    return { ...DEFAULT_SCHEDULE, ...schedule };
  }, [getValue]);

  const handleTemplateApply = useCallback((template: string) => {
    let scheduleTemplate: any = {};
    
    switch (template) {
      case 'business':
        scheduleTemplate = {
          monday: { occupied: true, startTime: '08:00', endTime: '17:00' },
          tuesday: { occupied: true, startTime: '08:00', endTime: '17:00' },
          wednesday: { occupied: true, startTime: '08:00', endTime: '17:00' },
          thursday: { occupied: true, startTime: '08:00', endTime: '17:00' },
          friday: { occupied: true, startTime: '08:00', endTime: '17:00' },
          saturday: { occupied: false, startTime: '08:00', endTime: '17:00' },
          sunday: { occupied: false, startTime: '08:00', endTime: '17:00' }
        };
        break;
      case '24/7':
        scheduleTemplate = DAYS_OF_WEEK.reduce((acc, day) => {
          acc[day.value] = { occupied: true, startTime: '00:00', endTime: '23:59' };
          return acc;
        }, {} as any);
        break;
      case 'retail':
        scheduleTemplate = {
          monday: { occupied: true, startTime: '09:00', endTime: '21:00' },
          tuesday: { occupied: true, startTime: '09:00', endTime: '21:00' },
          wednesday: { occupied: true, startTime: '09:00', endTime: '21:00' },
          thursday: { occupied: true, startTime: '09:00', endTime: '21:00' },
          friday: { occupied: true, startTime: '09:00', endTime: '22:00' },
          saturday: { occupied: true, startTime: '09:00', endTime: '22:00' },
          sunday: { occupied: true, startTime: '11:00', endTime: '19:00' }
        };
        break;
      case 'school':
        scheduleTemplate = {
          monday: { occupied: true, startTime: '07:00', endTime: '16:00' },
          tuesday: { occupied: true, startTime: '07:00', endTime: '16:00' },
          wednesday: { occupied: true, startTime: '07:00', endTime: '16:00' },
          thursday: { occupied: true, startTime: '07:00', endTime: '16:00' },
          friday: { occupied: true, startTime: '07:00', endTime: '16:00' },
          saturday: { occupied: false, startTime: '08:00', endTime: '17:00' },
          sunday: { occupied: false, startTime: '08:00', endTime: '17:00' }
        };
        break;
    }
    
    if (Object.keys(scheduleTemplate).length > 0) {
      handleChange("configuration.schedule", editing)(scheduleTemplate);
      setSelectedTemplate('');
    }
  }, [handleChange, editing]);

  const schedule = getSchedule();

  return (
    <div style={{ padding: '1rem' }}>
      {!readOnly && (
        <FormGroup label="Schedule Templates">
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <HTMLSelect
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              options={[
                { value: '', label: 'Select a template...' },
                { value: 'business', label: 'Business Hours (M-F 8AM-5PM)' },
                { value: 'retail', label: 'Retail Hours (Extended weekends)' },
                { value: 'school', label: 'School Hours (M-F 7AM-4PM)' },
                { value: '24/7', label: '24/7 Operation' }
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
      )}

      <div style={{ marginTop: '1rem' }}>
        <h4>Weekly Schedule</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {DAYS_OF_WEEK.map((day) => {
            const daySchedule = schedule[day.value] || DEFAULT_SCHEDULE[day.value];
            
            return (
              <Card key={day.value} style={{ padding: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 120px 120px', gap: '1rem', alignItems: 'center' }}>
                  <Label style={{ margin: 0, fontWeight: 'bold' }}>
                    {day.label}
                  </Label>
                  
                  <Switch
                    checked={daySchedule.occupied}
                    onChange={(e) => 
                      handleChange(`configuration.schedule.${day.value}.occupied`, editing)(e.currentTarget.checked)
                    }
                    disabled={readOnly}
                    label="Occupied"
                  />
                  
                  <div>
                    <Label style={{ margin: 0, fontSize: '0.75rem' }}>Start Time</Label>
                    <InputGroup
                      type="time"
                      value={daySchedule.startTime || '08:00'}
                      onChange={(e) => 
                        handleChange(`configuration.schedule.${day.value}.startTime`, editing)(e.target.value)
                      }
                      disabled={readOnly || !daySchedule.occupied}
                      small
                    />
                  </div>
                  
                  <div>
                    <Label style={{ margin: 0, fontSize: '0.75rem' }}>End Time</Label>
                    <InputGroup
                      type="time"
                      value={daySchedule.endTime || '17:00'}
                      onChange={(e) => 
                        handleChange(`configuration.schedule.${day.value}.endTime`, editing)(e.target.value)
                      }
                      disabled={readOnly || !daySchedule.occupied}
                      small
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: 'var(--bp5-background-color-secondary)', borderRadius: '4px' }}>
        <small style={{ color: 'var(--bp5-text-color-muted)' }}>
          <strong>Note:</strong> Occupied periods determine when the HVAC system maintains comfort setpoints. 
          During unoccupied periods, the system uses energy-saving setback temperatures.
        </small>
      </div>
    </div>
  );
}
