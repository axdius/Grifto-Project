"use client";

import { memo, useCallback, useEffect, useState, type ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import type { ThemeSection } from "@grifto/contracts";
import type { ThemeBannerSlide, ThemeRenderContext } from "./index";
import { getSetting } from "./settings";

/**
 * hero_carousel section: slides come from CMS banner entries via context
 * (admin manages them today; the future backend serves the same shape).
 * One slide renders statically; 2+ get autoplay, loop, arrows and dots.
 */

const MAX_SLIDES = 4;

const heightClasses: Record<string, string> = {
  compact: "h-[300px] sm:h-[360px]",
  standard: "h-[380px] sm:h-[460px] lg:h-[520px]",
  tall: "h-[460px] sm:h-[560px] lg:h-[640px]",
};

function SlideContent({
  slide,
  showOverlay,
  context,
}: {
  slide: ThemeBannerSlide;
  showOverlay: boolean;
  context: ThemeRenderContext;
}) {
  const Link = context.LinkComponent;
  const Image = context.ImageComponent;

  const cta =
    slide.ctaLabel && slide.ctaHref ? (
      Link ? (
        <Link
          href={slide.ctaHref}
          className="inline-flex h-11 items-center rounded-lg bg-white px-6 text-sm font-semibold text-neutral-900 hover:bg-neutral-100"
        >
          {slide.ctaLabel}
        </Link>
      ) : (
        <a
          href={slide.ctaHref}
          className="inline-flex h-11 items-center rounded-lg bg-white px-6 text-sm font-semibold text-neutral-900 hover:bg-neutral-100"
        >
          {slide.ctaLabel}
        </a>
      )
    ) : null;

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Background: image when provided, brand gradient fallback otherwise. */}
      {slide.imageUrl ? (
        Image ? (
          <Image src={slide.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <img
            src={slide.imageUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-brand-600 to-gold-500" />
      )}
      {showOverlay ? <div className="absolute inset-0 bg-neutral-900/40" /> : null}

      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col items-center justify-center gap-4 px-4 text-center sm:gap-6 sm:px-6">
        {slide.title ? (
          <h2 className="font-display max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {slide.title}
          </h2>
        ) : null}
        {slide.body ? (
          <p className="max-w-xl text-base text-white/90 sm:text-lg">{slide.body}</p>
        ) : null}
        {cta}
      </div>
    </div>
  );
}

const MemoSlideContent = memo(SlideContent);

function ArrowButton({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={direction === "prev" ? "Previous slide" : "Next slide"}
      onClick={onClick}
      className={`absolute top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 text-neutral-800 shadow-sm backdrop-blur hover:bg-white sm:block ${
        direction === "prev" ? "left-4" : "right-4"
      }`}
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="size-5">
        {direction === "prev" ? (
          <path
            fillRule="evenodd"
            d="M12.78 4.22a.75.75 0 010 1.06L8.06 10l4.72 4.72a.75.75 0 11-1.06 1.06l-5.25-5.25a.75.75 0 010-1.06l5.25-5.25a.75.75 0 011.06 0z"
            clipRule="evenodd"
          />
        ) : (
          <path
            fillRule="evenodd"
            d="M7.22 4.22a.75.75 0 011.06 0l5.25 5.25a.75.75 0 010 1.06l-5.25 5.25a.75.75 0 01-1.06-1.06L11.94 10 7.22 5.28a.75.75 0 010-1.06z"
            clipRule="evenodd"
          />
        )}
      </svg>
    </button>
  );
}

function MultiSlideCarousel({
  slides,
  autoplayDelayMs,
  showOverlay,
  heightClass,
  context,
}: {
  slides: ThemeBannerSlide[];
  autoplayDelayMs: number;
  showOverlay: boolean;
  heightClass: string;
  context: ThemeRenderContext;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    // stopOnInteraction: false → autoplay resumes after drag / mouse leave.
    Autoplay({ delay: autoplayDelayMs, stopOnInteraction: false, stopOnMouseEnter: true }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  return (
    <div className="relative" role="region" aria-roledescription="carousel" aria-label="Highlights">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex touch-pan-y">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`min-w-0 flex-[0_0_100%] ${heightClass}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${index + 1} of ${slides.length}`}
            >
              <MemoSlideContent slide={slide} showOverlay={showOverlay} context={context} />
            </div>
          ))}
        </div>
      </div>

      <ArrowButton direction="prev" onClick={scrollPrev} />
      <ArrowButton direction="next" onClick={scrollNext} />

      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            aria-current={selectedIndex === index}
            onClick={() => scrollTo(index)}
            className={`size-2.5 rounded-full transition-colors ${
              selectedIndex === index ? "bg-white" : "bg-white/50 hover:bg-white/75"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function HeroCarousel({
  section,
  context,
}: {
  section: ThemeSection;
  context: ThemeRenderContext;
}): ReactNode {
  const autoplayDelayMs = getSetting<number>(section, "autoplayDelayMs");
  const showOverlay = getSetting<boolean>(section, "showOverlay");
  const heightVariant = getSetting<string>(section, "heightVariant");
  const heightClass = heightClasses[heightVariant] ?? heightClasses.standard!;

  const slides = (context.banners ?? []).slice(0, MAX_SLIDES);

  if (slides.length === 0) {
    return (
      <section className={`flex items-center justify-center bg-neutral-100 ${heightClass}`}>
        <p className="text-sm text-neutral-400">No published banners — add them in the CMS.</p>
      </section>
    );
  }

  if (slides.length === 1) {
    // Single banner: static, no autoplay/arrows/dots.
    return (
      <section className={heightClass}>
        <SlideContent slide={slides[0]!} showOverlay={showOverlay} context={context} />
      </section>
    );
  }

  return (
    <section>
      <MultiSlideCarousel
        slides={slides}
        autoplayDelayMs={autoplayDelayMs}
        showOverlay={showOverlay}
        heightClass={heightClass}
        context={context}
      />
    </section>
  );
}
