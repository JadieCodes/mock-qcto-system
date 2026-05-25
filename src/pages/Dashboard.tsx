import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useAuditTrail } from '@/context/AuditTrailContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DashboardReportBuilder } from '@/components/ui/DashboardReportBuilder';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Package,
  CheckCircle,
  Clock,
  RefreshCw,
  Replace,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Printer,
  Download,
  Eye,
  TrendingUp,
  Users,
  Layers,
  Archive,
  Receipt,
  Network,
  ClipboardList
} from 'lucide-react';
import type { ProcessType, Pathway, SubmissionStatus, BatchStatus } from '@/types';

export default function Dashboard() {
  const { profileSubmissions, batches, printJobs, currentRole, sdpInvoices } = useApp();
  const { entries: auditEntries } = useAuditTrail();
  
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [processTypeFilter, setProcessTypeFilter] = useState<ProcessType | 'all'>('all');
  const [pathwayFilter, setPathwayFilter] = useState<Pathway | 'all'>('all');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('week');

  // Filter submissions based on role and filters
  const filteredSubmissions = useMemo(() => {
    return profileSubmissions.filter(sub => {
      // Role-based filtering
      if (currentRole === 'Assessment Unit' && sub.processType !== 'issue') return false;
      if (currentRole === 'NAMB' && (sub.processType !== 'reissue' || sub.pathway !== 'legacy')) return false;
      if (currentRole === 'QP' && (sub.processType !== 'reissue' || !['occupational', 'skills'].includes(sub.pathway || ''))) return false;
      if (currentRole === 'SDP' && (sub.processType !== 'reissue' || !['occupational', 'skills'].includes(sub.pathway || ''))) return false;
      
      // Process type filter
      if (processTypeFilter !== 'all' && sub.processType !== processTypeFilter) return false;
      
      // Pathway filter
      if (pathwayFilter !== 'all' && sub.pathway !== pathwayFilter) return false;
      
      return true;
    });
  }, [profileSubmissions, processTypeFilter, pathwayFilter, currentRole]);

  // Filter batches
  const filteredBatches = useMemo(() => {
    return batches.filter(batch => {
      if (processTypeFilter !== 'all') {
        if (processTypeFilter === 'issue' && (batch.isReissue || batch.isReplace)) return false;
        if (processTypeFilter === 'reissue' && !batch.isReissue) return false;
        if (processTypeFilter === 'replace' && !batch.isReplace) return false;
      }
      if (pathwayFilter !== 'all' && batch.pathway !== pathwayFilter) return false;
      return true;
    });
  }, [batches, processTypeFilter, pathwayFilter]);

  // Filter print jobs
  const filteredPrintJobs = useMemo(() => {
    return printJobs.filter(job => {
      const batch = batches.find(b => b.batchUuid === job.batchId);
      if (!batch) return false;
      
      if (processTypeFilter !== 'all') {
        if (processTypeFilter === 'issue' && (batch.isReissue || batch.isReplace)) return false;
        if (processTypeFilter === 'reissue' && !batch.isReissue) return false;
        if (processTypeFilter === 'replace' && !batch.isReplace) return false;
      }
      if (pathwayFilter !== 'all' && batch.pathway !== pathwayFilter) return false;
      return true;
    });
  }, [printJobs, batches, processTypeFilter, pathwayFilter]);

  // Calculate comprehensive stats
  const stats = {
    // Submissions by status
    submissions: {
      total: filteredSubmissions.length,
      draft: filteredSubmissions.filter(s => s.status === 'draft').length,
      submitted: filteredSubmissions.filter(s => s.status === 'submitted').length,
      approved: filteredSubmissions.filter(s => s.status === 'approved').length,
      pendingCorrection: filteredSubmissions.filter(s => s.status === 'pending_correction').length,
      integrated: filteredSubmissions.filter(s => s.status === 'integrated').length,
      completed: filteredSubmissions.filter(s => s.status === 'completed').length,
    },
    
    // Process type counts
    processTypes: {
      issue: profileSubmissions.filter(s => s.processType === 'issue').length,
      reissue: profileSubmissions.filter(s => s.processType === 'reissue').length,
      replace: profileSubmissions.filter(s => s.processType === 'replace').length,
    },
    
    // Pathway distribution
    pathways: {
      occupational: profileSubmissions.filter(s => s.pathway === 'occupational').length,
      skills: profileSubmissions.filter(s => s.pathway === 'skills').length,
      legacy: profileSubmissions.filter(s => s.pathway === 'legacy').length,
    },
    
    // Batches by status
    batches: {
      total: filteredBatches.length,
      integrated: filteredBatches.filter(b => b.status === 'integrated').length,
      printing: filteredBatches.filter(b => b.status === 'printing').length,
      qcPassed: filteredBatches.filter(b => b.status === 'qc_passed').length,
      qcFailed: filteredBatches.filter(b => b.status === 'qc_failed').length,
      packaged: filteredBatches.filter(b => b.status === 'packaged').length,
      collected: filteredBatches.filter(b => b.status === 'collected').length,
    },
    
    // Print jobs
    printJobs: {
      total: filteredPrintJobs.length,
      pending: filteredPrintJobs.filter(j => {
        const batch = batches.find(b => b.batchUuid === j.batchId);
        return batch?.status === 'printing';
      }).length,
      completed: filteredPrintJobs.filter(j => {
        const batch = batches.find(b => b.batchUuid === j.batchId);
        return batch?.status === 'collected';
      }).length,
    },
    
    // Paper inventory (simulated from batches)
    paperInventory: {
      total: 10000,
      allocated: filteredBatches.reduce((acc, batch) => 
        acc + (batch.paperAllocation?.quantity || 0), 0),
      printed: filteredBatches.filter(b => b.status === 'collected')
        .reduce((acc, batch) => acc + (batch.paperAllocation?.quantity || 0), 0),
    },
    
    // SDP Invoices
    invoices: {
      pending: sdpInvoices.filter(i => i.status === 'Pending').length,
      sent: sdpInvoices.filter(i => i.status === 'Sent').length,
      total: sdpInvoices.length,
    },

    // Integration queue
    integrationQueue: {
      awaitingIntegration: profileSubmissions.filter(s => s.status === 'approved').length,
      integrated: profileSubmissions.filter(s => s.status === 'integrated').length,
      failed: profileSubmissions.filter(s =>
        s.assessmentData?.integrationStatus === 'failed'
      ).length,
    },

    // Corrections tracking
    corrections: {
      active: profileSubmissions.filter(s => 
        s.status === 'pending_correction' && 
        s.assessmentData?.correctionRecord?.currentStatus === 'active'
      ).length,
      pendingReview: profileSubmissions.filter(s => 
        s.assessmentData?.correctionRecord?.currentStatus === 'pending_review'
      ).length,
      resolved: profileSubmissions.filter(s => 
        s.assessmentData?.correctionRecord?.currentStatus === 'resolved'
      ).length,
    },
  };

  const getProcessLabel = (type: ProcessType) => {
    switch (type) {
      case 'issue': return 'Issue';
      case 'reissue': return 'Re-Issue';
      case 'replace': return 'Replace';
    }
  };

  const getProcessBadgeVariant = (type: ProcessType) => {
    switch (type) {
      case 'issue': return 'default';
      case 'reissue': return 'secondary';
      case 'replace': return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: SubmissionStatus | BatchStatus) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'submitted': return 'default';
      case 'approved': return 'default';
      case 'pending_correction': return 'destructive';
      case 'integrated': return 'default';
      case 'in_batch': return 'default';
      case 'completed': return 'outline';
      case 'registered': return 'secondary';
      case 'printing': return 'default';
      case 'qc_passed': return 'default';
      case 'qc_failed': return 'destructive';
      case 'packaged': return 'outline';
      case 'collected': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Role Badge */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <Badge variant="outline" className="text-sm px-3 py-1">
              Logged in as: <span className="font-semibold ml-1">{currentRole}</span>
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Complete overview of certificate processing system
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowReportBuilder(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Create Report
          </Button>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
            <SelectTrigger className="w-[140px] bg-card">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={processTypeFilter} onValueChange={(v) => setProcessTypeFilter(v as ProcessType | 'all')}>
            <SelectTrigger className="w-[160px] bg-card">
              <SelectValue placeholder="Process Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="issue">CERT-01: Issue</SelectItem>
              <SelectItem value="reissue">CERT-02: Re-Issue</SelectItem>
              <SelectItem value="replace">CERT-03: Replace</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={pathwayFilter} onValueChange={(v) => setPathwayFilter(v as Pathway | 'all')}>
            <SelectTrigger className="w-[160px] bg-card">
              <SelectValue placeholder="Pathway" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pathways</SelectItem>
              <SelectItem value="occupational">Occupational</SelectItem>
              <SelectItem value="skills">Skills</SelectItem>
              <SelectItem value="legacy">Legacy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Process Type Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">CERT-01: Issue</p>
                  <p className="text-3xl font-bold">{stats.processTypes.issue}</p>
                </div>
              </div>
              <Badge variant="default">New</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-secondary/20 border-secondary/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-8 w-8 text-secondary-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">CERT-02: Re-Issue</p>
                  <p className="text-3xl font-bold">{stats.processTypes.reissue}</p>
                </div>
              </div>
              <Badge variant="secondary">Corrections</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-accent/20 border-accent/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Replace className="h-8 w-8 text-accent-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">CERT-03: Replace</p>
                  <p className="text-3xl font-bold">{stats.processTypes.replace}</p>
                </div>
              </div>
              <Badge variant="outline">Void Original</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.submissions.total}</div>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> Draft: {stats.submissions.draft}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Approved: {stats.submissions.approved}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.batches.printing + stats.batches.qcPassed}</div>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Printer className="h-3 w-3" /> Printing: {stats.batches.printing}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> QC Passed: {stats.batches.qcPassed}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className={stats.corrections.active > 0 ? 'border-amber-200 bg-amber-50/40' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Corrections</CardTitle>
            <AlertCircle className={`h-4 w-4 ${stats.corrections.active > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.corrections.active > 0 ? 'text-amber-700' : ''}`}>
              {stats.corrections.active}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span>Under Review: {stats.corrections.pendingReview}</span>
              <span>Resolved: {stats.corrections.resolved}</span>
            </div>
          </CardContent>
        </Card>

        <Card className={stats.integrationQueue.awaitingIntegration > 0 ? 'border-blue-200 bg-blue-50/40' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Integration Queue</CardTitle>
            <Network className={`h-4 w-4 ${stats.integrationQueue.awaitingIntegration > 0 ? 'text-blue-500' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.integrationQueue.awaitingIntegration > 0 ? 'text-blue-700' : ''}`}>
              {stats.integrationQueue.awaitingIntegration}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span>Integrated: {stats.integrationQueue.integrated}</span>
              {stats.integrationQueue.failed > 0 && (
                <Badge variant="destructive" className="text-xs h-4 px-1">
                  {stats.integrationQueue.failed} failed
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={stats.invoices.pending > 0 ? 'border-orange-200 bg-orange-50/40' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <Receipt className={`h-4 w-4 ${stats.invoices.pending > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.invoices.pending > 0 ? 'text-orange-700' : ''}`}>
              {stats.invoices.pending}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span>Sent: {stats.invoices.sent}</span>
              <span>Total: {stats.invoices.total}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.batches.collected}</div>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span>Collected Batches</span>
              <Badge variant="outline" className="text-xs">
                {stats.printJobs.completed} Print Jobs
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pathway Distribution & Paper Inventory */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Pathway Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Occupational</span>
                  <span className="text-muted-foreground">{stats.pathways.occupational} submissions</span>
                </div>
                <Progress value={(stats.pathways.occupational / (stats.submissions.total || 1)) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Skills</span>
                  <span className="text-muted-foreground">{stats.pathways.skills} submissions</span>
                </div>
                <Progress value={(stats.pathways.skills / (stats.submissions.total || 1)) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Legacy</span>
                  <span className="text-muted-foreground">{stats.pathways.legacy} submissions</span>
                </div>
                <Progress value={(stats.pathways.legacy / (stats.submissions.total || 1)) * 100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Paper Inventory Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Stock</span>
                <span className="text-2xl font-bold">{stats.paperInventory.total.toLocaleString()}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Allocated to Batches</span>
                  <span className="font-medium">{stats.paperInventory.allocated.toLocaleString()}</span>
                </div>
                <Progress 
                  value={(stats.paperInventory.allocated / stats.paperInventory.total) * 100} 
                  className="h-2" 
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Successfully Printed</span>
                  <span className="font-medium text-green-600">{stats.paperInventory.printed.toLocaleString()}</span>
                </div>
                <Progress 
                  value={(stats.paperInventory.printed / stats.paperInventory.total) * 100} 
                  className="h-2 [&>div]:bg-green-600" 
                />
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="font-medium">Remaining Stock</span>
                <span className="font-bold text-blue-600">
                  {(stats.paperInventory.total - stats.paperInventory.allocated).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity + SDP Invoices */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4" />
              Recent Activity
            </CardTitle>
            <Link
              to="/departments/certification/audit-trail"
              className="text-xs text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {auditEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No recent activity yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {auditEntries.slice(0, 7).map(entry => (
                  <div key={entry.id} className="flex items-start gap-3 text-sm">
                    <div className="mt-0.5 shrink-0">
                      {entry.status === 'Success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {entry.status === 'Failed' && <XCircle className="h-4 w-4 text-red-500" />}
                      {entry.status === 'Pending' && <Clock className="h-4 w-4 text-amber-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="secondary" className="text-xs h-4 px-1.5">{entry.module}</Badge>
                        <span className="text-xs text-muted-foreground truncate">{entry.action}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {entry.user} · {new Date(entry.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SDP Invoices Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4" />
              SDP Invoices
            </CardTitle>
            <Link
              to="/departments/certification/tariff-invoicing"
              className="text-xs text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {sdpInvoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No SDP invoices yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sdpInvoices.slice(0, 5).map(inv => (
                  <div key={inv.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{inv.sdpName}</p>
                      <p className="text-xs text-muted-foreground">
                        {inv.processType} · {new Date(inv.submissionDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={inv.status === 'Sent' ? 'outline' : 'default'}
                      className={`shrink-0 ml-2 ${inv.status === 'Pending' ? 'bg-orange-100 text-orange-700 border-orange-200' : ''}`}
                    >
                      {inv.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables Tabs */}
      <Tabs defaultValue="submissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="submissions">Recent Submissions</TabsTrigger>
          <TabsTrigger value="batches">Active Batches</TabsTrigger>
          <TabsTrigger value="printjobs">Print Jobs</TabsTrigger>
          <TabsTrigger value="corrections">Active Corrections</TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredSubmissions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No submissions yet</p>
              ) : (
                <div className="space-y-3">
                  {filteredSubmissions.slice(-5).reverse().map((sub) => (
                    <div key={sub.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-accent/50">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={getProcessBadgeVariant(sub.processType)} className="text-xs">
                            {getProcessLabel(sub.processType)}
                          </Badge>
                          {sub.pathway && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {sub.pathway}
                            </Badge>
                          )}
                          <span className="text-xs font-mono text-muted-foreground">{sub.id}</span>
                        </div>
                        <p className="text-sm font-medium">{sub.candidateName}</p>
                        <p className="text-xs text-muted-foreground">{sub.certificateType}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={getStatusBadgeVariant(sub.status)}>
                          {sub.status === 'pending_correction' ? 'Returned' : 
                           sub.status === 'approved' ? 'Approved' :
                           sub.status === 'integrated' ? 'Integrated' :
                           sub.status.replace('_', ' ')}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(sub.dateSubmitted).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Batches</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredBatches.filter(b => !['collected', 'qc_failed'].includes(b.status)).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No active batches</p>
              ) : (
                <div className="space-y-3">
                  {filteredBatches
                    .filter(b => !['collected', 'qc_failed'].includes(b.status))
                    .slice(-5)
                    .map((batch) => (
                      <div key={batch.batchUuid} className="flex justify-between items-center p-3 border rounded-lg hover:bg-accent/50">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={batch.isReplace ? 'outline' : batch.isReissue ? 'secondary' : 'default'} className="text-xs">
                              {batch.isReplace ? 'Replace' : batch.isReissue ? 'Re-Issue' : 'Issue'}
                            </Badge>
                            {batch.pathway && (
                              <Badge variant="outline" className="text-xs capitalize">
                                {batch.pathway}
                              </Badge>
                            )}
                            <span className="text-xs font-mono text-muted-foreground">{batch.batchUuid}</span>
                          </div>
                          <p className="text-sm font-medium">{batch.batchName}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{batch.totalCertificates} certificates</span>
                            {batch.paperAllocation && (
                              <span>Paper: {batch.paperAllocation.paperStartNumber}-{batch.paperAllocation.paperEndNumber}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={getStatusBadgeVariant(batch.status)}>
                            {batch.status === 'integrated' ? 'Ready for Printing' :
                             batch.status === 'printing' ? '🖨️ Printing' :
                             batch.status.replace('_', ' ')}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(batch.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="printjobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Print Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredPrintJobs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No print jobs yet</p>
              ) : (
                <div className="space-y-3">
                  {filteredPrintJobs.slice(-5).reverse().map((job) => {
                    const batch = batches.find(b => b.batchUuid === job.batchId);
                    if (!batch) return null;
                    
                    return (
                      <div key={job.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-accent/50">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Printer className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-mono text-muted-foreground">{job.id}</span>
                            <Badge variant="outline" className="text-xs">
                              {batch.batchName}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Paper: {job.paperStockAllocated} sheets • {new Date(job.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={batch.status === 'collected' ? 'outline' : 'default'}>
                          {batch.status === 'collected' ? 'Completed' : 'In Progress'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="corrections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Corrections</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.corrections.active === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No active corrections</p>
              ) : (
                <div className="space-y-3">
                  {profileSubmissions
                    .filter(s => s.status === 'pending_correction' && 
                               s.assessmentData?.correctionRecord?.currentStatus === 'active')
                    .slice(-5)
                    .map((sub) => (
                      <div key={sub.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-accent/50">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                            <Badge variant={getProcessBadgeVariant(sub.processType)} className="text-xs">
                              {getProcessLabel(sub.processType)}
                            </Badge>
                            <span className="text-xs font-mono text-muted-foreground">{sub.id}</span>
                          </div>
                          <p className="text-sm font-medium">{sub.candidateName}</p>
                          <p className="text-xs text-muted-foreground">
                            Return Reason: {sub.assessmentData?.returnReason?.substring(0, 50)}...
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="destructive">Returned</Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            v{sub.assessmentData?.correctionRecord?.version || 1}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showReportBuilder && (
        <DashboardReportBuilder
          stats={stats}
          sdpInvoices={sdpInvoices}
          auditEntries={auditEntries}
          currentRole={currentRole}
          onClose={() => setShowReportBuilder(false)}
        />
      )}

      {/* System Health Summary */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Integration Health</p>
                <p className="text-xs text-muted-foreground">
                  {stats.submissions.integrated} submissions integrated
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Batch Efficiency</p>
                <p className="text-xs text-muted-foreground">
                  {stats.batches.collected} of {stats.batches.total} batches collected
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Correction Rate</p>
                <p className="text-xs text-muted-foreground">
                  {((stats.corrections.resolved / (stats.submissions.total || 1)) * 100).toFixed(1)}% resolved
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}