import type { TimelineEvent } from '@/pages/Index';

export const demoEvents: TimelineEvent[] = [
  {
    id: "1",
    timestamp: "2024-12-03T11:55:51",
    title: "Initial Access - Malicious Download",
    description: "User downloaded installer.exe from microsoftblogcenter.com",
    tactic: "Initial Access",
    technique: "Drive-by Compromise",
    artifacts: [
      {
        type: "file",
        name: "Malicious File",
        value: "installer.exe",
        linkedValue: "8a9f91d2b2b42c3e6ac4c2a6a1c7fc39"
      },
      {
        type: "domain",
        name: "Download Source",
        value: "microsoftblogcenter.com",
        linkedValue: "203.0.113.42"
      },
      {
        type: "hostname",
        name: "Affected Host",
        value: "DESKTOP-ABC123"
      },
      {
        type: "user",
        name: "User Account",
        value: "jsmith"
      }
    ]
  }
]; 