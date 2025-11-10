'use client';

import { useState } from 'react';
import { TiersConfiguration, TierConfig } from '@/app/admin/create/page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TierConfigurationStepProps {
  data: TiersConfiguration;
  onChange: (data: TiersConfiguration) => void;
  onNext: () => void;
  onBack: () => void;
}

export function TierConfigurationStep({ data, onChange, onNext, onBack }: TierConfigurationStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleTierChange = (tier: 'seed' | 'private' | 'public', field: keyof TierConfig, value: any) => {
    onChange({
      ...data,
      [tier]: {
        ...data[tier],
        [field]: value,
      },
    });
    const errorKey = `${tier}.${field}`;
    if (errors[errorKey]) {
      const newErrors = { ...errors };
      delete newErrors[errorKey];
      setErrors(newErrors);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    (['seed', 'private', 'public'] as const).forEach((tierName) => {
      const tier = data[tierName];
      if (!tier.enabled) return;

      if (!tier.startTime) {
        newErrors[`${tierName}.startTime`] = 'Start time is required';
      }

      if (!tier.endTime) {
        newErrors[`${tierName}.endTime`] = 'End time is required';
      } else if (tier.endTime <= tier.startTime) {
        newErrors[`${tierName}.endTime`] = 'End time must be after start time';
      }

      if (!tier.tokenPrice || parseFloat(tier.tokenPrice) <= 0) {
        newErrors[`${tierName}.tokenPrice`] = 'Valid token price is required';
      }

      if (!tier.maxAllocation || parseFloat(tier.maxAllocation) <= 0) {
        newErrors[`${tierName}.maxAllocation`] = 'Valid max allocation is required';
      }

      if (!tier.totalAllocation || parseFloat(tier.totalAllocation) <= 0) {
        newErrors[`${tierName}.totalAllocation`] = 'Valid total allocation is required';
      }
    });

    // Check if at least one tier is enabled
    if (!data.seed.enabled && !data.private.enabled && !data.public.enabled) {
      newErrors.general = 'At least one tier must be enabled';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  const formatDateTimeLocal = (date: Date) => {
    if (!date) return '';
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const renderTierCard = (
    tierName: 'seed' | 'private' | 'public',
    title: string,
    description: string
  ) => {
    const tier = data[tierName];

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${tierName}-enabled`}
                checked={tier.enabled}
                onCheckedChange={(checked) =>
                  handleTierChange(tierName, 'enabled', checked)
                }
              />
              <Label htmlFor={`${tierName}-enabled`} className="cursor-pointer">
                Enable
              </Label>
            </div>
          </div>
        </CardHeader>
        {tier.enabled && (
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`${tierName}-startTime`}>Start Time</Label>
                <Input
                  id={`${tierName}-startTime`}
                  type="datetime-local"
                  value={formatDateTimeLocal(tier.startTime)}
                  onChange={(e) =>
                    handleTierChange(tierName, 'startTime', new Date(e.target.value))
                  }
                />
                {errors[`${tierName}.startTime`] && (
                  <p className="text-sm text-destructive">
                    {errors[`${tierName}.startTime`]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${tierName}-endTime`}>End Time</Label>
                <Input
                  id={`${tierName}-endTime`}
                  type="datetime-local"
                  value={formatDateTimeLocal(tier.endTime)}
                  onChange={(e) =>
                    handleTierChange(tierName, 'endTime', new Date(e.target.value))
                  }
                />
                {errors[`${tierName}.endTime`] && (
                  <p className="text-sm text-destructive">
                    {errors[`${tierName}.endTime`]}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${tierName}-tokenPrice`}>Token Price (ETH)</Label>
              <Input
                id={`${tierName}-tokenPrice`}
                type="number"
                step="0.000001"
                placeholder="0.0001"
                value={tier.tokenPrice}
                onChange={(e) =>
                  handleTierChange(tierName, 'tokenPrice', e.target.value)
                }
              />
              {errors[`${tierName}.tokenPrice`] && (
                <p className="text-sm text-destructive">
                  {errors[`${tierName}.tokenPrice`]}
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`${tierName}-maxAllocation`}>
                  Max Allocation per Wallet (tokens)
                </Label>
                <Input
                  id={`${tierName}-maxAllocation`}
                  type="number"
                  placeholder="10000"
                  value={tier.maxAllocation}
                  onChange={(e) =>
                    handleTierChange(tierName, 'maxAllocation', e.target.value)
                  }
                />
                {errors[`${tierName}.maxAllocation`] && (
                  <p className="text-sm text-destructive">
                    {errors[`${tierName}.maxAllocation`]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${tierName}-totalAllocation`}>
                  Total Allocation (tokens)
                </Label>
                <Input
                  id={`${tierName}-totalAllocation`}
                  type="number"
                  placeholder="1000000"
                  value={tier.totalAllocation}
                  onChange={(e) =>
                    handleTierChange(tierName, 'totalAllocation', e.target.value)
                  }
                />
                {errors[`${tierName}.totalAllocation`] && (
                  <p className="text-sm text-destructive">
                    {errors[`${tierName}.totalAllocation`]}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {errors.general && (
        <div className="p-4 border border-destructive bg-destructive/10 rounded-lg text-sm text-destructive">
          {errors.general}
        </div>
      )}

      {renderTierCard('seed', 'Seed Tier', 'Early stage investors with best pricing')}
      {renderTierCard('private', 'Private Tier', 'Private sale round')}
      {renderTierCard('public', 'Public Tier', 'Open to all participants')}

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
