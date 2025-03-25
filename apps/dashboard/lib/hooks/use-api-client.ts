import { useEffect, useState } from 'react';

interface DashboardStats {
  dailyStats: Array<{
    date: string;
    uniqueVisitors: number;
    pageviews: number;
  }>;
  devices: Record<string, number>;
  browsers: Record<string, number>;
  countries: Array<{
    country: string;
    visits: number;
  }>;
}

const MOCK_DATA: DashboardStats = {
  dailyStats: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    uniqueVisitors: Math.floor(Math.random() * 1000),
    pageviews: Math.floor(Math.random() * 2000),
  })),
  devices: {
    Desktop: 2500,
    Mobile: 1800,
    Tablet: 700,
  },
  browsers: {
    Chrome: 2000,
    Firefox: 1000,
    Safari: 800,
    Edge: 500,
    Other: 200,
  },
  countries: [
    { country: 'United States', visits: 1500 },
    { country: 'United Kingdom', visits: 800 },
    { country: 'Germany', visits: 600 },
    { country: 'France', visits: 400 },
    { country: 'Canada', visits: 350 },
  ],
};

export function useApiClient() {
  const [isReady, setIsReady] = useState(false);
  const [client] = useState({
    getDashboardCharts: async (_fromDate: string, _toDate: string): Promise<DashboardStats> => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return MOCK_DATA;
    }
  });

  useEffect(() => {
    setIsReady(true);
  }, []);

  return { client, isReady };
} 