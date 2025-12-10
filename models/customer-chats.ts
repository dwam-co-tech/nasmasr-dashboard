export interface ConversationsMeta {
  page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface ConversationParticipant {
  id: number;
  name: string | null;
  phone: string;
}

export interface ConversationItem {
  conversation_id: string;
  participants: ConversationParticipant[];
  started_at: string;
  last_message_at: string;
  messages_count: number;
  last_message_text?: string;
  unread_count?: number;
}

export interface ConversationsResponse {
  meta: ConversationsMeta;
  data: ConversationItem[];
}

export interface SingleConversationMeta {
  conversation_id: string;
  participants: ConversationParticipant[];
  page: number;
  per_page: number;
  total: number;
}

export interface ConversationMessageSide {
  id: number;
  name: string | null;
}

export interface ConversationMessage {
  id: number;
  sender: ConversationMessageSide;
  receiver: ConversationMessageSide;
  message: string;
  read_at: string | null;
  created_at: string;
}

export interface SingleConversationResponse {
  meta: SingleConversationMeta;
  data: ConversationMessage[];
}

export interface SearchConversationItem {
  conversation_id: string;
  participants: ConversationParticipant[];
  last_message_at: string;
  messages_count: number;
}

export interface SearchResponse {
  users_found: number;
  conversations_found: number;
  data: SearchConversationItem[];
}

export interface ConversationsStatsResponse {
  total_peer_conversations: number;
  total_peer_messages: number;
  today_messages: number;
  active_users_today: number;
}
