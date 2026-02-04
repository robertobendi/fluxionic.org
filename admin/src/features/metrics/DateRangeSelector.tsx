import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface DateRangeSelectorProps {
  value: number
  onChange: (days: number) => void
  className?: string
}

export function DateRangeSelector({
  value,
  onChange,
  className,
}: DateRangeSelectorProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Label htmlFor="date-range" className="text-sm whitespace-nowrap">
        Period:
      </Label>
      <Select
        id="date-range"
        value={value.toString()}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-36"
      >
        <option value="7">Last 7 days</option>
        <option value="30">Last 30 days</option>
        <option value="90">Last 90 days</option>
      </Select>
    </div>
  )
}
