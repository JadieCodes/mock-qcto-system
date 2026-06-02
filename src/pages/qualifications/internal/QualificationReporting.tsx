import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Plus,
  Search,
  Eye,
  Download,
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  Layers,
  FileCheck,
} from 'lucide-react';
import { QualificationReportBuilder } from './QualificationReportBuilder';
import type { SavedReport } from '@/types';

// Mock data for demonstration - replace with your actual data source
const mockQualifications = [
  {
    id: 'QUAL-001',
    title: 'National Certificate: Early Childhood Development',
    nqfLevel: 4,
    credits: 120,
    status: 'approved',
    phase: 'Approval',
    submittedDate: '2025-01-15',
    approvedDate: '2025-03-20',
    publicInputReceived: 24,
    publicInputResolved: 22,
  },
  {
    id: 'QUAL-002',
    title: 'Further Education and Training Certificate: Business Administration',
    nqfLevel: 4,
    credits: 130,
    status: 'public_input',
    phase: 'Public Input',
    submittedDate: '2025-02-10',
    publicInputReceived: 8,
    publicInputResolved: 3,
  },
  {
    id: 'QUAL-003',
    title: 'Occupational Certificate: Electrician',
    nqfLevel: 5,
    credits: 280,
    status: 'development',
    phase: 'Development',
    submittedDate: '2025-03-01',
  },
  {
    id: 'QUAL-004',
    title: 'National Certificate: Information Technology',
    nqfLevel: 5,
    credits: 150,
    status: 'draft',
    phase: 'Design',
    submittedDate: '2025-03-10',
  },
];

const mockLearnerships = [
  {
    id: 'LEARN-001',
    title: 'Early Childhood Development Learnership',
    nqfLevel: 4,
    credits: 130,
    status: 'approved',
    phase: 'Approval',
    submittedDate: '2025-01-20',
    approvedDate: '2025-03-15',
    publicInputReceived: 18,
    publicInputResolved: 18,
  },
  {
    id: 'LEARN-002',
    title: 'Business Administration Learnership',
    nqfLevel: 3,
    credits: 120,
    status: 'public_input',
    phase: 'Public Input',
    submittedDate: '2025-02-25',
    publicInputReceived: 12,
    publicInputResolved: 7,
  },
];

const mockSavedReports: SavedReport[] = [
  {
    id: 'RPT-001',
    name: 'Q1 2025 Qualifications Status Report',
    description: 'Overview of all qualifications in development pipeline',
    createdAt: '2025-03-31T10:30:00',
    createdBy: 'John Smith',
    sections: ['submissionOverview', 'phaseProgress', 'publicInputSummary'],
    filters: { timeRange: 'month', type: 'qualification', status: 'all' },
    reportData: {
      stats: {
        totalQualifications: 4,
        totalLearnerships: 2,
        activeDevelopment: 2,
        pendingApproval: 3,
        approvedQualifications: 1,
        approvedLearnerships: 1,
        pendingCorrections: 1,
        avgApprovalTime: '45 days',
      },
      phaseProgress: [
        { phase: 'Design', qualifications: 1, learnerships: 0, total: 1 },
        { phase: 'Development', qualifications: 1, learnerships: 0, total: 1 },
        { phase: 'Public Input', qualifications: 1, learnerships: 1, total: 2 },
        { phase: 'Approval', qualifications: 1, learnerships: 1, total: 2 },
      ],
      publicInputItems: [
        { itemId: 'QUAL-002', title: 'Further Education and Training Certificate: Business Administration', type: 'Qualification', received: 8, resolved: 3, status: 'Partial' },
        { itemId: 'LEARN-002', title: 'Business Administration Learnership', type: 'Learnership', received: 12, resolved: 7, status: 'Partial' },
      ],
      qualificationsList: mockQualifications,
      learnershipsList: mockLearnerships,
    },
  },
  {
    id: 'RPT-002',
    name: 'Public Input Summary - February 2025',
    description: 'Summary of feedback received during public input period',
    createdAt: '2025-02-28T14:15:00',
    createdBy: 'Sarah Johnson',
    sections: ['publicInputSummary', 'submissionOverview'],
    filters: { timeRange: 'month', type: 'all', status: 'public_input' },
    reportData: {
      stats: {
        totalQualifications: 4,
        totalLearnerships: 2,
        activeDevelopment: 2,
        pendingApproval: 3,
        approvedQualifications: 1,
        approvedLearnerships: 1,
        pendingCorrections: 2,
        avgApprovalTime: '45 days',
      },
      phaseProgress: [
        { phase: 'Design', qualifications: 1, learnerships: 0, total: 1 },
        { phase: 'Development', qualifications: 1, learnerships: 0, total: 1 },
        { phase: 'Public Input', qualifications: 1, learnerships: 1, total: 2 },
        { phase: 'Approval', qualifications: 1, learnerships: 1, total: 2 },
      ],
      publicInputItems: [
        { itemId: 'QUAL-002', title: 'Further Education and Training Certificate: Business Administration', type: 'Qualification', received: 8, resolved: 3, status: 'Partial' },
        { itemId: 'LEARN-002', title: 'Business Administration Learnership', type: 'Learnership', received: 12, resolved: 7, status: 'Partial' },
      ],
      qualificationsList: mockQualifications.filter(q => q.status === 'public_input'),
      learnershipsList: mockLearnerships.filter(l => l.status === 'public_input'),
    },
  },
  {
    id: 'RPT-003',
    name: 'Approval Readiness Report',
    description: 'Qualifications and learnerships ready for final approval',
    createdAt: '2025-03-25T09:00:00',
    createdBy: 'Mike Williams',
    sections: ['submissionOverview', 'phaseProgress', 'approvalStatus'],
    filters: { timeRange: 'all', type: 'qualification', status: 'all' },
    reportData: {
      stats: {
        totalQualifications: 4,
        totalLearnerships: 2,
        activeDevelopment: 2,
        pendingApproval: 3,
        approvedQualifications: 1,
        approvedLearnerships: 1,
        pendingCorrections: 1,
        avgApprovalTime: '45 days',
      },
      phaseProgress: [
        { phase: 'Design', qualifications: 1, learnerships: 0, total: 1 },
        { phase: 'Development', qualifications: 1, learnerships: 0, total: 1 },
        { phase: 'Public Input', qualifications: 1, learnerships: 1, total: 2 },
        { phase: 'Approval', qualifications: 1, learnerships: 1, total: 2 },
      ],
      publicInputItems: [],
      qualificationsList: mockQualifications,
      learnershipsList: [],
    },
  },
];

