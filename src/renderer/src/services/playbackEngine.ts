// The player store talks only to this interface, so the YouTube engine can be replaced.
export interface PlaybackEngine {
  load(videoId: string, autoplay: boolean): void
  play(): void
  pause(): void
  seek(seconds: number): void
  setVolume(volume: number): void
  setMuted(muted: boolean): void
}

export interface EngineEvents {
  onPlaying(duration: number): void
  onPaused(): void
  onTime(position: number, duration: number): void
  onEnded(): void
  /** `skippable`: the problem is this video (deleted, blocked…), so moving on can help. */
  onError(message: string, skippable: boolean): void
}
