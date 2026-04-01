import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

export default function ProfileSubmissionsList() {
  const { profileSubmissions, currentRole, acceptProfileSubmission } = useApp();
  const { toast } = useToast();

  const canAccept = ['Assessment Unit', 'Cert Admin'].includes(currentRole);

  const handleAccept = (id: string) => {
    acceptProfileSubmission(id);
    toast({ title: 'Accepted', description: 'Profile submission has been accepted' });
  };

  if (profileSubmissions.length === 0) return null;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Profile Submissions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Candidate Name</TableHead>
              <TableHead>Certificate Type</TableHead>
              <TableHead>Process Type</TableHead>
              <TableHead>Date Submitted</TableHead>
              <TableHead>Status</TableHead>
              {canAccept && <TableHead>Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {profileSubmissions.map(sub => (
              <TableRow key={sub.id}>
                <TableCell className="font-mono text-xs">{sub.id}</TableCell>
                <TableCell>{sub.candidateName}</TableCell>
                <TableCell>{sub.certificateType}</TableCell>
                <TableCell>{sub.processType === 'reissue' ? 'Re-Issue' : 'Issue'}</TableCell>
                <TableCell>{new Date(sub.dateSubmitted).toLocaleDateString()}</TableCell>
                <TableCell>
                  <span
                    className={`text-xs px-2 py-1 rounded-full status-${
                      sub.status === 'draft' ? 'draft' : sub.status === 'completed' ? 'completed' : 'processing'
                    }`}
                  >
                    {sub.status.replace('_', ' ')}
                  </span>
                </TableCell>
                {canAccept && (
                  <TableCell>
                    {sub.status === 'draft' && (
                      <Button size="sm" onClick={() => handleAccept(sub.id)}>Accept</Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
