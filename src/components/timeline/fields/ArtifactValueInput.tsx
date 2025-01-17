import React from 'react';
import { Input } from '@/components/ui/input';

interface ArtifactValueInputProps {
  type: string;
  value: string;
  onChange: (value: string) => void;
  recentValues: string[];
  placeholder?: string;
}

export const ArtifactValueInput: React.FC<ArtifactValueInputProps> = ({
  type,
  value,
  onChange,
  recentValues = [],
  placeholder = "Enter value..."
}) => {
  const inputId = `artifact-value-${type}`;
  const datalistId = `recent-values-${type}`;

  return (
    <div className="relative w-full">
      <Input
        id={inputId}
        list={datalistId}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full"
      />
      <datalist id={datalistId}>
        {recentValues.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>
    </div>
  );
};