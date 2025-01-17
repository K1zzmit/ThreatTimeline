import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { TimelineEvent } from "@/pages/Index";

interface EntityFieldProps {
  label: string;
  field: keyof TimelineEvent;
  event: TimelineEvent;
  onEventChange: (event: TimelineEvent) => void;
  recentValues: string[];
}

export const EntityField: React.FC<EntityFieldProps> = ({ 
  label, 
  field, 
  event, 
  onEventChange, 
  recentValues 
}) => {
  const value = event[field] as string | undefined;
  const isNewValue = value === `new_${field}`;
  const showInput = isNewValue || (!recentValues.includes(value || '') && value);
  
  const handleClear = () => {
    onEventChange({ ...event, [field]: undefined });
  };

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={field}>{label}</Label>
        {value && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClear}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Select
        value={value || 'select_new'}
        onValueChange={(newValue) => onEventChange({ ...event, [field]: newValue })}
      >
        <SelectTrigger>
          <SelectValue placeholder={`Select ${field}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="select_new">New {label}...</SelectItem>
          {recentValues.map((val) => (
            <SelectItem key={val} value={val}>
              {val}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showInput && (
        <Input
          value={isNewValue ? '' : (value || '')}
          onChange={(e) => onEventChange({ ...event, [field]: e.target.value })}
          placeholder={`Enter new ${field}`}
        />
      )}
    </div>
  );
};