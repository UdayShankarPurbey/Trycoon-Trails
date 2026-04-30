export type NotificationType =
  | 'battle_attacked'
  | 'battle_defended'
  | 'territory_captured'
  | 'mission_complete'
  | 'level_up'
  | 'admin_grant'
  | 'admin_message'
  | 'system';

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  is_read: boolean;
  read_at: string | null;
  createdAt: string;
}
