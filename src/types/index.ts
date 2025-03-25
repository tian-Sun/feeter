export interface Task {
  id: string;
  title: string;
  completed: boolean;
  quadrantId: string;
}

export interface Quadrant {
  id: string;
  title: string;
  tasks: Task[];
}

export type TimerMode = 'pomodoro' | 'custom'; 