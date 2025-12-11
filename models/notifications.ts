export interface NotificationPayload {
  title: string;
  body: string;
  user_id: number;
  type?: string | null;
  data?: Record<string, unknown> | null;
}

export interface NotificationData {
  id: number;
  user_id: number;
  title: string;
  body: string;
  type: string | null;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

export interface NotificationResponse {
  message: string;
  data: NotificationData;
  external_sent?: boolean;
}
