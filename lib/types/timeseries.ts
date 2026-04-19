export interface PlatformBreakdown {
  reddit: number;
  x: number;
  instagram: number;
}

export interface TimeseriesBucket {
  date: string;
  value: number;
  sampleSize: number;
  negativeCount: number;
  neutralCount: number;
  positiveCount: number;
  platformBreakdown: PlatformBreakdown;
}
