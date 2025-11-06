"use client";

import { FormGroup, InputGroup, Intent } from "@blueprintjs/core";
import { ChangeEvent } from "react";

export interface FormInputProps {
  name: string;
  className?: string;
  type?: string;
  autoComplete?: string;
  label?: string;
  labelInfo?: string;
  value?: string;
  intent?: Intent;
  handleChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  helperText?: string;
  element?: JSX.Element;
  readOnly?: boolean;
  maxLength?: number;
  error?: string;
  placeholder?: string;
}

export function FormInput(props: FormInputProps) {
  const {
    name,
    type,
    autoComplete,
    label,
    labelInfo,
    handleChange,
    error,
    className,
    helperText,
    element,
    intent,
    value,
    readOnly,
    maxLength,
    placeholder,
  } = props;

  return (
    <FormGroup className={`${className || ""} single-input`} label={label} labelFor={name} labelInfo={labelInfo}>
      <InputGroup
        maxLength={maxLength}
        intent={intent ? intent : error ? Intent.DANGER : Intent.NONE}
        name={name}
        value={value}
        type={type}
        readOnly={readOnly}
        onChange={handleChange}
        leftElement={element}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      {error ? (
        <span style={{ color: "red" }} className="helperText">
          {error}
        </span>
      ) : (
        <span style={{ color: "gray" }} className="helperText">
          {helperText}
        </span>
      )}
    </FormGroup>
  );
}
