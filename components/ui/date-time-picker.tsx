'use client';

import * as React from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';

export interface DateTimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Pick a date and time',
  disabled = false,
  className
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  );
  const [timeValue, setTimeValue] = React.useState<string>(
    value ? format(new Date(value), 'HH:mm') : '09:00'
  );

  // Sync internal state when value prop changes
  React.useEffect(() => {
    if (value) {
      const newDate = new Date(value);
      setSelectedDate(newDate);
      setTimeValue(format(newDate, 'HH:mm'));
    } else {
      setSelectedDate(undefined);
      setTimeValue('09:00');
    }
  }, [value]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      // Combine date with current time
      const [hours, minutes] = timeValue.split(':');
      const newDate = new Date(date);
      newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));

      // Format as datetime-local string
      const dateTimeString = format(newDate, "yyyy-MM-dd'T'HH:mm");
      onChange?.(dateTimeString);
    }
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = event.target.value;
    setTimeValue(newTime);

    if (selectedDate) {
      const [hours, minutes] = newTime.split(':');
      const newDate = new Date(selectedDate);
      newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));

      // Format as datetime-local string
      const dateTimeString = format(newDate, "yyyy-MM-dd'T'HH:mm");
      onChange?.(dateTimeString);
    }
  };

  const handleClear = () => {
    setSelectedDate(undefined);
    setTimeValue('09:00');
    onChange?.('');
    setIsOpen(false);
  };

  const displayValue = selectedDate
    ? `${format(selectedDate, 'PPP')} at ${timeValue}`
    : '';

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-start text-left font-normal h-12 bg-gray-800 border-gray-600 text-white placeholder-gray-400 hover:bg-gray-700 hover:border-gray-500',
            !selectedDate && 'text-gray-400',
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 bg-gray-800 border-gray-600"
        align="start"
      >
        <div className="p-3 border-b border-gray-600">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <Input
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              className="bg-gray-700 border-gray-600 text-white w-32 h-8"
            />
            {selectedDate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-gray-400 hover:text-white hover:bg-gray-700 px-2"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
        <div className="[&_.rdp-head_cell]:!text-white [&_.rdp-day]:!text-gray-300">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            className="p-3"
            style={{
              color: 'white'
            }}
            classNames={{
              months:
                'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
              month: 'space-y-4',
              caption:
                'flex justify-center pt-1 relative items-center text-white',
              caption_label: 'text-sm font-medium text-white',
              nav: 'space-x-1 flex items-center',
              nav_button:
                'h-7 w-7 bg-gray-700 hover:bg-gray-600 p-0 opacity-50 hover:opacity-100 rounded-md border border-gray-600 text-white hover:text-white',
              nav_button_previous: 'absolute left-1',
              nav_button_next: 'absolute right-1',
              table: 'w-full border-collapse space-y-1',
              head_row: 'flex',
              head_cell:
                'text-white !text-white rounded-md w-9 font-normal text-[0.8rem]',
              row: 'flex w-full mt-2',
              cell: 'text-center text-sm p-0 relative first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
              day: 'h-9 w-9 p-0 font-normal text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors aria-selected:opacity-100',
              day_selected:
                'bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white',
              day_today: 'bg-gray-700 text-white ring-1 ring-blue-500',
              day_outside: 'text-gray-500 opacity-75 hover:opacity-100',
              day_disabled: 'text-gray-600 opacity-50 cursor-not-allowed',
              day_range_middle:
                'aria-selected:bg-gray-700 aria-selected:text-white',
              day_hidden: 'invisible'
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
