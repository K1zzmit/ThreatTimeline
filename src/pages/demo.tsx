import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { demoEvents } from '@/lib/demo-data';

export default function Demo() {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      // Create a new incident with demo data
      const demoIncident = {
        id: 'demo',
        name: 'Demo Investigation',
        description: 'A sample investigation showing the capabilities of the timeline',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        events: demoEvents
      };

      // Store the demo incident
      const incidentStore = {
        incidents: { demo: demoIncident },
        activeIncidentId: 'demo'
      };

      // Save to localStorage
      localStorage.setItem('incidents', JSON.stringify(incidentStore));
      
      // Redirect to the main page
      navigate('/');
    } catch (error) {
      console.error('Error loading demo data:', error);
    }
  }, [navigate]);

  // Show a loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Loading demo data...</p>
    </div>
  );
} 