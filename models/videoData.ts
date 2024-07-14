export interface videoData {
    isReplace: boolean;
    startTime: number;
    endTime?: number;
    position?: { x: number; y: number };
    content?: string;
    size?: { width: number; height: number };
    color?: string;
  }