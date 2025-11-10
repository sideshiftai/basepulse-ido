'use client';

import { useState } from 'react';
import { VestingConfig } from '@/app/admin/create/page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface VestingSetupStepProps {
  data: VestingConfig;
  onChange: (data: VestingConfig) => void;
  onNext: () => void;
  onBack: () => void;
}

export function VestingSetupStep({ data, onChange, onNext, onBack }: VestingSetupStepProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof VestingConfig, string>>>({});

  const handleChange = (field: keyof VestingConfig, value: number) => {
    onChange({ ...data, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof VestingConfig, string>> = {};

    if (data.tgePercent < 0 || data.tgePercent > 100) {
      newErrors.tgePercent = 'TGE percentage must be between 0 and 100';
    }

    if (data.cliffDuration < 0) {
      newErrors.cliffDuration = 'Cliff duration cannot be negative';
    }

    if (data.vestingDuration <= 0) {
      newErrors.vestingDuration = 'Vesting duration must be greater than 0';
    }

    if (data.tgePercent === 100 && data.vestingDuration > 0) {
      newErrors.tgePercent = 'If TGE is 100%, vesting duration should be 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  const calculateVestingSchedule = () => {
    const tgeAmount = data.tgePercent;
    const vestedAmount = 100 - data.tgePercent;
    const schedule = [];

    schedule.push({
      time: 'TGE (Token Generation Event)',
      amount: `${tgeAmount}%`,
    });

    if (vestedAmount > 0) {
      if (data.cliffDuration > 0) {
        schedule.push({
          time: `After ${data.cliffDuration} day${data.cliffDuration > 1 ? 's' : ''} (Cliff)`,
          amount: '0%',
        });
      }

      const vestingStart = data.cliffDuration;
      const vestingEnd = vestingStart + data.vestingDuration;

      schedule.push({
        time: `Days ${vestingStart}-${vestingEnd} (Linear vesting)`,
        amount: `${vestedAmount}%`,
      });
    }

    return schedule;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Vesting Configuration
          </CardTitle>
          <CardDescription>
            Configure how tokens will be released to contributors over time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="tgePercent">
                  TGE Unlock Percentage
                </Label>
                <span className="text-sm font-medium">{data.tgePercent}%</span>
              </div>
              <Slider
                id="tgePercent"
                min={0}
                max={100}
                step={5}
                value={[data.tgePercent]}
                onValueChange={(value) => handleChange('tgePercent', value[0])}
              />
              <p className="text-xs text-muted-foreground">
                Percentage of tokens unlocked immediately at TGE
              </p>
              {errors.tgePercent && (
                <p className="text-sm text-destructive">{errors.tgePercent}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cliffDuration">
                Cliff Duration (days)
              </Label>
              <Input
                id="cliffDuration"
                type="number"
                min="0"
                placeholder="0"
                value={data.cliffDuration}
                onChange={(e) => handleChange('cliffDuration', parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Period after TGE before vesting begins (0 for no cliff)
              </p>
              {errors.cliffDuration && (
                <p className="text-sm text-destructive">{errors.cliffDuration}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vestingDuration">
                Vesting Duration (days)
              </Label>
              <Input
                id="vestingDuration"
                type="number"
                min="0"
                placeholder="180"
                value={data.vestingDuration}
                onChange={(e) => handleChange('vestingDuration', parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Duration over which remaining tokens vest linearly
              </p>
              {errors.vestingDuration && (
                <p className="text-sm text-destructive">{errors.vestingDuration}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vesting Schedule Preview</CardTitle>
          <CardDescription>
            Visual representation of the token unlock schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {calculateVestingSchedule().map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <span className="text-sm">{item.time}</span>
                <span className="text-sm font-medium">{item.amount}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Summary</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>Initial unlock: {data.tgePercent}% at TGE</li>
              <li>Cliff period: {data.cliffDuration} days</li>
              <li>Vesting period: {data.vestingDuration} days</li>
              <li>Total duration: {data.cliffDuration + data.vestingDuration} days</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleNext}>
          Next
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
