import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const EMPTY_OPTION_VALUE = "__app_select_empty__";

export interface AppSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface AppSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: AppSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  portal?: boolean;
}

export function AppSelect({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  className,
  contentClassName,
  portal = true,
}: AppSelectProps) {
  const resolvedValue = value === "" ? EMPTY_OPTION_VALUE : value;

  return (
    <Select
      value={resolvedValue}
      onValueChange={(nextValue) => onValueChange(nextValue === EMPTY_OPTION_VALUE ? "" : nextValue)}
      disabled={disabled}
    >
      <SelectTrigger className={cn("h-10", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent portal={portal} className={contentClassName}>
        {options.map((option) => (
          <SelectItem
            key={option.value || EMPTY_OPTION_VALUE}
            value={option.value === "" ? EMPTY_OPTION_VALUE : option.value}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
