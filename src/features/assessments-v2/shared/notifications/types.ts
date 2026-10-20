export interface AppNotification {
  id: string;
  recipientRole: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  linkPath?: string;
}
