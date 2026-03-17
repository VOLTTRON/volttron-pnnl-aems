export interface TimeRangePreset {
  value: string;
  label: string;
  placeholder: string;
}

export const TIME_RANGE_PRESETS: TimeRangePreset[] = [
  { value: '1h', label: 'Last Hour', placeholder: '1 hour ago' },
  { value: '3h', label: 'Last 3 Hours', placeholder: '3 hours ago' },
  { value: '6h', label: 'Last 6 Hours', placeholder: '6 hours ago' },
  { value: '12h', label: 'Last 12 Hours', placeholder: '12 hours ago' },
  { value: '24h', label: 'Last 24 Hours', placeholder: '1 day ago' },
  { value: '7d', label: 'Last 7 Days', placeholder: '7 days ago' },
  { value: '30d', label: 'Last 30 Days', placeholder: '30 days ago' },
  { value: '90d', label: 'Last 90 Days', placeholder: '90 days ago' },
  { value: '180d', label: 'Last 180 Days', placeholder: '180 days ago' },
  { value: '365d', label: 'Last 1 Year', placeholder: '1 year ago' },
  { value: '730d', label: 'Last 2 Years', placeholder: '2 years ago' },
  { value: '1825d', label: 'Last 5 Years', placeholder: '5 years ago' },
];
