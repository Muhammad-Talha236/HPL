import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getHomeGallery } from "../../media/services/mediaService";

const fallbackMoments = [
  { id: 1, title: "Match day in Hunza", image: "/images/moments/moment-1.jpg" },
  { id: 2, title: "The beautiful game", image: "/images/moments/moment-2.jpg" },
  { id: 3, title: "Football across the valley", image: "/images/moments/moment-3.jpg" },
  { id: 4, title: "Passion on the pitch", image: "/images/moments/moment-4.jpg" },
  { id: 5, title: "Hunza football moments", image: "/images/moments/moment-5.jpg" },
  { id: 6, title: "Game day", image: "/images/moments/moment-6.jpg" },
];

const AUTO_SCROLL_SPEED = 26;
const CONTROL_PAUSE_MS = 1100;

const ArrowLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
    <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
    <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const HPLMoments = () => {
  const [galleryMoments, setGalleryMoments] = useState(fallbackMoments);
  const [repeatCount, setRepeatCount] = useState(9);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const progressTrackRef = useRef(null);
  const progressRef = useRef(null);
  const cardRefs = useRef([]);
  const animationFrameRef = useRef(null);
  const startAnimationRef = useRef(() => {});
  const offsetRef = useRef(0);
  const loopWidthRef = useRef(0);
  const lastFrameRef = useRef(0);
  const pauseUntilRef = useRef(0);
  const isHoveredRef = useRef(false);
  const isDraggingRef = useRef(false);
  const isVisibleRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const dragRef = useRef(null);
  const repeatCountRef = useRef(repeatCount);
  const repeatedMoments = useMemo(
    () => Array.from({ length: repeatCount }, () => galleryMoments).flat(),
    [galleryMoments, repeatCount],
  );

  useEffect(() => {
    repeatCountRef.current = repeatCount;
  }, [repeatCount]);

  useEffect(() => {
    let mounted = true;
    getHomeGallery()
      .then((response) => {
        const managedMoments = (response.data || []).map((item) => ({
          id: item.gallery_item_id,
          title: item.media.title || item.media.alt_text || "Hunza Premier League moment",
          image: item.media.secure_url,
        }));
        if (mounted && managedMoments.length) setGalleryMoments(managedMoments);
      })
      .catch(() => {
        // Existing local gallery images remain a backwards-compatible fallback.
      });
    return () => { mounted = false; };
  }, []);

  const getMetrics = useCallback(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const firstCard = cardRefs.current[0];

    if (!viewport || !track || !firstCard) return null;

    const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 12;
    const cardWidth = firstCard.offsetWidth;

    return {
      cardWidth,
      viewportWidth: viewport.clientWidth,
      step: cardWidth + gap,
      loopWidth: galleryMoments.length * (cardWidth + gap),
    };
  }, [galleryMoments.length]);

  const ensureTrackCoverage = useCallback((metrics) => {
    if (!metrics?.loopWidth) return repeatCountRef.current;

    // Keep at least one complete sequence on both sides of the visible
    // sequence. This is essential when a gallery contains only one or two
    // images, where a fixed three-copy track is narrower than the viewport.
    const desiredCount = Math.max(7, Math.ceil(metrics.viewportWidth / metrics.loopWidth) * 2 + 5);
    if (desiredCount !== repeatCountRef.current) {
      repeatCountRef.current = desiredCount;
      setRepeatCount(desiredCount);
    }
    return desiredCount;
  }, []);

  const normaliseOffset = useCallback((loopWidth) => {
    if (!loopWidth) return;

    // The viewport always follows the middle copy. Crossing either sequence
    // boundary swaps it for an identical neighbour, making the reset invisible.
    const anchorCopy = Math.floor(repeatCountRef.current / 2);
    const upperBoundary = -anchorCopy * loopWidth;
    const lowerBoundary = -(anchorCopy + 1) * loopWidth;
    while (offsetRef.current >= upperBoundary) offsetRef.current -= loopWidth;
    while (offsetRef.current < lowerBoundary) offsetRef.current += loopWidth;
  }, []);

  const applyLayout = useCallback(() => {
    const metrics = getMetrics();
    const track = trackRef.current;

    if (!metrics || !track) return;

    loopWidthRef.current = metrics.loopWidth;
    normaliseOffset(metrics.loopWidth);
    track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;

    cardRefs.current.forEach((card, index) => {
      if (!card) return;

      const cardCenter = index * metrics.step + metrics.cardWidth / 2 + offsetRef.current;
      const relativePosition = (cardCenter - metrics.viewportWidth / 2) / (metrics.viewportWidth / 2);
      const curveStrength = Math.min(1, Math.abs(relativePosition));
      const rotation = -relativePosition * 5.5;
      const verticalOffset = curveStrength * 31;

      card.style.transform = `translate3d(0, ${verticalOffset}px, 0) rotate(${rotation}deg)`;
    });

    const progressTrack = progressTrackRef.current;
    const progress = progressRef.current;

    if (progressTrack && progress && metrics.loopWidth) {
      const cycleProgress = ((offsetRef.current % metrics.loopWidth) + metrics.loopWidth) % metrics.loopWidth;
      const activeWidth = progress.offsetWidth;
      const travelDistance = Math.max(0, progressTrack.clientWidth - activeWidth);
      progress.style.transform = `translateX(${(cycleProgress / metrics.loopWidth) * travelDistance}px)`;
    }
  }, [getMetrics, normaliseOffset]);

  const resetLayout = useCallback(() => {
    const metrics = getMetrics();

    if (!metrics) return;

    loopWidthRef.current = metrics.loopWidth;
    const copies = ensureTrackCoverage(metrics);
    const anchorCopy = Math.floor(copies / 2);
    // Preserve the existing partial-card framing without starting at a seam.
    offsetRef.current = -anchorCopy * metrics.loopWidth - Math.min(metrics.viewportWidth * 0.1, metrics.loopWidth * 0.5);
    normaliseOffset(metrics.loopWidth);
    applyLayout();
  }, [applyLayout, ensureTrackCoverage, getMetrics, normaliseOffset]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mediaQuery.matches;

    const stopAnimation = () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    const tick = (timestamp) => {
      animationFrameRef.current = null;

      if (!isVisibleRef.current) return;

      if (!lastFrameRef.current) lastFrameRef.current = timestamp;
      const elapsed = Math.min(64, timestamp - lastFrameRef.current);
      lastFrameRef.current = timestamp;

      const shouldMove =
        !reducedMotionRef.current &&
        !isHoveredRef.current &&
        !isDraggingRef.current &&
        timestamp >= pauseUntilRef.current;

      if (shouldMove && loopWidthRef.current) {
        offsetRef.current += (AUTO_SCROLL_SPEED * elapsed) / 1000;
      }

      applyLayout();
      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    const startAnimation = () => {
      if (!animationFrameRef.current && isVisibleRef.current) {
        lastFrameRef.current = 0;
        animationFrameRef.current = window.requestAnimationFrame(tick);
      }
    };

    startAnimationRef.current = startAnimation;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;

        if (entry.isIntersecting) startAnimation();
        else stopAnimation();
      },
      { threshold: 0.08 },
    );

    const handleMotionPreference = (event) => {
      reducedMotionRef.current = event.matches;
      applyLayout();
      startAnimation();
    };

    const resizeObserver = new ResizeObserver(() => resetLayout());

    observer.observe(viewport);
    resizeObserver.observe(viewport);
    mediaQuery.addEventListener("change", handleMotionPreference);
    window.requestAnimationFrame(resetLayout);

    return () => {
      stopAnimation();
      observer.disconnect();
      resizeObserver.disconnect();
      mediaQuery.removeEventListener("change", handleMotionPreference);
      startAnimationRef.current = () => {};
    };
  }, [applyLayout, resetLayout]);

  const moveGallery = useCallback(
    (direction) => {
      const metrics = getMetrics();
      if (!metrics) return;

      offsetRef.current += direction * metrics.step * 0.8;
      normaliseOffset(metrics.loopWidth);
      pauseUntilRef.current = performance.now() + CONTROL_PAUSE_MS;
      applyLayout();
      startAnimationRef.current();
    },
    [applyLayout, getMetrics, normaliseOffset],
  );

  const handlePointerDown = (event) => {
    if (!viewportRef.current) return;

    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startOffset: offsetRef.current };
    isDraggingRef.current = true;
    viewportRef.current.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    offsetRef.current = drag.startOffset + event.clientX - drag.startX;
    normaliseOffset(loopWidthRef.current);
    applyLayout();
  };

  const finishDrag = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    dragRef.current = null;
    isDraggingRef.current = false;
    pauseUntilRef.current = performance.now() + 750;
    viewportRef.current?.releasePointerCapture?.(event.pointerId);
    startAnimationRef.current();
  };

  return (
    <section id="hpl-gallery" className="scroll-mt-24 overflow-hidden bg-[#FCFEFD] py-12 text-[#101828] sm:py-14 lg:py-16">
      <div className="mx-auto max-w-[1500px]">
        <header className="mx-auto max-w-2xl px-5 text-center sm:px-6">
          <div className="flex items-center justify-center gap-3 text-[13px] font-bold uppercase tracking-[0.2em] text-[#07864D]">
            <span className="h-px w-12 bg-[#07864D]/65" aria-hidden="true" />
            HPL Gallery
            <span className="h-px w-12 bg-[#07864D]/65" aria-hidden="true" />
          </div>
          <h2 id="hpl-gallery-heading" className="mt-3 text-[32px] font-extrabold leading-[1.08] tracking-[-0.045em] text-[#070E3B] sm:text-[42px] lg:text-[46px]">
            Moments <span className="text-[#07864D]">That Inspire</span>
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[#526078] sm:text-base">
            From thrilling matches to passionate fans, explore the moments that make Hunza Premier League special.
          </p>
        </header>

        <div
          ref={viewportRef}
          className="mt-6 h-[235px] cursor-grab overflow-hidden select-none touch-pan-y active:cursor-grabbing sm:mt-8 sm:h-[260px] lg:h-[278px]"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse") isHoveredRef.current = true;
          }}
          onPointerLeave={(event) => {
            if (event.pointerType === "mouse") isHoveredRef.current = false;
            finishDrag(event);
          }}
          aria-labelledby="hpl-gallery-heading"
        >
          <div ref={trackRef} className="flex w-max gap-3 px-3 will-change-transform sm:px-4">
            {repeatedMoments.map((moment, index) => (
              <article
                key={`${moment.id}-${index}`}
                ref={(element) => {
                  cardRefs.current[index] = element;
                }}
                aria-hidden={Math.floor(index / galleryMoments.length) !== Math.floor(repeatCount / 2)}
                className="group h-[170px] w-[220px] flex-none overflow-hidden rounded-xl bg-[#E7EFEB] shadow-[0_13px_27px_rgba(9,39,29,0.13)] will-change-transform sm:h-[195px] sm:w-[260px] lg:h-[220px] lg:w-[290px]"
              >
                <img
                  src={moment.image}
                  alt={index >= galleryMoments.length && index < galleryMoments.length * 2 ? moment.title : ""}
                  width="580"
                  height="440"
                  loading="lazy"
                  draggable="false"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                />
              </article>
            ))}
          </div>
        </div>

        <div className="mx-auto grid max-w-[960px] grid-cols-[auto_1fr_auto] items-center gap-5 px-5 sm:px-6">
          <button
            type="button"
            onClick={() => moveGallery(-1)}
            aria-label="Show previous gallery images"
            className="grid h-10 w-10 place-items-center rounded-full bg-[#E5F7EE] text-[#07864D] transition hover:bg-[#D3F0E1] focus:outline-none focus:ring-2 focus:ring-[#07864D]/30"
          >
            <ArrowLeft />
          </button>

          <div ref={progressTrackRef} className="relative mx-auto h-1 w-24 overflow-hidden rounded-full bg-[#DDE8E2]" aria-hidden="true">
            <span ref={progressRef} className="absolute inset-y-0 left-0 w-8 rounded-full bg-[#07864D] will-change-transform" />
          </div>

          <button
            type="button"
            onClick={() => moveGallery(1)}
            aria-label="Show next gallery images"
            className="grid h-10 w-10 place-items-center rounded-full bg-[#E5F7EE] text-[#07864D] transition hover:bg-[#D3F0E1] focus:outline-none focus:ring-2 focus:ring-[#07864D]/30"
          >
            <ArrowRight />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HPLMoments;
