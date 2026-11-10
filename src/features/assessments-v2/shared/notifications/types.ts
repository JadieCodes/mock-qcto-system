export interface AppNotification {
  id: string;
  recipientRole: string;
  // Batch S: set when the message is for one named person (a reassignment, an acting appointment);
  // only that person sees it, whichever role they are acting in.
  recipientPersonId?: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  linkPath?: string;
}
