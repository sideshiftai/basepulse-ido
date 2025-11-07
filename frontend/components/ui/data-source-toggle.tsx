"use client";

import { useDataSource, type DataSource } from '@/lib/contexts/data-source-context';
import { Database, Link2 } from 'lucide-react';

export function DataSourceToggle() {
  const { dataSource, setDataSource } = useDataSource();

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-1">
      <button
        onClick={() => setDataSource('subgraph')}
        className={`
          flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all
          ${dataSource === 'subgraph'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
          }
        `}
        title="Use subgraph for fast, indexed data"
      >
        <Database className="h-4 w-4" />
        <span className="hidden sm:inline">Subgraph</span>
      </button>

      <button
        onClick={() => setDataSource('contracts')}
        className={`
          flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all
          ${dataSource === 'contracts'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
          }
        `}
        title="Query contracts directly for real-time data"
      >
        <Link2 className="h-4 w-4" />
        <span className="hidden sm:inline">Contracts</span>
      </button>
    </div>
  );
}

/**
 * Compact indicator badge showing current data source
 */
export function DataSourceBadge() {
  const { dataSource, isSubgraph } = useDataSource();

  return (
    <div className={`
      inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium
      ${isSubgraph
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
        : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400'
      }
    `}>
      {isSubgraph ? (
        <>
          <Database className="h-3 w-3" />
          <span>Indexed</span>
        </>
      ) : (
        <>
          <Link2 className="h-3 w-3" />
          <span>Live</span>
        </>
      )}
    </div>
  );
}
