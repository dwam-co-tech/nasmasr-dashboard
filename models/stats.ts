export interface CardStat {
  count: number;
  percent: number;
  direction: 'up' | 'down';
}

export interface AdminStatsCards {
  rejected: CardStat;
  pending: CardStat;
  active: CardStat;
  total: CardStat;
}

export interface Period {
  start: string;
  end: string;
}

export interface AdminStatsPeriods {
  current_month: Period;
  previous_month: Period;
}

export interface AdminStatsResponse {
  cards: AdminStatsCards;
  periods: AdminStatsPeriods;
}

export interface RecentActivityItem {
  type: string;
  message: string;
  entity?: string;
  id?: number;
  status?: string;
  admin_approved?: boolean;
  timestamp: string;
  ago?: string;
}

export interface RecentActivitiesResponse {
  count: number;
  activities: RecentActivityItem[];
}