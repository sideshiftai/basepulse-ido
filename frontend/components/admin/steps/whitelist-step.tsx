'use client';

import { useState } from 'react';
import { WhitelistConfig } from '@/app/admin/create/page';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, ChevronRight, Upload, FileText, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { generateMerkleRoot } from '@/lib/utils/merkle';

interface WhitelistStepProps {
  data: WhitelistConfig;
  onChange: (data: WhitelistConfig) => void;
  onNext: () => void;
  onBack: () => void;
}

export function WhitelistStep({ data, onChange, onNext, onBack }: WhitelistStepProps) {
  const [addressInput, setAddressInput] = useState('');
  const [error, setError] = useState('');

  const handleEnableChange = (enabled: boolean) => {
    onChange({ ...data, enabled });
    setError('');
  };

  const parseAddresses = (input: string): string[] => {
    // Split by newlines, commas, or spaces and filter empty strings
    return input
      .split(/[\n,\s]+/)
      .map((addr) => addr.trim())
      .filter((addr) => addr.length > 0);
  };

  const validateAddresses = (addresses: string[]): boolean => {
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    return addresses.every((addr) => addressRegex.test(addr));
  };

  const handleAddressInputChange = (input: string) => {
    setAddressInput(input);
    setError('');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setAddressInput(content);
      setError('');
    };
    reader.readAsText(file);
  };

  const handleGenerateMerkleRoot = () => {
    const addresses = parseAddresses(addressInput);

    if (addresses.length === 0) {
      setError('Please enter at least one address');
      return;
    }

    if (!validateAddresses(addresses)) {
      setError('Invalid address format. Please check your addresses.');
      return;
    }

    try {
      const merkleRoot = generateMerkleRoot(addresses);
      onChange({
        ...data,
        addresses,
        merkleRoot,
      });
      setError('');
    } catch (err) {
      setError('Failed to generate merkle root. Please try again.');
    }
  };

  const handleNext = () => {
    if (data.enabled && !data.merkleRoot) {
      setError('Please generate merkle root before proceeding');
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Whitelist Configuration</CardTitle>
              <CardDescription>
                Optional: Restrict sale participation to whitelisted addresses
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="whitelist-enabled"
                checked={data.enabled}
                onCheckedChange={handleEnableChange}
              />
              <Label htmlFor="whitelist-enabled" className="cursor-pointer">
                Enable Whitelist
              </Label>
            </div>
          </div>
        </CardHeader>

        {data.enabled && (
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="addresses">Whitelist Addresses</Label>
              <Textarea
                id="addresses"
                placeholder="Enter addresses (one per line, or comma-separated)&#10;0x742d35Cc6634C0532925a3b844Bc454e4438f44e&#10;0x123..."
                rows={8}
                value={addressInput}
                onChange={(e) => handleAddressInputChange(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload CSV/TXT
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <span className="text-xs text-muted-foreground">
                  {addressInput ? `${parseAddresses(addressInput).length} addresses` : 'No addresses'}
                </span>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleGenerateMerkleRoot}
              variant="secondary"
              className="w-full"
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Merkle Root
            </Button>

            {data.merkleRoot && (
              <div className="space-y-2">
                <Label>Generated Merkle Root</Label>
                <div className="p-3 bg-muted rounded-lg font-mono text-sm break-all">
                  {data.merkleRoot}
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Merkle root generated successfully for {data.addresses?.length} addresses.
                    This will be set on-chain in the final deployment step.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {!data.enabled && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Whitelist is disabled. The sale will be open to all participants without restrictions.
          </AlertDescription>
        </Alert>
      )}

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
