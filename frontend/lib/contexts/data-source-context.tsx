"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export type DataSource = 'subgraph' | 'contracts';

interface DataSourceContextType {
  dataSource: DataSource;
  setDataSource: (source: DataSource) => void;
  isSubgraph: boolean;
  isContracts: boolean;
}

const DataSourceContext = createContext<DataSourceContextType | undefined>(undefined);

const STORAGE_KEY = 'pulsar-data-source';

export function DataSourceProvider({ children }: { children: React.ReactNode }) {
  const [dataSource, setDataSourceState] = useState<DataSource>('subgraph');
  const [mounted, setMounted] = useState(false);

  // Load preference from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY) as DataSource | null;
    if (stored === 'subgraph' || stored === 'contracts') {
      setDataSourceState(stored);
    }
  }, []);

  const setDataSource = (source: DataSource) => {
    setDataSourceState(source);
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, source);
    }
  };

  const value: DataSourceContextType = {
    dataSource,
    setDataSource,
    isSubgraph: dataSource === 'subgraph',
    isContracts: dataSource === 'contracts',
  };

  return (
    <DataSourceContext.Provider value={value}>
      {children}
    </DataSourceContext.Provider>
  );
}

export function useDataSource() {
  const context = useContext(DataSourceContext);
  if (context === undefined) {
    throw new Error('useDataSource must be used within a DataSourceProvider');
  }
  return context;
}

/**
 * Component to display data source info/benefits
 */
export function DataSourceInfo() {
  const { dataSource } = useDataSource();

  const info = {
    subgraph: {
      name: 'Subgraph (Indexed)',
      benefits: [
        '⚡ Faster queries',
        '📊 Historical data',
        '🔍 Advanced filtering',
        '📈 Aggregated stats',
      ],
      tradeoffs: [
        '⏱️ ~1 min indexing delay',
      ],
    },
    contracts: {
      name: 'Direct Contracts (RPC)',
      benefits: [
        '✅ Real-time data',
        '🔒 Source of truth',
        '🎯 Always up-to-date',
      ],
      tradeoffs: [
        '🐌 Slower queries',
        '💰 More RPC calls',
        '❌ Limited filtering',
      ],
    },
  };

  const current = info[dataSource];

  return (
    <div className="rounded-lg border bg-card p-4 space-y-2">
      <h3 className="font-semibold text-sm">
        Current: {current.name}
      </h3>
      <div className="text-xs space-y-1">
        <p className="font-medium text-muted-foreground">Benefits:</p>
        <ul className="space-y-0.5">
          {current.benefits.map((benefit, i) => (
            <li key={i} className="text-muted-foreground">{benefit}</li>
          ))}
        </ul>
        {current.tradeoffs.length > 0 && (
          <>
            <p className="font-medium text-muted-foreground mt-2">Trade-offs:</p>
            <ul className="space-y-0.5">
              {current.tradeoffs.map((tradeoff, i) => (
                <li key={i} className="text-muted-foreground">{tradeoff}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
