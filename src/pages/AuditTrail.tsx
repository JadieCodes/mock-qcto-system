import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, Search } from 'lucide-react';
import { useAuditTrail } from '@/context/AuditTrailContext';

const MODULE_OPTIONS = [
  'All',
  'Intake',
  'Integrations',
  'Corrections',
  'Batches',
  'Printing',
  'Tariff & Invoicing',
];

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Success: 'default',
  Failed: 'destructive',
  Pending: 'secondary',
};

export default function AuditTrail() {
  const { entries } = useAuditTrail();
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return entries.filter(e => {
      const matchesModule = moduleFilter === 'All' || e.module === moduleFilter;
      const matchesSearch = !q || e.action.toLowerCase().includes(q) || e.module.toLowerCase().includes(q) || e.user.toLowerCase().includes(q);
      return matchesModule && matchesSearch;
    });
  }, [entries, search, moduleFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Audit Trail</h2>
        <p className="text-muted-foreground">System-wide log of all actions taken across certification modules</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>All logged actions are stored locally and ordered newest first</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by module, action, or user..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODULE_OPTIONS.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No audit entries yet</p>
              <p className="text-sm mt-1">Actions taken across the system will appear here.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono text-xs">{entry.id}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium">{entry.user}</TableCell>
                    <TableCell>{entry.module}</TableCell>
                    <TableCell>{entry.action}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[entry.status] ?? 'secondary'}>
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {entry.details ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
