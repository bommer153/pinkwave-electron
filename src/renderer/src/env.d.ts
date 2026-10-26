/// <reference types="vite/client" />
import type { PinkwaveApi } from '../../shared/ipc'

declare global {
  interface Window {
    pinkwave: PinkwaveApi
  }
}
