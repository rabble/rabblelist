import { useState, useEffect } from 'react'
import { RotateCw, CalendarClock } from 'lucide-react'
import type { RecurrenceRule } from './events.service'

interface RecurrenceSettingsProps {
  recurrenceRule?: RecurrenceRule
  onChange: (rule: RecurrenceRule | null) => void
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun', fullLabel: 'Sunday' },
  { value: 1, label: 'Mon', fullLabel: 'Monday' },
  { value: 2, label: 'Tue', fullLabel: 'Tuesday' },
  { value: 3, label: 'Wed', fullLabel: 'Wednesday' },
  { value: 4, label: 'Thu', fullLabel: 'Thursday' },
  { value: 5, label: 'Fri', fullLabel: 'Friday' },
  { value: 6, label: 'Sat', fullLabel: 'Saturday' }
]

export function RecurrenceSettings({ recurrenceRule, onChange }: RecurrenceSettingsProps) {
  const [isRecurring, setIsRecurring] = useState(!!recurrenceRule)
  const [frequency, setFrequency] = useState<RecurrenceRule['frequency']>(recurrenceRule?.frequency || 'weekly')
  const [interval, setInterval] = useState(recurrenceRule?.interval || 1)
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(recurrenceRule?.daysOfWeek || [])
  const [dayOfMonth, setDayOfMonth] = useState(recurrenceRule?.dayOfMonth || 1)
  const [endType, setEndType] = useState<RecurrenceRule['endType']>(recurrenceRule?.endType || 'never')
  const [endAfterOccurrences, setEndAfterOccurrences] = useState(recurrenceRule?.endAfterOccurrences || 10)
  const [endDate, setEndDate] = useState(recurrenceRule?.endDate || '')

  useEffect(() => {
    if (!isRecurring) {
      onChange(null)
    } else {
      const rule: RecurrenceRule = {
        frequency,
        interval,
        endType,
        ...(frequency === 'weekly' && daysOfWeek.length > 0 && { daysOfWeek }),
        ...(frequency === 'monthly' && { dayOfMonth }),
        ...(endType === 'after' && { endAfterOccurrences }),
        ...(endType === 'on' && endDate && { endDate })
      }
      onChange(rule)
    }
  }, [isRecurring, frequency, interval, daysOfWeek, dayOfMonth, endType, endAfterOccurrences, endDate])

  const toggleDayOfWeek = (day: number) => {
    setDaysOfWeek(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    )
  }

  const getFrequencyText = () => {
    const unit = frequency === 'daily' ? 'day' : 
                 frequency === 'weekly' ? 'week' : 
                 frequency === 'monthly' ? 'month' : 'year'
    return interval === 1 ? unit : `${interval} ${unit}s`
  }

  return (
    <div className="space-y-4">
      {/* Recurring Toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is-recurring"
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
        <label htmlFor="is-recurring" className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <RotateCw className="w-4 h-4" />
          Make this a recurring event
        </label>
      </div>

      {isRecurring && (
        <div className="pl-7 space-y-4">
          {/* Frequency */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Repeat every
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="30"
                value={interval}
                onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as RecurrenceRule['frequency'])}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="daily">Day(s)</option>
                <option value="weekly">Week(s)</option>
                <option value="monthly">Month(s)</option>
                <option value="yearly">Year(s)</option>
              </select>
            </div>
          </div>

          {/* Days of Week (for weekly) */}
          {frequency === 'weekly' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Repeat on
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDayOfWeek(day.value)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      daysOfWeek.includes(day.value)
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Day of Month (for monthly) */}
          {frequency === 'monthly' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Day of month
              </label>
              <select
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
                <option value={-1}>Last day of month</option>
              </select>
            </div>
          )}

          {/* End Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Ends
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="end-type"
                  value="never"
                  checked={endType === 'never'}
                  onChange={(e) => setEndType(e.target.value as RecurrenceRule['endType'])}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm">Never</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="end-type"
                  value="after"
                  checked={endType === 'after'}
                  onChange={(e) => setEndType(e.target.value as RecurrenceRule['endType'])}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm">After</span>
                {endType === 'after' && (
                  <>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={endAfterOccurrences}
                      onChange={(e) => setEndAfterOccurrences(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="text-sm">occurrences</span>
                  </>
                )}
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="end-type"
                  value="on"
                  checked={endType === 'on'}
                  onChange={(e) => setEndType(e.target.value as RecurrenceRule['endType'])}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm">On</span>
                {endType === 'on' && (
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                )}
              </label>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-4 p-3 bg-primary-50 rounded-lg">
            <div className="flex items-start gap-2">
              <CalendarClock className="w-4 h-4 text-primary-600 mt-0.5" />
              <div className="text-sm text-primary-900">
                <p className="font-medium">Recurrence Summary</p>
                <p className="mt-1">
                  Repeats every {getFrequencyText()}
                  {frequency === 'weekly' && daysOfWeek.length > 0 && (
                    <> on {daysOfWeek.map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label).join(', ')}</>
                  )}
                  {frequency === 'monthly' && (
                    <> on the {dayOfMonth === -1 ? 'last' : `${dayOfMonth}${getOrdinalSuffix(dayOfMonth)}`} day</>
                  )}
                  {endType === 'after' && <>, {endAfterOccurrences} times</>}
                  {endType === 'on' && endDate && <> until {new Date(endDate).toLocaleDateString()}</>}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getOrdinalSuffix(num: number): string {
  const j = num % 10
  const k = num % 100
  if (j === 1 && k !== 11) return 'st'
  if (j === 2 && k !== 12) return 'nd'
  if (j === 3 && k !== 13) return 'rd'
  return 'th'
}