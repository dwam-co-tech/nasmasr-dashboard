export interface SupportInboxMeta {
  page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface SupportInboxUser {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
}

export interface SupportInboxItem {
  conversation_id: string;
  user: SupportInboxUser;
  last_message: string | null;
  last_message_at: string | null;
  last_message_by: string | null;
  messages_count: number;
  unread_count: string | number;
}

export interface SupportInboxResponse {
  meta: SupportInboxMeta;
  data: SupportInboxItem[];
}

export interface SupportConversationMeta {
  conversation_id: string;
  user: SupportInboxUser;
  page: number;
  per_page: number;
  total: number;
}

export interface SupportConversationMessage {
  id: number;
  sender_id: number;
  sender_type: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

export interface SupportConversationResponse {
  meta: SupportConversationMeta;
  data: SupportConversationMessage[];
}

export interface AdminReplyData {
  id: number;
  conversation_id: string;
  message: string;
  admin_id: number;
  admin_name: string;
  created_at: string;
}

export interface AdminReplyResponse {
  message: string;
  data: AdminReplyData;
}

export interface MarkReadResponse {
  message: string;
  marked_count: number;
}

export interface SupportStatsResponse {
  total_conversations: number;
  unread_conversations: number;
  today_messages: number;
  avg_response_time: number | null;
}
