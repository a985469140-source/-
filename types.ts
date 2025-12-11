export enum AppState {
  FORMED = 'FORMED',
  CHAOS = 'CHAOS'
}

export interface GestureResponse {
  state: AppState;
  handX: number; // -1 to 1
  handY: number; // -1 to 1
  confidence: number;
}

export interface TreeItemProps {
  isUnleashed: boolean;
  count: number;
}