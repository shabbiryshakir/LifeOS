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
  category: string;
  status: 'pending' | 'completed';
  dueDate?: string;
  recurring?: string;
  assigneeId?: string;
  assigneeName?: string;
  visionGoalId?: string;
}

export interface FinanceEntry {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: 'expense' | 'income';
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  period: 'monthly' | 'weekly';
}

export interface VisionGoal {
  id: string;
  title: string;
  description?: string;
  targetDate?: string;
  imageUrl?: string;
  status: 'active' | 'completed' | 'archived';
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly';
  targetCount: number;
  color: string;
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  count: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  type: 'task' | 'finance';
}

export interface AppSettings {
  tripTitle: string;
  tripDate: string;
  tripDescription?: string;
}
