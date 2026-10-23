import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { useApprovedRplToolkitsForQp, useCreateRplToolkitApplication } from '../hooks';
import type { NewRplToolkitInput, RplToolkitType } from '../types';

interface FormValues {
  toolkitTitle: string;
  description: string;
  submissionDate: string;
  notes: string;
}

export function NewApplicationForm({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { person } = useV2Role();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      toolkitTitle: '',
      description: '',
      submissionDate: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });
  const [toolkitType, setToolkitType] = useState<RplToolkitType>('new');
  const [updatesToolkitId, setUpdatesToolkitId] = useState('');
  const createApplication = useCreateRplToolkitApplication();
  const qpId = person.qpId ?? person.id;
  const { data: approvedToolkits = [] } = useApprovedRplToolkitsForQp(qpId);

  const resetAll = () => {
    reset();
    setToolkitType('new');
    setUpdatesToolkitId('');
  };

  const canSubmitType = toolkitType === 'new' || !!updatesToolkitId;

  const onSubmit = (values: FormValues) => {
    if (!canSubmitType) return;
    const input: NewRplToolkitInput = {
      ...values,
      qpId,
      qpName: person.name,
      toolkitType,
      ...(toolkitType === 'updated' ? { updatesToolkitId } : {}),
    };
    createApplication.mutate(input, {
      onSuccess: () => {
        onOpenChange(false);
        resetAll();
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) resetAll();
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New RPL Toolkit Submission</DialogTitle>
          <DialogDescription>Submit a new or updated RPL Toolkit for evaluation.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4 py-2" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label>Name of QP</Label>
            <p className="text-sm font-medium py-2">{person.name}</p>
            <p className="text-xs text-gray-400">Submitting as the acting QP — switch person in the header to submit as someone else.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rpl-toolkit-title">Toolkit Title *</Label>
            <Input id="rpl-toolkit-title" {...register('toolkitTitle', { required: true })} placeholder="Enter RPL Toolkit title" />
            {errors.toolkitTitle && <p className="text-xs text-red-600">Required.</p>}
          </div>
          <div className="space-y-2">
            <Label>Submission Type *</Label>
            <RadioGroup
              value={toolkitType}
              onValueChange={(v) => {
                setToolkitType(v as RplToolkitType);
                if (v === 'new') setUpdatesToolkitId('');
              }}
              className="flex gap-6"
            >
              <div className="flex items-center gap-1.5">
                <RadioGroupItem id="rpl-type-new" value="new" />
                <Label htmlFor="rpl-type-new" className="text-sm font-normal">
                  New toolkit
                </Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem id="rpl-type-updated" value="updated" />
                <Label htmlFor="rpl-type-updated" className="text-sm font-normal">
                  Updated toolkit
                </Label>
              </div>
            </RadioGroup>
          </div>
          {toolkitType === 'updated' && (
            <div className="space-y-2">
              <Label>Which toolkit is this updating? *</Label>
              <Select value={updatesToolkitId} onValueChange={setUpdatesToolkitId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select one of your approved toolkits" />
                </SelectTrigger>
                <SelectContent>
                  {approvedToolkits.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.toolkitTitle} (v{t.version})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {approvedToolkits.length === 0 && (
                <p className="text-xs text-gray-400">You have no approved toolkits yet to update.</p>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="rpl-description">Description *</Label>
            <Textarea id="rpl-description" rows={3} {...register('description', { required: true })} placeholder="What does this toolkit assess?" />
            {errors.description && <p className="text-xs text-red-600">Required.</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="rpl-submission-date">Submission Date *</Label>
            <Input id="rpl-submission-date" type="date" {...register('submissionDate', { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rpl-notes">Notes / Comments</Label>
            <Textarea id="rpl-notes" rows={2} {...register('notes')} placeholder="Enter any additional notes..." />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createApplication.isPending || !canSubmitType} className="gap-2">
              <Upload className="h-4 w-4" />
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
