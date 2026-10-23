import type { FormEventHandler, ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export type ModalSize = 'sm' | 'md' | 'lg';

// sm = single-field confirmations, md = forms and detail views, lg = tabbed workspaces.
const MAX_WIDTH: Record<ModalSize, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-2xl',
  lg: 'sm:max-w-4xl',
};

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size?: ModalSize;
  title: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  /** Pass this to make the body + footer a <form> (e.g. a submit button in the footer). */
  onSubmit?: FormEventHandler<HTMLFormElement>;
  bodyClassName?: string;
}

// One shared dialog shell for every "New X" and "View X" dialog in the domain, built on the
// existing shadcn Dialog: a fixed header (title + optional one-line description), a body that
// scrolls on its own once it's taller than the viewport, and a footer that keeps the primary
// action on the right next to Cancel. `w-[calc(100vw-2rem)]` keeps a gutter on a phone instead
// of the dialog touching the screen edges.
export function Modal({ open, onOpenChange, size = 'md', title, description, footer, children, onSubmit, bodyClassName }: ModalProps) {
  const body = <div className={cn('flex-1 overflow-y-auto px-6 py-4', bodyClassName)}>{children}</div>;
  const footerNode = footer && <DialogFooter className="shrink-0 border-t px-6 py-4">{footer}</DialogFooter>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('flex max-h-[85vh] w-[calc(100vw-2rem)] flex-col gap-0 p-0 sm:w-full', MAX_WIDTH[size])}>
        <DialogHeader className="shrink-0 border-b px-6 py-5">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {onSubmit ? (
          <form onSubmit={onSubmit} className="flex flex-1 flex-col overflow-hidden">
            {body}
            {footerNode}
          </form>
        ) : (
          <>
            {body}
            {footerNode}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
