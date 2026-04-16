"use client";

import { useState } from "react";
import { Button, Checkbox, FormGroup, HTMLSelect } from "@blueprintjs/core";
import { DateInput3 } from "@blueprintjs/datetime2";
import { TIME_RANGE_PRESETS } from "../constants/timeRangePresets";
import { calculateFromDateForPreset, validateDateRange } from "../utils/timeRange";
import styles from "./TimeRangeSelector.module.scss";

interface TimeRangeSelectorProps {
  onApply: (startTime: string, endTime: string) => void;
}

export function TimeRangeSelector({ onApply }: TimeRangeSelectorProps) {
  // Initialize with default preset (7 days)
  const initialFromDate = calculateFromDateForPreset("7d");

  // Local state for editing
  const [localFromDate, setLocalFromDate] = useState<Date | null>(null);
  const [localToDate, setLocalToDate] = useState<Date | null>(null);
  const [localUseCurrentTime, setLocalUseCurrentTime] = useState<boolean>(true);
  const [localSelectedPreset, setLocalSelectedPreset] = useState<string>("7d");
  const [validationError, setValidationError] = useState<string>("");

  // Applied state (what's currently active)
  const [appliedFromDate, setAppliedFromDate] = useState<Date>(initialFromDate);
  const [appliedToDate, setAppliedToDate] = useState<Date | null>(null);
  const [appliedUseCurrentTime, setAppliedUseCurrentTime] = useState<boolean>(true);
  const [appliedPreset, setAppliedPreset] = useState<string>("7d");

  // Check if there are pending changes
  const hasChanges = () => {
    // If preset-based, check if from date is set (user manually entered)
    if (localSelectedPreset !== "custom" && localFromDate !== null) {
      return true;
    }

    // Check if preset changed
    if (localSelectedPreset !== appliedPreset) {
      return true;
    }

    // Check if to date or use current time changed
    if (localUseCurrentTime !== appliedUseCurrentTime) {
      return true;
    }

    if (!localUseCurrentTime && localToDate?.getTime() !== appliedToDate?.getTime()) {
      return true;
    }

    // For custom range, check if from date changed
    if (localSelectedPreset === "custom" && localFromDate?.getTime() !== appliedFromDate?.getTime()) {
      return true;
    }

    return false;
  };

  const handlePresetChange = (preset: string) => {
    if (preset === "custom") {
      setLocalSelectedPreset("custom");
      return;
    }

    // Set the preset and clear from date to show placeholder
    setLocalSelectedPreset(preset);
    setLocalFromDate(null);
    setLocalToDate(null);
    setLocalUseCurrentTime(true);
    setValidationError("");
  };

  const handleFromDateChange = (newDate: string | Date | null) => {
    let parsedDate: Date | null = null;

    if (typeof newDate === "string") {
      const parsed = parseDate(newDate);
      if (parsed) parsedDate = parsed;
    } else if (newDate instanceof Date) {
      parsedDate = newDate;
    }

    setLocalFromDate(parsedDate);

    // Switch to custom if user manually enters a date
    if (parsedDate !== null && localSelectedPreset !== "custom") {
      setLocalSelectedPreset("custom");
    }

    setValidationError("");
  };

  const handleToDateChange = (newDate: string | Date | null) => {
    let parsedDate: Date | null = null;

    if (typeof newDate === "string") {
      const parsed = parseDate(newDate);
      if (parsed) parsedDate = parsed;
    } else if (newDate instanceof Date) {
      parsedDate = newDate;
    }

    setLocalToDate(parsedDate);

    // Switch to custom if user manually enters a date
    if (parsedDate !== null && localSelectedPreset !== "custom") {
      setLocalSelectedPreset("custom");
    }

    setValidationError("");
  };

  const handleApply = () => {
    // Calculate the actual from date
    let actualFromDate: Date;

    if (localSelectedPreset !== "custom" && localFromDate === null) {
      // Calculate from preset
      actualFromDate = calculateFromDateForPreset(localSelectedPreset);
    } else if (localFromDate !== null) {
      actualFromDate = localFromDate;
    } else {
      setValidationError("Please specify a From date");
      return;
    }

    // Determine the end date
    const actualToDate = localUseCurrentTime || !localToDate ? new Date() : localToDate;

    // Validate date range
    if (!validateDateRange(actualFromDate, localToDate)) {
      setValidationError("From date must be before To date");
      return;
    }

    setValidationError("");

    // Update applied state
    setAppliedFromDate(actualFromDate);
    setAppliedToDate(localToDate);
    setAppliedUseCurrentTime(localUseCurrentTime);
    setAppliedPreset(localSelectedPreset);

    // Call parent callback with ISO strings
    onApply(actualFromDate.toISOString(), actualToDate.toISOString());
  };

  const handleRefresh = () => {
    // Re-apply the current settings
    const actualToDate = appliedUseCurrentTime || !appliedToDate ? new Date() : appliedToDate;
    onApply(appliedFromDate.toISOString(), actualToDate.toISOString());
  };

  const handleUseCurrentTimeChange = (checked: boolean) => {
    setLocalUseCurrentTime(checked);
    if (checked) {
      setLocalToDate(null);
      setValidationError("");
    } else {
      setLocalToDate(new Date());
    }

    // Switch to custom if changing from a preset
    if (localSelectedPreset !== "custom") {
      setLocalSelectedPreset("custom");
    }
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return "";
    return date.toLocaleString();
  };

  const parseDate = (str: string): Date | null => {
    const date = new Date(str);
    return isNaN(date.getTime()) ? null : date;
  };

  const getFromPlaceholder = (): string => {
    if (localSelectedPreset === "custom") {
      return "Select start date";
    }
    const preset = TIME_RANGE_PRESETS.find((p) => p.value === localSelectedPreset);
    return preset?.placeholder || "Select start date";
  };

  return (
    <div className={styles.container}>
      <FormGroup label="From" inline className={styles.formGroup}>
        <DateInput3
          value={formatDate(localFromDate)}
          onChange={handleFromDateChange}
          timePrecision="minute"
          fill={false}
          placeholder={getFromPlaceholder()}
          closeOnSelection={false}
        />
      </FormGroup>

      <FormGroup label="To" inline className={styles.formGroup}>
        <DateInput3
          value={localUseCurrentTime ? "" : formatDate(localToDate)}
          onChange={handleToDateChange}
          timePrecision="minute"
          fill={false}
          disabled={localUseCurrentTime}
          placeholder="Current Time"
          closeOnSelection={false}
        />
      </FormGroup>

      <Checkbox
        checked={localUseCurrentTime}
        onChange={(e) => handleUseCurrentTimeChange(e.currentTarget.checked)}
        label="Use Current Time"
        className={styles.checkbox}
      />

      <HTMLSelect
        value={localSelectedPreset}
        onChange={(e) => handlePresetChange(e.target.value)}
        className={styles.presetSelect}
      >
        <option value="custom">Custom Range</option>
        {TIME_RANGE_PRESETS.map((preset) => (
          <option key={preset.value} value={preset.value}>
            {preset.label}
          </option>
        ))}
      </HTMLSelect>

      <Button
        intent="primary"
        onClick={handleApply}
        className={styles.applyButton}
        disabled={!hasChanges() || !!validationError}
      >
        Apply
      </Button>

      <Button icon="refresh" onClick={handleRefresh} className={styles.refreshButton} minimal title="Refresh data" />

      {validationError && <div className={styles.error}>{validationError}</div>}
    </div>
  );
}
