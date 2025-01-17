import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { IncidentStore } from './types';
import type { TimelineEvent } from '@/pages/Index';
import { useToast } from '@/components/ui/use-toast';

const INCIDENTS_STORAGE_KEY = 'incidents';

export interface Incident {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  events: TimelineEvent[];
}

export const useIncidents = () => {
  const [incidentStore, setIncidentStore] = useState<IncidentStore>({
    incidents: {},
    activeIncidentId: null
  });
  const { toast } = useToast();

  // Load incidents from localStorage on mount
  useEffect(() => {
    try {
      const savedIncidents = localStorage.getItem(INCIDENTS_STORAGE_KEY);
      if (savedIncidents) {
        setIncidentStore(JSON.parse(savedIncidents));
      }
    } catch (error) {
      console.error('Error loading incidents:', error);
      toast({
        title: "Error",
        description: "Failed to load incidents",
        variant: "destructive",
      });
    }
  }, []);

  // Save incidents to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(INCIDENTS_STORAGE_KEY, JSON.stringify(incidentStore));
    } catch (error) {
      console.error('Error saving incidents:', error);
      toast({
        title: "Error",
        description: "Failed to save incidents",
        variant: "destructive",
      });
    }
  }, [incidentStore]);

  const createIncident = (name: string, description?: string) => {
    const id = uuidv4();
    const newIncident: Incident = {
      id,
      name,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      events: []
    };

    setIncidentStore(prev => ({
      ...prev,
      incidents: {
        ...prev.incidents,
        [id]: newIncident
      },
      activeIncidentId: id
    }));

    return id;
  };

  const updateIncident = (id: string, updates: Partial<Incident>) => {
    setIncidentStore(prev => {
      const incident = prev.incidents[id];
      if (!incident) return prev;

      return {
        ...prev,
        incidents: {
          ...prev.incidents,
          [id]: {
            ...incident,
            ...updates,
            updatedAt: new Date().toISOString()
          }
        }
      };
    });
  };

  const deleteIncident = (id: string) => {
    setIncidentStore(prev => {
      const { [id]: removed, ...remaining } = prev.incidents;
      return {
        incidents: remaining,
        activeIncidentId: prev.activeIncidentId === id ? null : prev.activeIncidentId
      };
    });
  };

  const setActiveIncident = (id: string | null) => {
    setIncidentStore(prev => ({
      ...prev,
      activeIncidentId: id
    }));
  };

  const updateEvents = (incidentId: string, events: TimelineEvent[]) => {
    updateIncident(incidentId, { events });
  };

  const activeIncident = incidentStore.activeIncidentId 
    ? incidentStore.incidents[incidentStore.activeIncidentId]
    : null;

  return {
    incidents: incidentStore.incidents,
    activeIncident,
    activeIncidentId: incidentStore.activeIncidentId,
    createIncident,
    updateIncident,
    deleteIncident,
    setActiveIncident,
    updateEvents
  };
}; 