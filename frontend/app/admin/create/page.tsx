'use client';

import { useState } from 'react';
import { WizardSteps, WizardStep } from '@/components/admin/wizard-steps';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SaleMetadataStep } from '@/components/admin/steps/metadata-step';
import { SaleParametersStep } from '@/components/admin/steps/parameters-step';
import { TierConfigurationStep } from '@/components/admin/steps/tier-configuration-step';
import { VestingSetupStep } from '@/components/admin/steps/vesting-setup-step';
import { WhitelistStep } from '@/components/admin/steps/whitelist-step';
import { ReviewDeployStep } from '@/components/admin/steps/review-deploy-step';

// Form data types
export interface SaleMetadata {
  name: string;
  symbol: string;
  description: string;
  logoUrl: string;
  websiteUrl: string;
  twitterUrl: string;
  telegramUrl: string;
  saleToken: string;
}

export interface SaleParameters {
  startTime: Date;
  endTime: Date;
  tokenPrice: string;
  hardCap: string;
  softCap: string;
  minContribution: string;
  maxGasPrice: string;
}

export interface TierConfig {
  enabled: boolean;
  startTime: Date;
  endTime: Date;
  tokenPrice: string;
  maxAllocation: string;
  totalAllocation: string;
}

export interface TiersConfiguration {
  seed: TierConfig;
  private: TierConfig;
  public: TierConfig;
}

export interface VestingConfig {
  tgePercent: number;
  cliffDuration: number;
  vestingDuration: number;
}

export interface WhitelistConfig {
  enabled: boolean;
  merkleRoot?: string;
  addresses?: string[];
}

export interface SaleFormData {
  metadata: SaleMetadata;
  parameters: SaleParameters;
  tiers: TiersConfiguration;
  vesting: VestingConfig;
  whitelist: WhitelistConfig;
}

const wizardSteps: WizardStep[] = [
  {
    id: 1,
    title: 'Metadata',
    description: 'Basic information',
  },
  {
    id: 2,
    title: 'Parameters',
    description: 'Sale configuration',
  },
  {
    id: 3,
    title: 'Tiers',
    description: 'Configure tiers',
  },
  {
    id: 4,
    title: 'Vesting',
    description: 'Token unlock schedule',
  },
  {
    id: 5,
    title: 'Whitelist',
    description: 'Optional whitelist',
  },
  {
    id: 6,
    title: 'Review',
    description: 'Deploy sale',
  },
];

const initialFormData: SaleFormData = {
  metadata: {
    name: '',
    symbol: '',
    description: '',
    logoUrl: '',
    websiteUrl: '',
    twitterUrl: '',
    telegramUrl: '',
    saleToken: '',
  },
  parameters: {
    startTime: new Date(),
    endTime: new Date(),
    tokenPrice: '',
    hardCap: '',
    softCap: '',
    minContribution: '',
    maxGasPrice: '1000',
  },
  tiers: {
    seed: {
      enabled: false,
      startTime: new Date(),
      endTime: new Date(),
      tokenPrice: '',
      maxAllocation: '',
      totalAllocation: '',
    },
    private: {
      enabled: false,
      startTime: new Date(),
      endTime: new Date(),
      tokenPrice: '',
      maxAllocation: '',
      totalAllocation: '',
    },
    public: {
      enabled: true,
      startTime: new Date(),
      endTime: new Date(),
      tokenPrice: '',
      maxAllocation: '',
      totalAllocation: '',
    },
  },
  vesting: {
    tgePercent: 20,
    cliffDuration: 0,
    vestingDuration: 180,
  },
  whitelist: {
    enabled: false,
    addresses: [],
  },
};

export default function CreateSalePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<SaleFormData>(initialFormData);

  const updateFormData = (section: keyof SaleFormData, data: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: data,
    }));
  };

  const handleNext = () => {
    if (currentStep < wizardSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <SaleMetadataStep
            data={formData.metadata}
            onChange={(data) => updateFormData('metadata', data)}
            onNext={handleNext}
          />
        );
      case 1:
        return (
          <SaleParametersStep
            data={formData.parameters}
            onChange={(data) => updateFormData('parameters', data)}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 2:
        return (
          <TierConfigurationStep
            data={formData.tiers}
            onChange={(data) => updateFormData('tiers', data)}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <VestingSetupStep
            data={formData.vesting}
            onChange={(data) => updateFormData('vesting', data)}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <WhitelistStep
            data={formData.whitelist}
            onChange={(data) => updateFormData('whitelist', data)}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 5:
        return (
          <ReviewDeployStep
            formData={formData}
            onBack={handleBack}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Sale</h1>
        <p className="text-muted-foreground mt-2">
          Follow the steps below to create and deploy a new token sale
        </p>
      </div>

      <WizardSteps steps={wizardSteps} currentStep={currentStep} />

      <Card>
        <CardHeader>
          <CardTitle>{wizardSteps[currentStep].title}</CardTitle>
          <CardDescription>
            {wizardSteps[currentStep].description}
          </CardDescription>
        </CardHeader>
        <CardContent>{renderStep()}</CardContent>
      </Card>
    </div>
  );
}
