'use client';

import { useState } from 'react';
import { SaleParameters } from '@/app/admin/create/page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ParametersStepProps {
  data: SaleParameters;
  onChange: (data: SaleParameters) => void;
  onNext: () => void;
  onBack: () => void;
}

export function SaleParametersStep({ data, onChange, onNext, onBack }: ParametersStepProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof SaleParameters, string>>>({});

  const handleChange = (field: keyof SaleParameters, value: string | Date) => {
    onChange({ ...data, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof SaleParameters, string>> = {};
    const now = new Date();

    if (!data.startTime) {
      newErrors.startTime = 'Start time is required';
    } else if (data.startTime < now) {
      newErrors.startTime = 'Start time must be in the future';
    }

    if (!data.endTime) {
      newErrors.endTime = 'End time is required';
    } else if (data.endTime <= data.startTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    if (!data.tokenPrice || parseFloat(data.tokenPrice) <= 0) {
      newErrors.tokenPrice = 'Valid token price is required';
    }

    if (!data.hardCap || parseFloat(data.hardCap) <= 0) {
      newErrors.hardCap = 'Valid hard cap is required';
    }

    if (!data.softCap || parseFloat(data.softCap) <= 0) {
      newErrors.softCap = 'Valid soft cap is required';
    } else if (parseFloat(data.softCap) > parseFloat(data.hardCap)) {
      newErrors.softCap = 'Soft cap cannot exceed hard cap';
    }

    if (!data.minContribution || parseFloat(data.minContribution) <= 0) {
      newErrors.minContribution = 'Valid minimum contribution is required';
    }

    if (!data.maxGasPrice || parseFloat(data.maxGasPrice) <= 0) {
      newErrors.maxGasPrice = 'Valid max gas price is required';
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

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startTime">
            Sale Start Time <span className="text-destructive">*</span>
          </Label>
          <Input
            id="startTime"
            type="datetime-local"
            value={formatDateTimeLocal(data.startTime)}
            onChange={(e) => handleChange('startTime', new Date(e.target.value))}
          />
          {errors.startTime && (
            <p className="text-sm text-destructive">{errors.startTime}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="endTime">
            Sale End Time <span className="text-destructive">*</span>
          </Label>
          <Input
            id="endTime"
            type="datetime-local"
            value={formatDateTimeLocal(data.endTime)}
            onChange={(e) => handleChange('endTime', new Date(e.target.value))}
          />
          {errors.endTime && (
            <p className="text-sm text-destructive">{errors.endTime}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tokenPrice">
          Token Price (in ETH) <span className="text-destructive">*</span>
        </Label>
        <Input
          id="tokenPrice"
          type="number"
          step="0.000001"
          placeholder="0.0001"
          value={data.tokenPrice}
          onChange={(e) => handleChange('tokenPrice', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Price per token in ETH (e.g., 0.0001 ETH per token)
        </p>
        {errors.tokenPrice && (
          <p className="text-sm text-destructive">{errors.tokenPrice}</p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="softCap">
            Soft Cap (ETH) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="softCap"
            type="number"
            step="0.1"
            placeholder="10"
            value={data.softCap}
            onChange={(e) => handleChange('softCap', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Minimum amount to raise for success
          </p>
          {errors.softCap && (
            <p className="text-sm text-destructive">{errors.softCap}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="hardCap">
            Hard Cap (ETH) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="hardCap"
            type="number"
            step="0.1"
            placeholder="100"
            value={data.hardCap}
            onChange={(e) => handleChange('hardCap', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Maximum amount to raise
          </p>
          {errors.hardCap && (
            <p className="text-sm text-destructive">{errors.hardCap}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="minContribution">
          Minimum Contribution (ETH) <span className="text-destructive">*</span>
        </Label>
        <Input
          id="minContribution"
          type="number"
          step="0.01"
          placeholder="0.1"
          value={data.minContribution}
          onChange={(e) => handleChange('minContribution', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Minimum amount users can contribute
        </p>
        {errors.minContribution && (
          <p className="text-sm text-destructive">{errors.minContribution}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxGasPrice">
          Max Gas Price (Gwei) <span className="text-destructive">*</span>
        </Label>
        <Input
          id="maxGasPrice"
          type="number"
          placeholder="1000"
          value={data.maxGasPrice}
          onChange={(e) => handleChange('maxGasPrice', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Maximum gas price allowed for contributions (anti-bot measure)
        </p>
        {errors.maxGasPrice && (
          <p className="text-sm text-destructive">{errors.maxGasPrice}</p>
        )}
      </div>

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
