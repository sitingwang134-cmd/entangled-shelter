export interface EditionsSource {
  title: string;
  sourceUrl: string;
  fallbackDesktop: string;
  fallbackMobile: string;
}

export interface CloneFrameState {
  loaded: boolean;
  delayed: boolean;
}
