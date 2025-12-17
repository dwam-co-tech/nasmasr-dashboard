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

export interface AdminNotificationLink {
  url: string | null;
  label: string;
  page: number | null;
  active: boolean;
}

export interface AdminNotificationData {
  id: number;
  title: string;
  body: string;
  type: string | null;
  data: Record<string, unknown> | null;
  read_at: string | null;
  source?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface AdminNotificationsResponse {
  current_page: number;
  data: AdminNotificationData[];
  first_page_url?: string;
  from?: number;
  last_page: number;
  last_page_url?: string;
  links?: AdminNotificationLink[];
  next_page_url?: string | null;
  path?: string;
  per_page: number;
  prev_page_url?: string | null;
  to?: number;
  total: number;
}

export interface AdminNotificationsCountResponse {
  count: number;
}

export interface AdminNotificationReadResponse {
  message: string;
}
