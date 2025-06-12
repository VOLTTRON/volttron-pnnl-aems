import "./style.scss";

import { FormGroup, InputGroup, Intent } from "@blueprintjs/core";

import { SingleInputType } from "utils/form";

export default function FormInput(props: SingleInputType) {
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
    <FormGroup className={`${className} single-input`} label={label} labelFor={name} labelInfo={labelInfo}>
      <InputGroup
        maxLength={maxLength}
        intent={intent ? intent : error ? Intent.DANGER : Intent.NONE}
        name={name}
        value={value}
        type={type}
        readOnly={readOnly}
        onChange={handleChange}
        leftElement={element as JSX.Element}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      {error ? <span className="red helperText">{error}</span> : <span className="grey helperText">{helperText}</span>}
    </FormGroup>
  );
}
