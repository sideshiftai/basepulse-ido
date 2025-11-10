'use client';

import { useState } from 'react';
import { SaleMetadata } from '@/app/admin/create/page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronRight } from 'lucide-react';

interface MetadataStepProps {
  data: SaleMetadata;
  onChange: (data: SaleMetadata) => void;
  onNext: () => void;
}

export function SaleMetadataStep({ data, onChange, onNext }: MetadataStepProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof SaleMetadata, string>>>({});

  const handleChange = (field: keyof SaleMetadata, value: string) => {
    onChange({ ...data, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof SaleMetadata, string>> = {};

    if (!data.name.trim()) newErrors.name = 'Sale name is required';
    if (!data.symbol.trim()) newErrors.symbol = 'Token symbol is required';
    if (!data.description.trim()) newErrors.description = 'Description is required';
    if (!data.saleToken.trim()) {
      newErrors.saleToken = 'Token address is required';
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(data.saleToken)) {
      newErrors.saleToken = 'Invalid address format';
    }

    if (data.logoUrl && !/^https?:\/\/.+/.test(data.logoUrl)) {
      newErrors.logoUrl = 'Invalid URL format';
    }
    if (data.websiteUrl && !/^https?:\/\/.+/.test(data.websiteUrl)) {
      newErrors.websiteUrl = 'Invalid URL format';
    }
    if (data.twitterUrl && !/^https?:\/\/(twitter|x)\.com\/.+/.test(data.twitterUrl)) {
      newErrors.twitterUrl = 'Invalid Twitter URL';
    }
    if (data.telegramUrl && !/^https?:\/\/(t\.me|telegram\.me)\/.+/.test(data.telegramUrl)) {
      newErrors.telegramUrl = 'Invalid Telegram URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">
            Sale Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="e.g., PULSE Token Sale"
            value={data.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="symbol">
            Token Symbol <span className="text-destructive">*</span>
          </Label>
          <Input
            id="symbol"
            placeholder="e.g., PULSE"
            value={data.symbol}
            onChange={(e) => handleChange('symbol', e.target.value)}
          />
          {errors.symbol && (
            <p className="text-sm text-destructive">{errors.symbol}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="saleToken">
          Sale Token Address <span className="text-destructive">*</span>
        </Label>
        <Input
          id="saleToken"
          placeholder="0x..."
          value={data.saleToken}
          onChange={(e) => handleChange('saleToken', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          The ERC20 token contract address that will be sold
        </p>
        {errors.saleToken && (
          <p className="text-sm text-destructive">{errors.saleToken}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Describe your token sale..."
          rows={4}
          value={data.description}
          onChange={(e) => handleChange('description', e.target.value)}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="logoUrl">Logo URL</Label>
        <Input
          id="logoUrl"
          placeholder="https://..."
          value={data.logoUrl}
          onChange={(e) => handleChange('logoUrl', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          IPFS or HTTPS URL to your project logo
        </p>
        {errors.logoUrl && (
          <p className="text-sm text-destructive">{errors.logoUrl}</p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="websiteUrl">Website URL</Label>
          <Input
            id="websiteUrl"
            placeholder="https://..."
            value={data.websiteUrl}
            onChange={(e) => handleChange('websiteUrl', e.target.value)}
          />
          {errors.websiteUrl && (
            <p className="text-sm text-destructive">{errors.websiteUrl}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="twitterUrl">Twitter URL</Label>
          <Input
            id="twitterUrl"
            placeholder="https://twitter.com/..."
            value={data.twitterUrl}
            onChange={(e) => handleChange('twitterUrl', e.target.value)}
          />
          {errors.twitterUrl && (
            <p className="text-sm text-destructive">{errors.twitterUrl}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="telegramUrl">Telegram URL</Label>
        <Input
          id="telegramUrl"
          placeholder="https://t.me/..."
          value={data.telegramUrl}
          onChange={(e) => handleChange('telegramUrl', e.target.value)}
        />
        {errors.telegramUrl && (
          <p className="text-sm text-destructive">{errors.telegramUrl}</p>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleNext}>
          Next
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
