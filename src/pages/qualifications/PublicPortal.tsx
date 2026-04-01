import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  FileText, 
  Download, 
  Eye, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Filter,
  BookOpen,
  GraduationCap,
  Users,
  Calendar,
  ArrowRight,
  ExternalLink
} from "lucide-react";

export default function PublicPortal() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Public Portal</h1>
        <p className="text-muted-foreground mt-2">
          Access and track qualification developments and submissions
        </p>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="qualifications" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="qualifications" className="text-lg py-3">
            Qualifications Development
          </TabsTrigger>
          <TabsTrigger value="submissions" className="text-lg py-3">
            Submissions
          </TabsTrigger>
        </TabsList>

        {/* Qualifications Development Tab */}
        <TabsContent value="qualifications">
          <QualificationsTab />
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions">
          <SubmissionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Qualifications Development Tab Component
function QualificationsTab() {
  const qualifications = [
    {
      id: 1,
      title: "National Diploma: Information Technology",
      code: "ND-IT-2024",
      nqfLevel: "6",
      credits: 240,
      status: "In Development",
      phase: "Phase 3: Profile",
      lastUpdated: "2024-03-15",
      progress: 45,
      description: "Comprehensive IT diploma covering software development, networking, and database management"
    },
    {
      id: 2,
      title: "Bachelor of Engineering: Electrical",
      code: "BE-ELEC-2024",
      nqfLevel: "7",
      credits: 360,
      status: "Review",
      phase: "Phase 7: QAS Verification",
      lastUpdated: "2024-03-18",
      progress: 85,
      description: "Professional engineering degree with focus on electrical systems and renewable energy"
    },
    {
      id: 3,
      title: "Certificate: Project Management",
      code: "CERT-PM-2024",
      nqfLevel: "5",
      credits: 120,
      status: "Completed",
      phase: "Phase 8: Final Verification",
      lastUpdated: "2024-03-10",
      progress: 100,
      description: "Foundation certificate in project management principles and practices"
    },
    {
      id: 4,
      title: "Advanced Diploma: Data Science",
      code: "AD-DS-2024",
      nqfLevel: "7",
      credits: 180,
      status: "In Development",
      phase: "Phase 2: Scoping",
      lastUpdated: "2024-03-12",
      progress: 25,
      description: "Advanced data science diploma focusing on machine learning and big data analytics"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search qualifications..." 
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Qualifications</p>
                <p className="text-2xl font-bold">24</p>
              </div>
              <BookOpen className="h-8 w-8 text-primary opacity-75" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Development</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500 opacity-75" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Under Review</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-500 opacity-75" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">4</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500 opacity-75" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Qualifications List */}
      <div className="space-y-4">
        {qualifications.map((qual) => (
          <Card key={qual.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-2">
                    <GraduationCap className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold text-lg">{qual.title}</h3>
                      <p className="text-sm text-muted-foreground">{qual.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 mt-3">
                    <div className="flex items-center gap-1 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>Code: {qual.code}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>NQF Level: {qual.nqfLevel}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Credits: {qual.credits}</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm">{qual.progress}%</span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${qual.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <Badge 
                    variant={
                      qual.status === "Completed" ? "default" :
                      qual.status === "Review" ? "secondary" : "outline"
                    }
                    className="px-3 py-1"
                  >
                    {qual.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{qual.phase}</span>
                  <span className="text-xs text-muted-foreground">
                    Updated: {qual.lastUpdated}
                  </span>
                  <Button variant="ghost" size="sm" className="gap-2">
                    View Details
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Submissions Tab Component
function SubmissionsTab() {
  const submissions = [
    {
      id: 1,
      title: "National Diploma: IT - Phase 3 Submission",
      qualification: "National Diploma: Information Technology",
      type: "Phase Submission",
      submittedBy: "Dr. Sarah Johnson",
      submittedDate: "2024-03-15",
      dueDate: "2024-03-30",
      status: "Under Review",
      priority: "High",
      comments: 5
    },
    {
      id: 2,
      title: "Bachelor Engineering: QAS Documentation",
      qualification: "Bachelor of Engineering: Electrical",
      type: "QAS Verification",
      submittedBy: "Prof. Michael Chen",
      submittedDate: "2024-03-14",
      dueDate: "2024-03-28",
      status: "Pending",
      priority: "Medium",
      comments: 2
    },
    {
      id: 3,
      title: "Project Management: Final Qualification Document",
      qualification: "Certificate: Project Management",
      type: "Final Submission",
      submittedBy: "Ms. Lisa Williams",
      submittedDate: "2024-03-10",
      dueDate: "2024-03-25",
      status: "Approved",
      priority: "Low",
      comments: 0
    },
    {
      id: 4,
      title: "Data Science: Scoping Document",
      qualification: "Advanced Diploma: Data Science",
      type: "Phase Submission",
      submittedBy: "Dr. James Wilson",
      submittedDate: "2024-03-16",
      dueDate: "2024-03-31",
      status: "Draft",
      priority: "High",
      comments: 3
    }
  ];

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search submissions..." 
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button>New Submission</Button>
        </div>
      </div>

      {/* Submissions Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Submissions</p>
                <p className="text-2xl font-bold">156</p>
              </div>
              <FileText className="h-8 w-8 text-primary opacity-75" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">28</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500 opacity-75" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">89</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500 opacity-75" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Requires Action</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500 opacity-75" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {submissions.map((submission) => (
          <Card key={submission.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold text-lg">{submission.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Qualification: {submission.qualification}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Type</p>
                      <p className="text-sm font-medium">{submission.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Submitted By</p>
                      <p className="text-sm font-medium">{submission.submittedBy}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Submitted</p>
                      <p className="text-sm font-medium">{submission.submittedDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Due Date</p>
                      <p className="text-sm font-medium">{submission.dueDate}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 min-w-[150px]">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        submission.status === "Approved" ? "default" :
                        submission.status === "Under Review" ? "secondary" :
                        submission.status === "Pending" ? "outline" :
                        "destructive"
                      }
                      className="px-3 py-1"
                    >
                      {submission.status}
                    </Badge>
                    <Badge 
                      variant={
                        submission.priority === "High" ? "destructive" :
                        submission.priority === "Medium" ? "secondary" :
                        "outline"
                      }
                      className="px-3 py-1"
                    >
                      {submission.priority}
                    </Badge>
                  </div>
                  
                  {submission.comments > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {submission.comments} comments
                    </span>
                  )}

                  <div className="flex gap-2 mt-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates on submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-start gap-3 pb-3 border-b last:border-0">
                <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">Dr. Sarah Johnson</span> submitted Phase 3 documentation for{" "}
                    <span className="font-medium">National Diploma: IT</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                </div>
                <Badge variant="outline">Under Review</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}