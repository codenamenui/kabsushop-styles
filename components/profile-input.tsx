import React, { ChangeEvent } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

interface FormInputProps {
  label: string;
  type: string;
  name: string;
  id: string;
  value: string;
  placeholder: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const ProfileInputComponent = ({
  label,
  type,
  name,
  id,
  value,
  placeholder,
  onChange,
}: FormInputProps) => {
  return (
    <div className="flex flex-col gap-0.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        type={type}
        name={name}
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        // required
        className="form-input"
      />
      <br />
    </div>
  );
};

export default ProfileInputComponent;
