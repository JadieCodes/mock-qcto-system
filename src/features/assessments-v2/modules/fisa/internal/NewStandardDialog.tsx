import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { roleDescriptor } from '../../../config/roles';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { useCreateFisaStandard } from '../hooks';
import type { SourceDocument } from '../types';

// PM-10: Qualifications Development supplies the source documents — never a SAQA gate check.
export function NewStandardDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { role } = useV2Role();
  const actorName = roleDescriptor(role)?.label ?? role;
  const createStandard = useCreateFisaStandard();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [skillsProgrammeTitle, setSkillsProgrammeTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const reset = () => {
    setSkillsProgrammeTitle('');
    setNotes('');
    setFiles([]);
  };

  const onSubmit = () => {
    if (!skillsProgrammeTitle.trim() || files.length === 0) return;
    const sourceDocuments: SourceDocument[] = files.map((f) => ({ fileName: f.name, fileSize: f.size, uploadedAt: new Date().toISOString() }));
    createStandard.mutate(
      { skillsProgrammeTitle: skillsProgrammeTitle.trim(), sourceDocuments, notes, createdBy: actorName },
      { onSuccess: () => { onOpenChange(false); reset(); } },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { onOpenChange(next); if (!next) reset(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New FISA Standard</DialogTitle>
          <DialogDescription>Supply the source documents for a new Skills Programme's final-assessment standard.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="skills-programme-title">Skills Programme Title *</Label>
            <Input
              id="skills-programme-title"
              value={skillsProgrammeTitle}
              onChange={(e) => setSkillsProgrammeTitle(e.target.value)}
              placeholder="Enter Skills Programme title"
            />
          </div>

          <div className="space-y-2">
            <Label>Source Documents *</Label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])])}
            />
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              Upload documents
            </Button>
            {files.length > 0 && (
              <ul className="space-y-1">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center justify-between text-xs font-mono bg-gray-50 rounded px-2 py-1">
                    {f.name} ({Math.round(f.size / 1024)} KB)
                    <button type="button" onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}>
                      <X className="h-3 w-3 text-gray-400" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fisa-standard-notes">Notes / Comments</Label>
            <Textarea id="fisa-standard-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!skillsProgrammeTitle.trim() || files.length === 0 || createStandard.isPending} onClick={onSubmit}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
