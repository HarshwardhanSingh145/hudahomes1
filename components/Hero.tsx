'use client';

import React, { useLayoutEffect, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Hero Video URL — Fixed directly to the new Huda Homes marble handicrafts ad video
export const HERO_VIDEO_URL =
  'https://res.cloudinary.com/xmjcgopt/video/upload/v1792218252/Huda_Homes_marble_handicrafts_ad__20261017114316.mp4';

// Prepared frame-accurate reverse video asset and frame-0 poster
const PREPARED_REVERSE_VIDEO_URL =
  'https://res.cloudinary.com/xmjcgopt/video/upload/e_reverse/v1792218252/Huda_Homes_marble_handicrafts_ad__20261017114316.mp4';
const PREPARED_POSTER_URL =
  'https://res.cloudinary.com/xmjcgopt/video/upload/so_0/v1792218252/Huda_Homes_marble_handicrafts_ad__20261017114316.jpg';
const FALLBACK_FORWARD_VIDEO_URL = '/videos/huda-hero-forward.mp4';

const PLAYBACK_SPEED = 0.8; // 80% normal speed in both forward and reverse

type PlaybackState = 'INITIALIZING' | 'FORWARD' | 'REVERSE' | 'PAUSED';

// Isomorphic layout effect to run safely in Next.js without SSR warnings
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function Hero() {
  const heroContainerRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const brandTagRef = useRef<HTMLSpanElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const slabRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);

  const forwardVideoRef = useRef<HTMLVideoElement>(null);
  const reverseVideoRef = useRef<HTMLVideoElement>(null);

  const [forwardSrc, setForwardSrc] = useState<string>(HERO_VIDEO_URL);
  const [activePhase, setActivePhase] = useState<'FORWARD' | 'REVERSE'>('FORWARD');
  const [videoError, setVideoError] = useState<boolean>(false);

  const isDefaultCloudinaryVideo = true;

  const words = ['Surface', 'Your', 'Vision.'];

  // GSAP Word-by-Word Reveal + ScrollTrigger Replay
  useIsomorphicLayoutEffect(() => {
    const container = heroContainerRef.current;
    if (!container) return;

    if (typeof window !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }

    const ctx = gsap.context(() => {
      const wordElements = container.querySelectorAll('.hero-word');
      const brandTag = container.querySelector('.hero-brand-tag');
      const subtitle = container.querySelector('.hero-subtitle-bright');
      const plate = container.querySelector('.hero-plate-container');

      const setInitialStates = () => {
        gsap.set(wordElements, {
          opacity: 0,
          y: 45,
          scale: 0.92,
          filter: 'blur(10px)',
        });

        if (brandTag) {
          gsap.set(brandTag, { opacity: 0, y: 14 });
        }

        if (subtitle) {
          gsap.set(subtitle, { opacity: 0, y: 18 });
        }

        if (plate) {
          gsap.set(plate, { opacity: 0, scale: 0.94, y: 24 });
        }
      };

      setInitialStates();

      const tl = gsap.timeline({
        paused: true,
      });

      if (brandTag) {
        tl.to(brandTag, {
          opacity: 1,
          y: 0,
          duration: 0.65,
          ease: 'power2.out',
        });
      }

      tl.to(
        wordElements,
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: 1.25,
          stagger: 0.42,
          ease: 'power3.out',
        },
        brandTag ? '-=0.15' : 0
      );

      if (subtitle) {
        tl.to(
          subtitle,
          {
            opacity: 1,
            y: 0,
            duration: 0.85,
            ease: 'power2.out',
          },
          '-=0.35'
        );
      }

      if (plate) {
        tl.to(
          plate,
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 1.15,
            ease: 'power2.out',
          },
          0.45
        );
      }

      ScrollTrigger.create({
        trigger: container,
        start: 'top 85%',
        end: 'bottom 15%',
        onEnter: () => {
          tl.restart();
        },
        onEnterBack: () => {
          tl.restart();
        },
        onLeave: () => {
          tl.pause(0);
          setInitialStates();
        },
        onLeaveBack: () => {
          tl.pause(0);
          setInitialStates();
        },
      });

      if (typeof window !== 'undefined' && window.scrollY < window.innerHeight * 0.8) {
        tl.restart();
      }
    }, container);

    return () => ctx.revert();
  }, []);

  // Deterministic State Machine: INITIALIZING -> FORWARD (0.8x from t=0) -> REVERSE (0.8x to t=0) -> FORWARD
  useEffect(() => {
    const fwdVideo = forwardVideoRef.current;
    const revVideo = reverseVideoRef.current;
    const plateEl = plateRef.current;

    if (!fwdVideo) return;

    let state: PlaybackState = 'INITIALIZING';
    let lastActiveDirection: 'FORWARD' | 'REVERSE' = 'FORWARD';
    let isInViewport = true;
    let isUnmounted = false;
    let reverseFallbackRafId: number | null = null;
    let reverseFallbackLastTs: number | null = null;
    let reverseVirtualTime = 0;

    const cancelFallbackRaf = () => {
      if (reverseFallbackRafId !== null) {
        cancelAnimationFrame(reverseFallbackRafId);
        reverseFallbackRafId = null;
      }
      reverseFallbackLastTs = null;
    };

    const applyPlaybackSpeed = (videoEl: HTMLVideoElement) => {
      videoEl.defaultPlaybackRate = PLAYBACK_SPEED;
      if (Math.abs(videoEl.playbackRate - PLAYBACK_SPEED) > 0.01) {
        videoEl.playbackRate = PLAYBACK_SPEED;
      }
    };

    // 1. Start Forward Playback strictly from timestamp 0 at 0.8x speed
    const enterForwardPhase = () => {
      if (isUnmounted || !fwdVideo) return;
      cancelFallbackRaf();

      if (revVideo && !revVideo.paused) {
        revVideo.pause();
      }
      if (revVideo) {
        try {
          revVideo.currentTime = 0;
        } catch {
          // ignore if reverse metadata not yet ready
        }
      }

      state = 'FORWARD';
      lastActiveDirection = 'FORWARD';
      setActivePhase('FORWARD');

      try {
        fwdVideo.currentTime = 0;
      } catch {
        // ignore transient seek state
      }

      applyPlaybackSpeed(fwdVideo);

      if (isInViewport) {
        const p = fwdVideo.play();
        if (p !== undefined) {
          p.catch(() => {
            // Autoplay blocked or interrupted
          });
        }
      }
    };

    // Fallback rAF stepping if a custom third-party URL without a prepared reverse asset is used
    const stepCustomUrlReverse = (timestamp: number) => {
      if (isUnmounted || !fwdVideo || state !== 'REVERSE') return;

      if (!isInViewport) {
        reverseFallbackLastTs = null;
        reverseFallbackRafId = requestAnimationFrame(stepCustomUrlReverse);
        return;
      }

      if (reverseFallbackLastTs === null) {
        reverseFallbackLastTs = timestamp;
        reverseVirtualTime = fwdVideo.currentTime;
      }

      const elapsed = (timestamp - reverseFallbackLastTs) / 1000;
      reverseFallbackLastTs = timestamp;
      reverseVirtualTime -= elapsed * PLAYBACK_SPEED;

      if (reverseVirtualTime <= 0.04) {
        enterForwardPhase();
        return;
      }

      if (!fwdVideo.seeking) {
        try {
          fwdVideo.currentTime = Math.max(0, reverseVirtualTime);
        } catch {
          // ignore transient seek state
        }
      }

      reverseFallbackRafId = requestAnimationFrame(stepCustomUrlReverse);
    };

    // 2. Start Reverse Playback ONLY after Forward reaches the end
    const enterReversePhase = () => {
      if (isUnmounted || state === 'REVERSE') return;
      cancelFallbackRaf();

      fwdVideo.pause();
      state = 'REVERSE';
      lastActiveDirection = 'REVERSE';

      // Use prepared frame-accurate reverse video asset when available
      if (isDefaultCloudinaryVideo && revVideo && revVideo.readyState >= 1) {
        setActivePhase('REVERSE');
        try {
          revVideo.currentTime = 0;
        } catch {
          // ignore transient seek state
        }
        applyPlaybackSpeed(revVideo);

        if (isInViewport) {
          const p = revVideo.play();
          if (p !== undefined) {
            p.catch(() => {
              // Fallback to rAF stepping if reverse video play fails
              setActivePhase('FORWARD');
              reverseVirtualTime =
                Number.isFinite(fwdVideo.duration) && fwdVideo.duration > 0
                  ? fwdVideo.duration
                  : fwdVideo.currentTime;
              reverseFallbackLastTs = null;
              reverseFallbackRafId = requestAnimationFrame(stepCustomUrlReverse);
            });
          }
        }
      } else {
        // Custom external video fallback
        setActivePhase('FORWARD');
        reverseVirtualTime =
          Number.isFinite(fwdVideo.duration) && fwdVideo.duration > 0
            ? fwdVideo.duration
            : fwdVideo.currentTime;
        reverseFallbackLastTs = null;
        reverseFallbackRafId = requestAnimationFrame(stepCustomUrlReverse);
      }
    };

    // Initialize metadata and start strictly in FORWARD at t = 0
    const handleForwardLoadedMetadata = () => {
      if (isUnmounted || !fwdVideo) return;

      applyPlaybackSpeed(fwdVideo);

      if (state === 'INITIALIZING') {
        enterForwardPhase();
      }
    };

    const handleForwardRateChange = () => {
      if (state === 'FORWARD') {
        applyPlaybackSpeed(fwdVideo);
      }
    };

    const handleReverseRateChange = () => {
      if (state === 'REVERSE' && revVideo) {
        applyPlaybackSpeed(revVideo);
      }
    };

    // Switch to REVERSE only when FORWARD playback genuinely reaches its end
    const handleForwardEnded = () => {
      if (state !== 'FORWARD') return;
      enterReversePhase();
    };

    // Switch back to FORWARD only when REVERSE playback reaches the beginning (end of reversed stream)
    const handleReverseEnded = () => {
      if (state !== 'REVERSE') return;
      enterForwardPhase();
    };

    // Pause active stream when scrolled out of view without corrupting direction state
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        isInViewport = entry.isIntersecting;

        if (!isInViewport) {
          if (state === 'FORWARD' || state === 'REVERSE') {
            lastActiveDirection = state;
            state = 'PAUSED';
            fwdVideo.pause();
            if (revVideo) revVideo.pause();
          }
        } else {
          if (state === 'PAUSED') {
            state = lastActiveDirection;
            if (state === 'FORWARD') {
              applyPlaybackSpeed(fwdVideo);
              fwdVideo.play().catch(() => {});
            } else if (state === 'REVERSE' && isDefaultCloudinaryVideo && revVideo) {
              applyPlaybackSpeed(revVideo);
              revVideo.play().catch(() => {});
            }
          }
        }
      },
      { threshold: 0.05 }
    );

    if (plateEl) {
      observer.observe(plateEl);
    }

    fwdVideo.addEventListener('loadedmetadata', handleForwardLoadedMetadata);
    fwdVideo.addEventListener('ratechange', handleForwardRateChange);
    fwdVideo.addEventListener('ended', handleForwardEnded);

    if (revVideo) {
      revVideo.addEventListener('ratechange', handleReverseRateChange);
      revVideo.addEventListener('ended', handleReverseEnded);
    }

    // If metadata is already cached by the browser on mount, initialize immediately
    if (fwdVideo.readyState >= 1) {
      handleForwardLoadedMetadata();
    }

    return () => {
      isUnmounted = true;
      cancelFallbackRaf();
      observer.disconnect();
      fwdVideo.removeEventListener('loadedmetadata', handleForwardLoadedMetadata);
      fwdVideo.removeEventListener('ratechange', handleForwardRateChange);
      fwdVideo.removeEventListener('ended', handleForwardEnded);
      if (revVideo) {
        revVideo.removeEventListener('ratechange', handleReverseRateChange);
        revVideo.removeEventListener('ended', handleReverseEnded);
      }
    };
  }, [forwardSrc, isDefaultCloudinaryVideo]);

  // Instant Word-by-Word Magnifying Zoom on Cursor / Touch Proximity (No squeezing or stretching)
  const handlePointerProximity = (clientX: number, clientY: number) => {
    if (!headlineRef.current) return;
    const wordElements = headlineRef.current.querySelectorAll<HTMLElement>('.hero-word');

    wordElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);
      const radius = 180;

      if (dist < radius) {
        const factor = 1 - dist / radius;
        const uniformZoom = 1 + factor * 0.24;

        gsap.to(el, {
          scale: uniformZoom,
          scaleX: uniformZoom,
          scaleY: uniformZoom,
          rotationX: 0,
          rotationY: 0,
          z: 0,
          duration: 0.14,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      } else {
        gsap.to(el, {
          scale: 1,
          scaleX: 1,
          scaleY: 1,
          rotationX: 0,
          rotationY: 0,
          z: 0,
          duration: 0.25,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      }
    });
  };

  const handlePointerReset = () => {
    if (!headlineRef.current) return;
    const wordElements = headlineRef.current.querySelectorAll<HTMLElement>('.hero-word');
    gsap.to(wordElements, {
      scale: 1,
      scaleX: 1,
      scaleY: 1,
      rotationX: 0,
      rotationY: 0,
      z: 0,
      duration: 0.28,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  };

  return (
    <section
      ref={heroContainerRef}
      className="hero-background flex flex-col justify-center min-h-[100svh] pt-28 md:pt-32 pb-16 px-6 md:px-16 relative select-none"
    >
      {/* 3D Volumetric Living Gradient Canvas — Seamless organic depth */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Layer 1: Smooth 8-tone vertical shift foundation */}
        <div className="hero-gradient-layer-base absolute -inset-[15%]" />

        {/* Layer 2: 3D Volumetric floating color spheres */}
        <div className="hero-gradient-layer-3d-spheres absolute -inset-[20%]" />

        {/* Layer 3: 3D Ambient specular light sheen and depth */}
        <div className="hero-gradient-layer-3d-depth absolute -inset-[15%]" />

        {/* Layer 4: Fast Ambient Dynamic Color Orbit */}
        <div className="hero-gradient-layer-fast-orbit absolute -inset-[20%]" />

        {/* Subtle architectural ambient contrast vignette for supreme text clarity */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 70% at 25% 45%, rgba(15, 8, 12, 0.22) 0%, rgba(15, 8, 12, 0.08) 50%, transparent 75%)',
          }}
        />

        {/* Ambient tactile grain overlay */}
        <div
          className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Main Content Area — Minimal, Airy, High-Contrast Typography & Uncropped Full-Frame Video Plate */}
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-14 z-10 my-auto relative">
        {/* Left Column: Brand & Instant Word-Zoom Headline with Magnifying Glass Cursor */}
        <div
          className="w-full lg:w-1/2 flex flex-col items-start text-left max-w-xl hero-magnify-zone"
          onMouseMove={(e) => handlePointerProximity(e.clientX, e.clientY)}
          onMouseLeave={handlePointerReset}
          onTouchMove={(e) => {
            if (e.touches[0]) {
              handlePointerProximity(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          onTouchEnd={handlePointerReset}
        >
          {/* Subtle Brand Tag — Pure White, Semibold */}
          <span
            ref={brandTagRef}
            className="hero-brand-tag text-xs uppercase tracking-[0.34em] font-semibold text-white mb-5 drop-shadow-sm select-none"
          >
            HUDA HOMES
          </span>

          {/* Word-by-word reveal headline + instant uniform word zoom & magnifying glass cursor */}
          <h1
            ref={headlineRef}
            className="hero-headline text-balance select-none py-1 hero-magnify-zone"
            aria-label="Surface Your Vision."
          >
            {words.map((word, index) => (
              <React.Fragment key={`${word}-${index}`}>
                <span
                  className="hero-word"
                  aria-hidden="true"
                  onMouseEnter={(e) => {
                    gsap.to(e.currentTarget, {
                      scale: 1.24,
                      scaleX: 1.24,
                      scaleY: 1.24,
                      rotationX: 0,
                      rotationY: 0,
                      z: 0,
                      duration: 0.14,
                      ease: 'power2.out',
                      overwrite: 'auto',
                    });
                  }}
                  onMouseLeave={(e) => {
                    gsap.to(e.currentTarget, {
                      scale: 1,
                      scaleX: 1,
                      scaleY: 1,
                      rotationX: 0,
                      rotationY: 0,
                      z: 0,
                      duration: 0.22,
                      ease: 'power2.out',
                      overwrite: 'auto',
                    });
                  }}
                >
                  {word}
                </span>
                {index < words.length - 1 ? ' ' : ''}
              </React.Fragment>
            ))}
          </h1>

          {/* Short Subtitle — Bright White, High Readability */}
          <p
            ref={subtitleRef}
            className="hero-subtitle-bright mt-6 md:mt-8 text-base sm:text-lg md:text-xl tracking-[0.06em] leading-relaxed select-none"
          >
            Marble. Stone. Timeless Design.
          </p>
        </div>

        {/* Right Column: Hero Glassmorphism Plate with Original Aspect Ratio */}
        <div
          ref={slabRef}
          className="hero-plate-container w-full lg:w-1/2 flex flex-col items-center lg:items-end justify-center relative"
        >
          <div
            ref={plateRef}
            className="hero-product-plate"
          >
            {!videoError ? (
              <>
                {/* Forward Video Stream (Starts at 0s, plays forward at 0.8x to end) */}
                <video
                  ref={forwardVideoRef}
                  src={forwardSrc}
                  poster={PREPARED_POSTER_URL}
                  className={`w-full h-full object-cover object-center block m-0 p-0 select-none pointer-events-none transition-opacity duration-75 ${
                    activePhase === 'FORWARD' ? 'opacity-100 relative z-10' : 'opacity-0 absolute inset-0 z-0'
                  }`}
                  muted
                  playsInline
                  preload="auto"
                  disablePictureInPicture
                  controls={false}
                  onError={() => {
                    if (forwardSrc !== FALLBACK_FORWARD_VIDEO_URL) {
                      setForwardSrc(FALLBACK_FORWARD_VIDEO_URL);
                    } else {
                      setVideoError(true);
                    }
                  }}
                />

                {/* Prepared Frame-Accurate Reverse Video Stream (Plays backward from end to 0s at 0.8x) */}
                {isDefaultCloudinaryVideo && (
                  <video
                    ref={reverseVideoRef}
                    src={PREPARED_REVERSE_VIDEO_URL}
                    className={`w-full h-full object-cover object-center block m-0 p-0 select-none pointer-events-none transition-opacity duration-75 ${
                      activePhase === 'REVERSE' ? 'opacity-100 relative z-10' : 'opacity-0 absolute inset-0 z-0'
                    }`}
                    muted
                    playsInline
                    preload="auto"
                    disablePictureInPicture
                    controls={false}
                  />
                )}
              </>
            ) : (
              <div
                className="w-full h-full bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url("${PREPARED_POSTER_URL}")`,
                }}
                role="img"
                aria-label="HUDA HOMES Architectural Marble Surface"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
