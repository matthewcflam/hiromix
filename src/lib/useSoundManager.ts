import { useEffect, useRef, useState, useCallback } from 'react';
import { Howl, Howler } from 'howler';

interface SoundManagerConfig {
  enabled?: boolean;
  volume?: number;
}

interface SoundManagerReturn {
  playTick: (velocity?: number) => boolean;
  playPaperPickup: () => void;
  playPaperPlace: () => void;
  playPaperCrumple: () => void;
  playPaperFall: () => void;
  unlockAudio: () => void;
  setVolume: (volume: number) => void;
  setEnabled: (enabled: boolean) => void;
  isEnabled: boolean;
  volume: number;
  isLoaded: boolean;
  isAudioReady: boolean;
}

const removeListenerSafely = (
  target: EventTarget,
  eventName: string,
  listener: EventListenerOrEventListenerObject | null | undefined
) => {
  if (listener && (typeof listener === 'function' || typeof listener === 'object')) {
    target.removeEventListener(eventName, listener);
  }
};

/**
 * Custom hook for managing all UI sound effects
 * Uses Howler.js for cross-browser audio playback
 */
export function useSoundManager(config: SoundManagerConfig = {}): SoundManagerReturn {
  const [isEnabled, setIsEnabled] = useState(config.enabled ?? true);
  const [volume, setVolumeState] = useState(config.volume ?? 0.5);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  
  // Refs to store Howl instances
  const soundsRef = useRef<{
    tick?: Howl;
    paperPickup?: Howl;
    paperPlace?: Howl;
    paperCrumple?: Howl;
    paperFall?: Howl;
  }>({});

  // Track last tick time for throttling
  const lastTickTimeRef = useRef(0);
  const TICK_THROTTLE_MS = 30; // Minimum time between tick sounds
  const isAudioReadyRef = useRef(false);

  // Load sound preferences from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedEnabled = localStorage.getItem('sound-effects-enabled');
      const savedVolume = localStorage.getItem('sound-effects-volume');
      
      if (savedEnabled !== null) {
        setIsEnabled(savedEnabled === 'true');
      }
      if (savedVolume !== null) {
        setVolumeState(parseFloat(savedVolume));
      }
    } catch (e) {
      console.error('Failed to load sound preferences:', e);
    }
  }, []);

  // Initialize all sounds
  useEffect(() => {
    // Don't initialize in SSR
    if (typeof window === 'undefined') return;

    // Explicitly keep Howler's user-gesture unlock enabled.
    Howler.autoUnlock = true;

    const sounds = {
      tick: new Howl({
        src: ['/sounds/tick.mp3', '/sounds/tick.ogg'],
        volume: volume * 0.4, // Ticks are more subtle
        preload: 'auto',
        html5: false,
        onloaderror: (id, error) => {
          console.warn('Failed to load tick sound:', error);
        },
      }),
      paperPickup: new Howl({
        src: ['/sounds/paper-pickup.mp3', '/sounds/paper-pickup.ogg', '/sounds/paper-place.mp3'],
        volume: volume * 0.6,
        preload: 'auto',
        html5: false,
        onloaderror: (id, error) => {
          console.warn('Failed to load paper-pickup sound:', error);
        },
      }),
      paperPlace: new Howl({
        src: ['/sounds/paper-place.mp3', '/sounds/paper-place.ogg'],
        volume: volume * 0.6,
        preload: 'auto',
        html5: false,
        onloaderror: (id, error) => {
          console.warn('Failed to load paper-place sound:', error);
        },
      }),
      paperCrumple: new Howl({
        src: ['/sounds/paper-crumple.mp3', '/sounds/paper-crumple.ogg'],
        volume: volume * 0.7,
        preload: 'auto',
        html5: false,
        onloaderror: (id, error) => {
          console.warn('Failed to load paper-crumple sound:', error);
        },
      }),
      paperFall: new Howl({
        src: ['/sounds/paper-fall.mp3', '/sounds/paper-fall.ogg'],
        volume: volume * 0.6,
        preload: 'auto',
        html5: false,
        onloaderror: (id, error) => {
          console.warn('Failed to load paper-fall sound:', error);
        },
      }),
    };

    soundsRef.current = sounds;
    if (Howler.ctx?.state === 'running') {
      isAudioReadyRef.current = true;
      setIsAudioReady(true);
    }

    // Mark as loaded after a short delay to allow preloading
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    // Cleanup function
    return () => {
      clearTimeout(timer);
      Object.values(sounds).forEach(sound => {
        if (sound) {
          sound.unload();
        }
      });
    };
  }, []); // Only initialize once

  // Register all relevant interaction sources to unlock audio as early as possible.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleUserInteraction = () => {
      const ctx = Howler.ctx;
      if (!ctx) return;

      if (ctx.state === 'running') {
        if (!isAudioReadyRef.current) {
          isAudioReadyRef.current = true;
          setIsAudioReady(true);
        }
        return;
      }

      if (ctx.state === 'suspended') {
        void ctx.resume()
          .then(() => {
            if (Howler.ctx?.state === 'running' && !isAudioReadyRef.current) {
              isAudioReadyRef.current = true;
              setIsAudioReady(true);
            }
          })
          .catch((e) => {
            console.error('Failed to resume audio context:', e);
          });
      }
    };

    window.addEventListener('pointerdown', handleUserInteraction);
    window.addEventListener('mousedown', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction, { passive: true });
    window.addEventListener('wheel', handleUserInteraction, { passive: true });
    window.addEventListener('keydown', handleUserInteraction);

    return () => {
      removeListenerSafely(window, 'pointerdown', handleUserInteraction);
      removeListenerSafely(window, 'mousedown', handleUserInteraction);
      removeListenerSafely(window, 'touchstart', handleUserInteraction);
      removeListenerSafely(window, 'wheel', handleUserInteraction);
      removeListenerSafely(window, 'keydown', handleUserInteraction);
    };
  }, []);

  // Update volumes when volume state changes
  useEffect(() => {
    if (!soundsRef.current) return;

    soundsRef.current.tick?.volume(volume * 0.4);
    soundsRef.current.paperPickup?.volume(volume * 0.6);
    soundsRef.current.paperPlace?.volume(volume * 0.6);
    soundsRef.current.paperCrumple?.volume(volume * 0.7);
    soundsRef.current.paperFall?.volume(volume * 0.6);
  }, [volume]);

  /**
   * Attempt to unlock/resume the Web Audio context from a user interaction.
   */
  const unlockAudio = useCallback(() => {
    if (typeof window === 'undefined') return;

    const ctx = Howler.ctx;
    if (!ctx) return;

    if (ctx.state === 'running') {
      if (!isAudioReadyRef.current) {
        isAudioReadyRef.current = true;
        setIsAudioReady(true);
      }
      return;
    }

    if (ctx.state === 'suspended') {
      void ctx.resume()
        .then(() => {
          if (Howler.ctx?.state === 'running' && !isAudioReadyRef.current) {
            isAudioReadyRef.current = true;
            setIsAudioReady(true);
          }
        })
        .catch((e) => {
          console.error('Failed to resume audio context:', e);
        });
    }
  }, []);

  /**
   * Play tick sound with optional velocity-based rate/pitch adjustment
   * @param velocity - Scroll velocity (0-1), affects playback rate
   */
  const playTick = useCallback((velocity: number = 0.5): boolean => {
    if (!isEnabled || !soundsRef.current.tick) return false;
    unlockAudio();
    
    // Throttle tick sounds to prevent audio spam
    const now = Date.now();
    if (now - lastTickTimeRef.current < TICK_THROTTLE_MS) {
      return false;
    }
    lastTickTimeRef.current = now;

    try {
      // Map velocity (0-1) to playback rate (0.8-1.4)
      // Faster scrolling = higher pitch/rate
      const normalizedVelocity = Math.max(0, Math.min(1, velocity));
      const rate = 0.8 + (normalizedVelocity * 0.6);
      
      soundsRef.current.tick.rate(rate);
      const soundId = soundsRef.current.tick.play();
      return typeof soundId === 'number';
    } catch (e) {
      console.error('Error playing tick sound:', e);
      return false;
    }
  }, [isEnabled, unlockAudio]);

  /**
   * Play paper pickup sound (for selecting notes from palette)
   */
  const playPaperPickup = useCallback(() => {
    if (!isEnabled || !soundsRef.current.paperPickup) return;
    unlockAudio();
    
    try {
      soundsRef.current.paperPickup.play();
    } catch (e) {
      console.error('Error playing paper pickup sound:', e);
    }
  }, [isEnabled, unlockAudio]);

  /**
   * Play paper place sound (for placing notes on canvas)
   */
  const playPaperPlace = useCallback(() => {
    if (!isEnabled || !soundsRef.current.paperPlace) return;
    unlockAudio();
    
    try {
      soundsRef.current.paperPlace.play();
    } catch (e) {
      console.error('Error playing paper place sound:', e);
    }
  }, [isEnabled, unlockAudio]);

  /**
   * Play paper crumple sound (for delete mode activation)
   */
  const playPaperCrumple = useCallback(() => {
    if (!isEnabled || !soundsRef.current.paperCrumple) return;
    unlockAudio();
    
    try {
      soundsRef.current.paperCrumple.play();
    } catch (e) {
      console.error('Error playing paper crumple sound:', e);
    }
  }, [isEnabled, unlockAudio]);

  /**
   * Play paper fall sound (for note deletion animation)
   */
  const playPaperFall = useCallback(() => {
    if (!isEnabled || !soundsRef.current.paperFall) return;
    unlockAudio();
    
    try {
      soundsRef.current.paperFall.play();
    } catch (e) {
      console.error('Error playing paper fall sound:', e);
    }
  }, [isEnabled, unlockAudio]);

  /**
   * Update volume for all sounds (0-1)
   */
  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    
    // Save to localStorage
    try {
      localStorage.setItem('sound-effects-volume', clampedVolume.toString());
    } catch (e) {
      console.error('Failed to save volume preference:', e);
    }
  }, []);

  /**
   * Enable or disable all sound effects
   */
  const setEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
    
    // Save to localStorage
    try {
      localStorage.setItem('sound-effects-enabled', enabled.toString());
    } catch (e) {
      console.error('Failed to save enabled preference:', e);
    }
  }, []);

  return {
    playTick,
    playPaperPickup,
    playPaperPlace,
    playPaperCrumple,
    playPaperFall,
    unlockAudio,
    setVolume,
    setEnabled,
    isEnabled,
    volume,
    isLoaded,
    isAudioReady,
  };
}
