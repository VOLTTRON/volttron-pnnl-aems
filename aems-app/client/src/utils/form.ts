import { Intent } from "@blueprintjs/core";
import validator from "validator";

/**
 * isValid - validates by type
 * Case for types email, username, name, and tagname
 * * value length has to be greater than 2
 * * value has to be unique
 * @param {string} type
 * @param {string | number} value
 * @param {string[]} values
 */
const isValid = (type: string, value: string | number, values: Array<string | number>) => {
  switch (type) {
    case "email":
      return validator.isEmail(`${value}`) && (Array.isArray(values) ? !values.includes(value) : true);
    case "username":
    case "name":
      return validator.isLength(`${value}`, { min: 2 }) && (Array.isArray(values) ? !values.includes(value) : true);
    case "text":
      return validator.isLength(`${value}`, { min: 1 });
    case "ssid":
      return validator.isLength(`${value}`, { min: 1, max: 32 });
    case "password":
      return (
        validator.isLength(`${value}`, { min: 8 }) &&
        validator.matches(`${value}`, /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9\s]).*$/)
      );
    case "url":
      return validator.isURL(`${value}`);
    case "description":
      return (
        value !== undefined &&
        (validator.isEmpty(`${value}`, { ignore_whitespace: true }) || validator.isLength(`${value}`, { min: 0 }))
      );
    case "ip":
      return validator.isIP(`${value}`) && (Array.isArray(values) ? !values.includes(value) : true);
    default:
      return true;
  }
};

const getMessage = (type: string, value: string | number, values: Array<string | number>) => {
  if (isValid(type, value, values)) {
    return undefined;
  }
  switch (type) {
    case "email":
      if (!validator.isEmail(`${value}`)) {
        return "Must be a valid email address.";
      } else if (Array.isArray(values) ? values.includes(value) : true) {
        return "An account with this email address already exists.";
      } else {
        return "Must be a valid email address.";
      }
    case "username":
      if (!validator.isLength(`${value}`, { min: 2 })) {
        return "Must be at least 2 characters long.";
      } else if (Array.isArray(values) && values.includes(value)) {
        return "An account with this username already exists.";
      } else {
        return "Must be a valid username.";
      }
    case "name":
      if (!validator.isLength(`${value}`, { min: 2 })) {
        return "Must be at least 2 characters long.";
      } else if (Array.isArray(values) && values.includes(value)) {
        return "An account with this name already exists.";
      } else {
        return "Must be a valid name.";
      }
    case "text":
      if (!validator.isLength(`${value}`, { min: 1 })) {
        return "Must be at least 1 character long.";
      } else {
        return "Must enter text in this field.";
      }
    case "ssid":
      if (!validator.isLength(`${value}`, { min: 1 })) {
        return "Must enter SSID in this field.";
      } else if (!validator.isLength(`${value}`, { max: 32 })) {
        return "SSID can be a maximum of 32 characters.";
      } else {
        return "Must enter SSID in this field.";
      }
    case "password":
      if (!validator.isLength(`${value}`, { min: 8 })) {
        return "Must be at least 8 characters long.";
      } else if (!validator.matches(`${value}`, /[a-z]/)) {
        return "Must contain a lowercase letter.";
      } else if (!validator.matches(`${value}`, /[A-Z]/)) {
        return "Must contain an uppercase letter.";
      } else if (!validator.matches(`${value}`, /[0-9]/)) {
        return "Must contain a number.";
      } else if (!validator.matches(`${value}`, /[^a-zA-Z0-9\s]/)) {
        return "Must contain a special character.";
      } else {
        return "Must be a valid password.";
      }
    case "url":
      return "Must be a valid URL.";
    case "ip":
      return "Must be a valid IP address.";
    default:
      return "";
  }
};

export const validate = (type: string) => {
  switch (type) {
    case "description":
    case "email":
    case "username":
    case "name":
    case "text":
    case "ssid":
    case "password":
    case "url":
    case "ip":
      break;
    default:
      throw new Error(`Unknown validate option passed to form.validate(): ${type}`);
  }
  return {
    isValid: (value: string | number, values: Array<string | number>) => isValid(type, value, values),
    getMessage: (value: string | number, values: Array<string | number>) => getMessage(type, value, values),
  };
};

export interface SingleInputType {
  name: string;
  className?: string;
  type?: string;
  autoComplete?: string;
  label?: string;
  labelInfo?: string;
  value?: string;
  intent?: Intent;
  handleChange?: any;
  helperText?: string;
  element?: JSX.Element;
  readOnly?: boolean;
  maxLength?: number;
  error?: string;
  placeholder?: string;
}
