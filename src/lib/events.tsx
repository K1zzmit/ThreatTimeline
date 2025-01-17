import React, { useState, useEffect } from 'react';
import type { TimelineEvent } from '../pages/Index';
import { demoEvents } from './demo-data';

export const useEvents = () => {
  const [events, setEvents] = useState<TimelineEvent[]>(demoEvents);

  // Load events from localStorage on mount
  useEffect(() => {
    try {
      const savedEvents = localStorage.getItem('timelineEvents');
      if (savedEvents) {
        const parsedEvents = JSON.parse(savedEvents);
        setEvents(parsedEvents);
      }
    } catch (error) {
      console.error('Error loading timeline events:', error);
    }
  }, []);

  // Save events to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('timelineEvents', JSON.stringify(events));
    } catch (error) {
      console.error('Error saving timeline events:', error);
    }
  }, [events]);

  // Listen for changes to localStorage from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'timelineEvents' && e.newValue) {
        try {
          const parsedEvents = JSON.parse(e.newValue);
          setEvents(parsedEvents);
        } catch (error) {
          console.error('Error parsing timeline events:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loadDemoData = () => {
    const clonedData = JSON.parse(JSON.stringify(demoEvents));
    setEvents(clonedData);
  };

  return { events, setEvents, loadDemoData };
}; 