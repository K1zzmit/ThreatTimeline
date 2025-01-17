export const RECENT_ARTIFACTS_KEY = 'recentArtifacts';

export interface StoredArtifact {
  name: string;
  value: string;
  linkedValue?: string;
}

export type RecentArtifacts = {
  [key: string]: StoredArtifact[];
};

export const getRecentArtifacts = (): RecentArtifacts => {
  try {
    const stored = localStorage.getItem(RECENT_ARTIFACTS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to load recent artifacts:', error);
    return {};
  }
};

export const setRecentArtifacts = (artifacts: RecentArtifacts): void => {
  try {
    localStorage.setItem(RECENT_ARTIFACTS_KEY, JSON.stringify(artifacts));
  } catch (error) {
    console.error('Failed to save recent artifacts:', error);
  }
};

export const clearRecentArtifacts = (): void => {
  try {
    localStorage.removeItem(RECENT_ARTIFACTS_KEY);
  } catch (error) {
    console.error('Failed to clear recent artifacts:', error);
  }
}; 