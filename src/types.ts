export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  partnerUid?: string;
}

export interface WidgetConfig {
  [key: string]: any;
}

export interface Widget {
  id: string;
  type: 'counter' | 'list' | 'finance' | 'countdown' | 'custom';
  title: string;
  config: WidgetConfig;
  order: number;
  active: boolean;
}

export interface Task {
  id: string;
  title: string;
  category: 'Urgent' | 'Leisure' | 'Chores';
  status: 'pending' | 'completed';
  dueDate?: string;
  recurring?: string;
}

export interface FinanceEntry {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: 'expense' | 'income';
}

export interface VisionGoal {
  id: string;
  title: string;
  description?: string;
  targetDate?: string;
  imageUrl?: string;
}
