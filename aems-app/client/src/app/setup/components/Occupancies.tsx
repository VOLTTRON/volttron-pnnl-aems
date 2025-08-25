import { 
  Button,
  Card,
  FormGroup,
  InputGroup,
  Intent,
  Label,
  Switch,
  Alert
} from "@blueprintjs/core";
import { DatePicker } from "@blueprintjs/datetime";
import { IconNames } from "@blueprintjs/icons";
import { useCallback, useState } from "react";
import { get } from "lodash";

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

interface OccupanciesProps {
  unit: any;
  editing: DeepPartial<any> | null;
  handleChange: (field: string, editingUnit?: DeepPartial<any> | null) => (value: any) => void;
  readOnly?: boolean;
}

interface Occupancy {
  id?: number;
  label: string;
  date: string;
  occupied: boolean;
  startTime: string;
  endTime: string;
  createdAt?: string;
}

export function Occupancies({ unit, editing, handleChange, readOnly = false }: OccupanciesProps) {
  const [showAddOccupancy, setShowAddOccupancy] = useState(false);
  const [newOccupancy, setNewOccupancy] = useState({
    label: '',
    date: new Date().toISOString().split('T')[0],
    occupied: true,
    startTime: '08:00',
    endTime: '17:00'
  });
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const getValue = useCallback((field: string) => {
    return get(editing, field, get(unit, field));
  }, [editing, unit]);

  const getOccupancies = useCallback((): Occupancy[] => {
    return getValue("configuration.occupancies") || [];
  }, [getValue]);

  const handleAddOccupancy = useCallback(() => {
    const occupancies = getOccupancies();
    const updatedOccupancies = [...occupancies, { 
      ...newOccupancy, 
      id: Date.now(),
      createdAt: new Date().toISOString()
    }];
    handleChange("configuration.occupancies", editing)(updatedOccupancies);
    setNewOccupancy({
      label: '',
      date: new Date().toISOString().split('T')[0],
      occupied: true,
      startTime: '08:00',
      endTime: '17:00'
    });
    setShowAddOccupancy(false);
  }, [getOccupancies, handleChange, editing, newOccupancy]);

  const handleRemoveOccupancy = useCallback((index: number) => {
    const occupancies = getOccupancies();
    const updatedOccupancies = occupancies.filter((_, i) => i !== index);
    handleChange("configuration.occupancies", editing)(updatedOccupancies);
    setDeleteConfirm(null);
  }, [getOccupancies, handleChange, editing]);

  const handleOccupancyChange = useCallback((index: number, field: string, value: any) => {
    const occupancies = getOccupancies();
    const updatedOccupancies = [...occupancies];
    updatedOccupancies[index] = { ...updatedOccupancies[index], [field]: value };
    handleChange("configuration.occupancies", editing)(updatedOccupancies);
  }, [getOccupancies, handleChange, editing]);

  const occupancies = getOccupancies();

  return (
    <div style={{ padding: '1rem' }}>
      {!readOnly && (
        <div style={{ marginBottom: '1rem' }}>
          <Button
            icon={IconNames.PLUS}
            intent={Intent.SUCCESS}
            onClick={() => setShowAddOccupancy(!showAddOccupancy)}
          >
            Add Temporary Occupancy
          </Button>
        </div>
      )}

      {showAddOccupancy && (
        <Card style={{ padding: '1rem', marginBottom: '1rem' }}>
          <h4>Add New Temporary Occupancy</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0.5rem', alignItems: 'end' }}>
            <FormGroup label="Occupancy Label">
              <InputGroup
                value={newOccupancy.label}
                onChange={(e) => setNewOccupancy({ ...newOccupancy, label: e.target.value })}
                placeholder="Enter occupancy description"
              />
            </FormGroup>
            
            <FormGroup label="Date">
              <InputGroup
                type="date"
                value={newOccupancy.date}
                onChange={(e) => setNewOccupancy({ ...newOccupancy, date: e.target.value })}
              />
            </FormGroup>
            
            <FormGroup label="Start Time">
              <InputGroup
                type="time"
                value={newOccupancy.startTime}
                onChange={(e) => setNewOccupancy({ ...newOccupancy, startTime: e.target.value })}
                disabled={!newOccupancy.occupied}
              />
            </FormGroup>
            
            <FormGroup label="End Time">
              <InputGroup
                type="time"
                value={newOccupancy.endTime}
                onChange={(e) => setNewOccupancy({ ...newOccupancy, endTime: e.target.value })}
                disabled={!newOccupancy.occupied}
              />
            </FormGroup>
          </div>
          
          <FormGroup style={{ marginTop: '0.5rem' }}>
            <Switch
              checked={newOccupancy.occupied}
              onChange={(e) => setNewOccupancy({ ...newOccupancy, occupied: e.currentTarget.checked })}
              label="Occupied Period"
            />
          </FormGroup>
          
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <Button
              icon={IconNames.CONFIRM}
              intent={Intent.PRIMARY}
              onClick={handleAddOccupancy}
              disabled={!newOccupancy.label.trim()}
            >
              Add Occupancy
            </Button>
            <Button
              icon={IconNames.CROSS}
              onClick={() => setShowAddOccupancy(false)}
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div>
        <h4>Temporary Occupancies ({occupancies.length})</h4>
        {occupancies.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--bp5-text-color-muted)' }}>
            No temporary occupancies configured. Add occupancies above to override normal schedules for specific dates.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {occupancies
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((occupancy, index) => (
                <Card key={index} style={{ padding: '0.75rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto auto', gap: '1rem', alignItems: 'center' }}>
                    <div>
                      <strong>{occupancy.label}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--bp5-text-color-muted)' }}>
                        {new Date(occupancy.date).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <Switch
                      checked={occupancy.occupied}
                      onChange={(e) => handleOccupancyChange(index, 'occupied', e.currentTarget.checked)}
                      disabled={readOnly}
                      label="Occupied"
                    />
                    
                    <div>
                      <Label style={{ margin: 0, fontSize: '0.75rem' }}>Start Time</Label>
                      <InputGroup
                        type="time"
                        value={occupancy.startTime || '08:00'}
                        onChange={(e) => handleOccupancyChange(index, 'startTime', e.target.value)}
                        disabled={readOnly || !occupancy.occupied}
                        small
                      />
                    </div>
                    
                    <div>
                      <Label style={{ margin: 0, fontSize: '0.75rem' }}>End Time</Label>
                      <InputGroup
                        type="time"
                        value={occupancy.endTime || '17:00'}
                        onChange={(e) => handleOccupancyChange(index, 'endTime', e.target.value)}
                        disabled={readOnly || !occupancy.occupied}
                        small
                      />
                    </div>
                    
                    <div style={{ fontSize: '0.75rem', color: 'var(--bp5-text-color-muted)' }}>
                      {occupancy.occupied ? `${occupancy.startTime} - ${occupancy.endTime}` : 'Unoccupied'}
                    </div>
                    
                    {!readOnly && (
                      <Button
                        icon={IconNames.TRASH}
                        intent={Intent.DANGER}
                        minimal
                        small
                        onClick={() => setDeleteConfirm(index)}
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
          <strong>Note:</strong> Temporary occupancies override the normal weekly schedule for specific dates. 
          Use this for special events, meetings, or one-time schedule changes.
        </small>
      </div>

      <Alert
        intent={Intent.DANGER}
        isOpen={deleteConfirm !== null}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        onConfirm={() => deleteConfirm !== null && handleRemoveOccupancy(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
      >
        <p>Are you sure you want to delete this temporary occupancy?</p>
      </Alert>
    </div>
  );
}