export function QualificationReporting() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'qualification' | 'learnership' | 'all'>('all');
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [savedReports, setSavedReports] = useState<SavedReport[]>(mockSavedReports);

  // Filter saved reports
  const filteredReports = useMemo(() => {
    return savedReports.filter(report => {
      if (searchTerm && !report.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [savedReports, searchTerm]);

const handleSaveReport = (report: {
  name: string;
  description: string;
  sections: string[];
  filters: {
    timeRange: 'today' | 'week' | 'month' | 'all';
    status: string;
  };
  reportData: any;
}) => {
  // Create a new saved report
  const newReport: SavedReport = {
    id: `RPT-${String(savedReports.length + 1).padStart(3, '0')}`,
    name: report.name,
    description: report.description,
    createdAt: new Date().toISOString(),
    createdBy: 'Current User',
    sections: report.sections,
    filters: {
      timeRange: report.filters.timeRange,
      type: 'all', // Add default type
      status: report.filters.status,
    },
    reportData: report.reportData, // Use as-is, but your SavedReport type expects different structure
  };
  
  setSavedReports(prev => [newReport, ...prev]);
  setShowReportBuilder(false);
};

  const handleViewReport = (report: SavedReport) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'public_input':
        return <Badge className="bg-blue-500">Public Input</Badge>;
      case 'development':
        return <Badge className="bg-yellow-500">Development</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'Design':
        return <FileText className="h-4 w-4" />;
      case 'Development':
        return <Layers className="h-4 w-4" />;
      case 'Public Input':
        return <AlertCircle className="h-4 w-4" />;
      case 'Approval':
        return <FileCheck className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Qualification Reporting</h2>
          <p className="text-muted-foreground mt-1">
            Generate and manage reports on qualifications and learnerships
          </p>
        </div>
        <Button onClick={() => setShowReportBuilder(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Report
        </Button>
      </div>

      {/* Stats Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Qualifications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockQualifications.length}</div>
            <p className="text-xs text-muted-foreground">
              {mockQualifications.filter(q => q.status === 'approved').length} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Learnerships</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockLearnerships.length}</div>
            <p className="text-xs text-muted-foreground">
              {mockLearnerships.filter(l => l.status === 'approved').length} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Public Input Open</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {[...mockQualifications, ...mockLearnerships].filter(i => i.status === 'public_input').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting feedback resolution
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saved Reports</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{savedReports.length}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days: {savedReports.filter(r => new Date(r.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="public_input">Public Input</SelectItem>
            <SelectItem value="development">Development</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="qualification">Qualifications Only</SelectItem>
            <SelectItem value="learnership">Learnerships Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Saved Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Saved Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No saved reports yet</p>
              <Button
                variant="link"
                onClick={() => setShowReportBuilder(true)}
                className="mt-2"
              >
                Create your first report
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Date Created</TableHead>
                  <TableHead>Sections</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {report.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        {report.createdBy}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {new Date(report.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {report.sections.slice(0, 2).map((section, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {section.replace(/([A-Z])/g, ' $1').trim()}
                          </Badge>
                        ))}
                        {report.sections.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{report.sections.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewReport(report)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Current Pipeline Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Qualification Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>NQF Level</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Public Input</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {typeFilter !== 'learnership' && mockQualifications.map((qual) => (
                <TableRow key={qual.id}>
                  <TableCell className="font-mono text-xs">{qual.id}</TableCell>
                  <TableCell className="max-w-xs truncate">{qual.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">Qualification</Badge>
                  </TableCell>
                  <TableCell>Level {qual.nqfLevel}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getPhaseIcon(qual.phase)}
                      <span>{qual.phase}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(qual.status)}</TableCell>
                  <TableCell>
                    {qual.publicInputReceived !== undefined ? (
                      <div className="text-sm">
                        {qual.publicInputResolved}/{qual.publicInputReceived} resolved
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">N/A</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {typeFilter !== 'qualification' && mockLearnerships.map((learn) => (
                <TableRow key={learn.id}>
                  <TableCell className="font-mono text-xs">{learn.id}</TableCell>
                  <TableCell className="max-w-xs truncate">{learn.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Learnership</Badge>
                  </TableCell>
                  <TableCell>Level {learn.nqfLevel}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getPhaseIcon(learn.phase)}
                      <span>{learn.phase}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(learn.status)}</TableCell>
                  <TableCell>
                    {learn.publicInputReceived !== undefined ? (
                      <div className="text-sm">
                        {learn.publicInputResolved}/{learn.publicInputReceived} resolved
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">N/A</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Report Builder Modal */}
     {showReportBuilder && (
  <QualificationReportBuilder
    onClose={() => setShowReportBuilder(false)}
    onSave={handleSaveReport}
  />
)}

      {/* View Report Modal - Uses saved reportData for exact preview matching */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedReport?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-muted-foreground border-b pb-3">
              <span>Created by: {selectedReport?.createdBy}</span>
              <span>Date: {selectedReport && new Date(selectedReport.createdAt).toLocaleString()}</span>
            </div>
            {selectedReport?.description && (
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-sm">{selectedReport.description}</p>
              </div>
            )}

            {/* Filter info badges */}
            <div className="flex gap-2 text-xs text-muted-foreground flex-wrap">
              <Badge variant="outline">Type: {selectedReport?.filters.type}</Badge>
              <Badge variant="outline">Status: {selectedReport?.filters.status}</Badge>
              <Badge variant="outline">Time Range: {selectedReport?.filters.timeRange}</Badge>
            </div>

            <div className="space-y-4">
              {/* Submission Overview Section */}
              {selectedReport?.sections.includes('submissionOverview') && selectedReport?.reportData?.stats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Submission Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Qualifications</p>
                        <p className="text-2xl font-bold">{selectedReport.reportData.stats.totalQualifications}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Learnerships</p>
                        <p className="text-2xl font-bold">{selectedReport.reportData.stats.totalLearnerships}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Active in Development</p>
                        <p className="text-2xl font-bold">{selectedReport.reportData.stats.activeDevelopment}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pending Approval</p>
                        <p className="text-2xl font-bold">{selectedReport.reportData.stats.pendingApproval}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Approved Qualifications</p>
                        <p className="text-2xl font-bold">{selectedReport.reportData.stats.approvedQualifications}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Approved Learnerships</p>
                        <p className="text-2xl font-bold">{selectedReport.reportData.stats.approvedLearnerships}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pending Corrections</p>
                        <p className="text-2xl font-bold text-amber-600">{selectedReport.reportData.stats.pendingCorrections}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg. Approval Time</p>
                        <p className="text-2xl font-bold">{selectedReport.reportData.stats.avgApprovalTime}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Phase Progress Section */}
              {selectedReport?.sections.includes('phaseProgress') && selectedReport?.reportData?.phaseProgress && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Phase Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Phase</TableHead>
                          <TableHead>Qualifications</TableHead>
                          <TableHead>Learnerships</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedReport.reportData.phaseProgress.map((phase) => (
                          <TableRow key={phase.phase}>
                            <TableCell className="font-medium">{phase.phase}</TableCell>
                            <TableCell>{phase.qualifications}</TableCell>
                            <TableCell>{phase.learnerships}</TableCell>
                            <TableCell>{phase.total}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Public Input Summary Section */}
              {selectedReport?.sections.includes('publicInputSummary') && selectedReport?.reportData?.publicInputItems && selectedReport.reportData.publicInputItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Public Input Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Received</TableHead>
                          <TableHead>Resolved</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedReport.reportData.publicInputItems.map((item) => (
                          <TableRow key={item.itemId}>
                            <TableCell className="font-mono text-xs">{item.itemId}</TableCell>
                            <TableCell className="max-w-xs truncate">{item.title}</TableCell>
                            <TableCell>
                              <Badge variant={item.type === 'Qualification' ? 'outline' : 'secondary'}>
                                {item.type}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.received}</TableCell>
                            <TableCell>{item.resolved}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  item.status === 'Resolved' ? 'default' :
                                  item.status === 'Partial' ? 'secondary' : 'destructive'
                                }
                                className={
                                  item.status === 'Resolved' ? 'bg-green-500' :
                                  item.status === 'Partial' ? 'bg-yellow-500' : ''
                                }
                              >
                                {item.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Qualifications List Section */}
              {selectedReport?.sections.includes('qualificationsList') && selectedReport?.reportData?.qualificationsList && selectedReport.reportData.qualificationsList.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Qualifications List</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>NQF Level</TableHead>
                          <TableHead>Credits</TableHead>
                          <TableHead>Phase</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedReport.reportData.qualificationsList.map((qual) => (
                          <TableRow key={qual.id}>
                            <TableCell className="font-mono text-xs">{qual.id}</TableCell>
                            <TableCell className="max-w-md truncate">{qual.title}</TableCell>
                            <TableCell>Level {qual.nqfLevel}</TableCell>
                            <TableCell>{qual.credits}</TableCell>
                            <TableCell>{qual.phase}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  qual.status === 'approved' ? 'default' :
                                  qual.status === 'development' ? 'secondary' : 'outline'
                                }
                                className={
                                  qual.status === 'approved' ? 'bg-green-500' :
                                  qual.status === 'development' ? 'bg-yellow-500' : ''
                                }
                              >
                                {qual.status === 'public_input' ? 'Public Input' : qual.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Learnerships List Section */}
              {selectedReport?.sections.includes('learnershipsList') && selectedReport?.reportData?.learnershipsList && selectedReport.reportData.learnershipsList.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Learnerships List</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>NQF Level</TableHead>
                          <TableHead>Credits</TableHead>
                          <TableHead>Phase</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedReport.reportData.learnershipsList.map((learn) => (
                          <TableRow key={learn.id}>
                            <TableCell className="font-mono text-xs">{learn.id}</TableCell>
                            <TableCell className="max-w-md truncate">{learn.title}</TableCell>
                            <TableCell>Level {learn.nqfLevel}</TableCell>
                            <TableCell>{learn.credits}</TableCell>
                            <TableCell>{learn.phase}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  learn.status === 'approved' ? 'default' :
                                  learn.status === 'development' ? 'secondary' : 'outline'
                                }
                                className={
                                  learn.status === 'approved' ? 'bg-green-500' :
                                  learn.status === 'development' ? 'bg-yellow-500' : ''
                                }
                              >
                                {learn.status === 'public_input' ? 'Public Input' : learn.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Approval Status Section */}
              {selectedReport?.sections.includes('approvalStatus') && selectedReport?.reportData?.stats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Approval Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="border rounded-lg p-4 bg-green-50">
                        <p className="text-sm text-muted-foreground">Approved Qualifications</p>
                        <p className="text-2xl font-bold text-green-700">{selectedReport.reportData.stats.approvedQualifications}</p>
                      </div>
                      <div className="border rounded-lg p-4 bg-green-50">
                        <p className="text-sm text-muted-foreground">Approved Learnerships</p>
                        <p className="text-2xl font-bold text-green-700">{selectedReport.reportData.stats.approvedLearnerships}</p>
                      </div>
                      <div className="border rounded-lg p-4 bg-amber-50">
                        <p className="text-sm text-muted-foreground">Pending Corrections</p>
                        <p className="text-2xl font-bold text-amber-700">{selectedReport.reportData.stats.pendingCorrections}</p>
                      </div>
                      <div className="border rounded-lg p-4 bg-blue-50">
                        <p className="text-sm text-muted-foreground">Avg. Approval Time</p>
                        <p className="text-2xl font-bold text-blue-700">{selectedReport.reportData.stats.avgApprovalTime}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}