'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { TIMEZONES } from '@databuddy/shared';
import { formatDate, getBrowserTimezone } from '@databuddy/shared';
import { getUserPreferences, updateUserPreferences } from '@/app/actions/preferences';
import { Clock, Globe, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DATE_FORMATS = [
  { value: 'MMM D, YYYY', label: 'Jan 1, 2023' },
  { value: 'D MMM YYYY', label: '1 Jan 2023' },
  { value: 'YYYY-MM-DD', label: '2023-01-01' },
  { value: 'MM/DD/YYYY', label: '01/01/2023' },
];

const TIME_FORMATS = [
  { value: 'h:mm a', label: '1:30 pm' },
  { value: 'HH:mm', label: '13:30' },
];

export default function TimezonePreferences() {
  const [preferences, setPreferences] = useState({
    timezone: 'auto',
    dateFormat: 'MMM D, YYYY',
    timeFormat: 'h:mm a'
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timezone');
  
  // Fetch user preferences on mount
  useEffect(() => {
    getUserPreferences().then(result => {
      if (result.data) {
        setPreferences({
          timezone: result.data.timezone || 'auto',
          dateFormat: result.data.dateFormat || 'MMM D, YYYY',
          timeFormat: result.data.timeFormat || 'h:mm a'
        });
      }
      setLoading(false);
    }).catch(() => {
      toast.error('Failed to load preferences');
      setLoading(false);
    });
  }, []);
  
  // Save preferences
  const handleSave = async () => {
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('timezone', preferences.timezone);
      formData.append('dateFormat', preferences.dateFormat);
      formData.append('timeFormat', preferences.timeFormat);
      
      const result = await updateUserPreferences(formData);
      
      if (result.success) {
        toast.success('Preferences saved');
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };
  
  // Current date/time for examples
  const now = new Date();
  const dateExample = formatDate(now, { 
    timezone: preferences.timezone === 'auto' ? getBrowserTimezone() : preferences.timezone,
    dateFormat: preferences.dateFormat,
    timeFormat: undefined
  });
  
  const timeExample = formatDate(now, { 
    timezone: preferences.timezone === 'auto' ? getBrowserTimezone() : preferences.timezone, 
    dateFormat: undefined,
    timeFormat: preferences.timeFormat
  });
  
  // Group timezones by offset for better organization
  const timezonesByOffset = Object.entries(
    TIMEZONES.reduce((acc, tz) => {
      (acc[tz.offset] = acc[tz.offset] || []).push(tz);
      return acc;
    }, {} as Record<string, typeof TIMEZONES>)
  ).sort((a, b) => {
    return parseFloat(a[0].replace('UTC', '').replace('+', '')) - 
           parseFloat(b[0].replace('UTC', '').replace('+', ''));
  });
  
  if (loading) {
    return (
      <Card className="border-0 shadow-none">
        <CardContent className="p-1 pt-2 text-center text-sm text-muted-foreground">
          <Clock className="h-4 w-4 inline mr-1 animate-spin" />
          Loading preferences...
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0 space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full mb-4">
            <TabsTrigger value="timezone" className="flex gap-1.5 items-center">
              <Globe className="h-3.5 w-3.5" />
              <span>Timezone</span>
            </TabsTrigger>
            <TabsTrigger value="date" className="flex gap-1.5 items-center">
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>Date</span>
            </TabsTrigger>
            <TabsTrigger value="time" className="flex gap-1.5 items-center">
              <Clock className="h-3.5 w-3.5" />
              <span>Time</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timezone" className="mt-0">
            <div className="mb-2 flex items-center gap-2">
              <Button 
                size="sm"
                variant={preferences.timezone === 'auto' ? 'default' : 'outline'} 
                onClick={() => setPreferences({...preferences, timezone: 'auto'})}
              >
                Auto ({getBrowserTimezone()})
              </Button>
            </div>

            <div className="border rounded-md h-[250px] overflow-y-auto text-xs">
              {timezonesByOffset.map(([offset, zones]) => (
                <div key={offset} className="border-b last:border-0">
                  <div className="font-medium px-3 py-1.5 bg-muted/40">{offset}</div>
                  <div className="p-1">
                    {zones.map(tz => (
                      <div 
                        key={tz.region}
                        className={cn(
                          "px-2 py-1 cursor-pointer rounded hover:bg-accent",
                          preferences.timezone === tz.region && "bg-accent"
                        )}
                        onClick={() => setPreferences({...preferences, timezone: tz.region})}
                      >
                        {tz.label}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="date" className="mt-0">
            <div className="grid grid-cols-2 gap-2">
              {DATE_FORMATS.map(option => (
                <div
                  key={option.value}
                  className={cn(
                    "border rounded-md p-2 cursor-pointer",
                    preferences.dateFormat === option.value 
                      ? "border-primary bg-primary/5" 
                      : "hover:bg-accent"
                  )}
                  onClick={() => setPreferences({...preferences, dateFormat: option.value})}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground">{option.value}</div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="time" className="mt-0">
            <div className="grid grid-cols-2 gap-2">
              {TIME_FORMATS.map(option => (
                <div
                  key={option.value}
                  className={cn(
                    "border rounded-md p-2 cursor-pointer",
                    preferences.timeFormat === option.value 
                      ? "border-primary bg-primary/5" 
                      : "hover:bg-accent"
                  )}
                  onClick={() => setPreferences({...preferences, timeFormat: option.value})}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground">{option.value}</div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between text-sm border-t pt-3">
          <div>
            <span className="text-muted-foreground">Preview: </span>
            <span>{dateExample} {timeExample}</span>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            size="sm"
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 