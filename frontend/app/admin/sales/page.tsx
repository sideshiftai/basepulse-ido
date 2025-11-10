'use client';

import { useAllSales, useSaleConfig } from '@/lib/contracts/hooks/use-factory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLink, Search, Settings } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { NETWORK } from '@/lib/contracts/config';
import { Address } from 'viem';

export default function AllSalesPage() {
  const { sales, isLoading } = useAllSales();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSales = sales?.filter((sale) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      sale.saleAddress.toLowerCase().includes(query) ||
      sale.saleId.toString().includes(query) ||
      sale.creator.toLowerCase().includes(query)
    );
  });

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Sales</h1>
          <p className="text-muted-foreground mt-2">
            Manage all your token sales
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/create">Create New Sale</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by sale ID, address, or creator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading sales...
            </div>
          ) : filteredSales && filteredSales.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sale ID</TableHead>
                    <TableHead>Sale Address</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <SaleRow key={sale.saleId.toString()} sale={sale} />
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? 'No sales found matching your search.' : 'No sales created yet.'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SaleRow({ sale }: { sale: any }) {
  const { config } = useSaleConfig(sale.saleAddress as Address);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  const getStatus = () => {
    if (!config) return <Badge variant="secondary">Loading...</Badge>;

    const now = BigInt(Math.floor(Date.now() / 1000));

    if (config.isFinalized) {
      return <Badge variant="secondary">Finalized</Badge>;
    }
    if (config.isPaused) {
      return <Badge variant="destructive">Paused</Badge>;
    }
    if (now < config.startTime) {
      return <Badge variant="outline">Upcoming</Badge>;
    }
    if (now >= config.startTime && now <= config.endTime) {
      return <Badge>Active</Badge>;
    }
    if (now > config.endTime) {
      return <Badge variant="secondary">Ended</Badge>;
    }

    return <Badge variant="secondary">Unknown</Badge>;
  };

  return (
    <TableRow>
      <TableCell className="font-medium">#{sale.saleId.toString()}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm">{formatAddress(sale.saleAddress)}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            asChild
          >
            <a
              href={`${NETWORK.blockExplorer}/address/${sale.saleAddress}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </TableCell>
      <TableCell className="font-mono text-sm">{formatAddress(sale.creator)}</TableCell>
      <TableCell>{formatDate(sale.createdAt)}</TableCell>
      <TableCell>{getStatus()}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/sales/${sale.saleId}`}>
              <Settings className="h-3 w-3 mr-1" />
              Manage
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/ido/${sale.saleId}`}>
              View
            </Link>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
