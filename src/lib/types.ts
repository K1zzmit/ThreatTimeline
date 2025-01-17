import type { TimelineEvent } from '@/pages/Index';

export interface Incident {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  events: TimelineEvent[];
}

export interface IncidentStore {
  incidents: Record<string, Incident>;
  activeIncidentId: string | null;
} 