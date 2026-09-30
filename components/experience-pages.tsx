"use client";

import { useEffect, useRef, useState } from "react";
import type { ComponentProps, CSSProperties } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Volume2, VolumeX } from "lucide-react";
import { ExperienceScene } from "@/components/experience-scene";
import {
  defaultContent,
  getSessionOverrides,
  luxuryGallery,
  missions,
  navItems,
  planets,
  resolveContent,
  sitePages,
} from "@/lib/content";

function useScrollDirector() {
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;
    let max = Math.max(1, root.scrollHeight - window.innerHeight);
    const refreshBounds = () => {
      max = Math.max(1, root.scrollHeight - window.innerHeight);
      update();
    };
    const update = () => {
      root.style.setProperty("--scroll-y", `${window.scrollY}px`);
      root.style.setProperty(
        "--scroll-progress",
        `${Math.min(1, window.scrollY / max)}`,
      );
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", refreshBounds);
    window.addEventListener("load", refreshBounds, { once: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", refreshBounds);
    };
  }, []);
}

function useElementProgress() {
  const ref = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = node.getBoundingClientRect();
      const span = Math.max(1, rect.height - window.innerHeight);
      const next = Math.max(0, Math.min(1, -rect.top / span));
      progressRef.current = next;
      node.style.setProperty("--element-progress", next.toFixed(4));
      if (node.classList.contains("space-journey"))
        node.style.setProperty("--journey-progress", next.toFixed(4));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return { ref, progressRef };
}

function LazyVideo({
  className,
  src,
  poster,
  label,
}: {
  className: string;
  src: string;
  poster?: string;
  label?: string;
}) {
  const holder = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const node = holder.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) {
      setActive(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          node.play().catch(() => {});
        } else {
          node.pause();
        }
      },
      { rootMargin: "320px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <video
      ref={holder}
      className={className}
      autoPlay
      muted
      loop
      playsInline
      preload={active ? "metadata" : "none"}
      poster={poster}
      aria-label={label}
    >
      {active && <source src={src} type="video/mp4" />}
    </video>
  );
}

function CreativeLoader({ theme }: { theme: "luxury" | "space" }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    // Do not hold the first paint hostage to remote videos/images. The old loader
    // waited for `window.load`, which made a slow media request feel like a frozen site.
    const timer = window.setTimeout(() => setDone(true), 680);
    return () => window.clearTimeout(timer);
  }, []);
  if (done) return null;
  return (
    <div
      className={`experience-loader experience-loader-${theme}`}
      aria-hidden="true"
    >
      <div className="experience-loader-top">
        <span>{theme === "luxury" ? "ATELIER / 09" : "NOVA / 01"}</span>
        <span>INITIALISING</span>
      </div>
      <div className="experience-loader-center">
        <div className="experience-loader-mark">
          <i />
          <i />
          <i />
        </div>
        <p>
          {theme === "luxury" ? "Entering the atelier" : "Establishing signal"}
        </p>
      </div>
      <div className="experience-loader-bottom">
        <span>LOAD / 01</span>
        <div>
          <i />
        </div>
        <span>PLEASE WAIT</span>
      </div>
    </div>
  );
}

function DeferredScene({
  delayMs = 0,
  ...props
}: ComponentProps<typeof ExperienceScene> & { delayMs?: number }) {
  const [ready, setReady] = useState(false);
  const holder = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = holder.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) {
      setReady(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        const timer = window.setTimeout(() => {
          setReady(true);
          observer.disconnect();
        }, delayMs);
        observer.disconnect();
        (node as HTMLDivElement & { __sceneTimer?: number }).__sceneTimer =
          timer;
      },
      { rootMargin: "360px 0px" },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      const timer = (node as HTMLDivElement & { __sceneTimer?: number })
        .__sceneTimer;
      if (timer) window.clearTimeout(timer);
    };
  }, [delayMs]);
  return (
    <div ref={holder} className="scene-deferred">
      {ready ? (
        <ExperienceScene {...props} />
      ) : (
        <div className="scene-deferred-placeholder" aria-hidden="true" />
      )}
    </div>
  );
}

function SceneChapter({
  index,
  eyebrow,
  title,
  copy,
}: {
  index: string;
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <article className="scene-chapter">
      <span>{index}</span>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h3>{title}</h3>
        <p>{copy}</p>
      </div>
    </article>
  );
}

const luxuryRouteData = sitePages.luxury;
const spaceRouteData = sitePages.space;

function RouteScreen({
  theme,
  page,
}: {
  theme: "luxury" | "space";
  page: string;
}) {
  const baseData =
    theme === "luxury"
      ? luxuryRouteData[page as keyof typeof luxuryRouteData]
      : spaceRouteData[page as keyof typeof spaceRouteData];
  const [override, setOverride] = useState<Record<string, any>>({});
  useEffect(() => {
    let alive = true;
    getSessionOverrides<any>().then((content) => {
      if (alive) setOverride(content?.[theme]?.pages?.[page] || {});
    });
    return () => {
      alive = false;
    };
  }, [theme, page]);
  const data = baseData ? resolveContent(baseData, override) : null;
  const routes = theme === "luxury" ? navItems.luxury : navItems.space;
  const showEarth = theme === "space" && page === "Explore";
  const [earthReady, setEarthReady] = useState(false);
  if (!data) return null;
  const routeIndex =
    Math.max(
      0,
      routes.findIndex(([, label]) => label === page),
    ) + 1;
  const details =
    theme === "luxury"
      ? [
          ["MATERIAL", "Stone / brass / glass"],
          ["EDITION", "Private / limited"],
          ["STATE", "Available by request"],
        ]
      : [
          ["VECTOR", "Earth → orbit → deep field"],
          ["SIGNAL", showEarth ? "SOL-03 / LIVE" : "NOVA / 01"],
          ["STATE", "Telemetry nominal"],
        ];
  return (
    <section
      className={`route-screen route-screen-${theme} ${showEarth ? "route-screen-earth" : ""}`}
    >
      <div className="route-screen-media">
        <img src={data.image} alt="" />
      </div>
      <div className="route-screen-shade" />
      <div className="route-screen-content">
        <p className="eyebrow">{data.tag}</p>
        <h1>{data.title}</h1>
        <p className="route-copy">{data.copy}</p>
        <div className="route-actions">
          <Link
            className={theme === "luxury" ? "lux-button" : "space-button"}
            href={theme === "luxury" ? "/luxury" : "/space"}
          >
            Back to overview <ArrowUpRight />
          </Link>
          <span>
            0{routeIndex} / {page.toUpperCase()}
          </span>
        </div>
        <div className="route-detail-strip">
          {details.map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <b>{value}</b>
            </div>
          ))}
        </div>
      </div>
      <aside className="route-screen-aside">
        {showEarth ? (
          <div className="route-screen-model">
            <div
              className="route-earth-poster"
              style={{ opacity: earthReady ? 0 : 1 }}
              aria-hidden="true"
            />
            <DeferredScene
              space
              model="earth"
              delayMs={0}
              onReady={() => setEarthReady(true)}
            />
            <div className="earth-model-caption">
              <span>EARTH / SOL-03</span>
              <b>LIVE ROTATION</b>
            </div>
          </div>
        ) : (
          <div className="route-detail-card">
            <div className="route-detail-card-top">
              <span>0{routeIndex}</span>
              <span>{data.tag}</span>
            </div>
            <div className="route-detail-line" />
            <p>
              {theme === "luxury"
                ? "A quieter, tactile sequence through the studio."
                : "A live archive node within the NOVA navigation system."}
            </p>
            <strong>
              {theme === "luxury"
                ? "PRIVATE / 2026"
                : `NODE / ${page.toUpperCase()}`}
            </strong>
          </div>
        )}
      </aside>
      <div className="route-screen-side">
        <span>SCROLL TO MOVE</span>
        <i />
      </div>
    </section>
  );
}

function MediaInterlude({
  theme,
  label,
  title,
  copy,
  image,
  video,
}: {
  theme: "luxury" | "space";
  label: string;
  title: string;
  copy: string;
  image: string;
  video: string;
}) {
  return (
    <section className={`media-interlude media-interlude-${theme}`}>
      <img
        className="media-interlude-image"
        src={image}
        alt=""
        loading="lazy"
        decoding="async"
      />
      <LazyVideo
        className="media-interlude-video"
        src={video}
        poster={image}
        label={`${theme} cinematic background film`}
      />
      <div className="media-interlude-shade" />
      <div className="media-interlude-copy">
        <p className="eyebrow">{label}</p>
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
      <span className="media-interlude-index">SCROLL / LIVE FILM</span>
    </section>
  );
}

function ImageRevealPanels({
  theme,
  label,
  title,
}: {
  theme: "luxury" | "space";
  label: string;
  title: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [progress] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);
  const images =
    theme === "luxury"
      ? [
          "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1600&q=82",
          "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=1600&q=82",
          "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1600&q=82",
          "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1600&q=82",
        ]
      : [
          "https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&w=1400&q=74",
          "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&q=74",
          "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1400&q=74",
          "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1400&q=74",
        ];

  useEffect(() => {
    const node = ref.current;
    if (!node || !("IntersectionObserver" in window)) return;
    let cancelled = false;
    const start = () => {
      let count = 0;
      const done = () => {
        if (cancelled) return;
        count += 1;
        setLoaded(count);
        if (count >= images.length) setReady(true);
      };
      images.forEach((src) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = done;
        img.onerror = done;
        img.src = src;
      });
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        start();
      },
      { rootMargin: "120px 0px" },
    );
    observer.observe(node);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [images.join("|")]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = node.getBoundingClientRect();
      const span = Math.max(1, rect.height - window.innerHeight);
      const next = Math.max(0, Math.min(1, -rect.top / span));
      node.style.setProperty("--reveal", next.toFixed(4));
      const labelNode = node.querySelector<HTMLElement>("[data-reveal-value]");
      if (labelNode)
        labelNode.textContent = `${String(Math.round(next * 100)).padStart(3, "0")}%`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section
      ref={ref}
      className={`image-reveal-section ${theme}`}
      style={{ "--reveal": progress } as CSSProperties}
    >
      <div className="reveal-stage">
        <div
          className={`reveal-wait ${ready ? "is-ready" : ""}`}
          aria-hidden={ready}
        >
          <span>
            {theme === "luxury"
              ? "ATELIER / MATERIAL STUDY"
              : "NOVA / SYSTEMS IN MOTION"}
          </span>
          <strong>
            {String(Math.min(loaded, images.length)).padStart(2, "0")} /{" "}
            {String(images.length).padStart(2, "0")}
          </strong>
          <i>
            <b style={{ width: `${(loaded / images.length) * 100}%` }} />
          </i>
          <small>
            {ready
              ? "SEQUENCE READY / SCROLL TO RELEASE"
              : "LOADING VISUAL SEQUENCE"}
          </small>
        </div>
        <div className="reveal-title">
          <p className="eyebrow">{label}</p>
          <h2>{title}</h2>
          <p>
            Scroll through the sequence. The page holds position until the
            composition is complete.
          </p>
        </div>
        <div className="reveal-panels">
          {images.map((src, i) => (
            <div
              key={src}
              className="reveal-panel"
              style={{ "--i": i } as CSSProperties}
            >
              <img
                className="reveal-panel-image"
                src={src}
                alt=""
                loading="lazy"
                decoding="async"
              />
              <span>0{i + 1}</span>
            </div>
          ))}
        </div>
        <div className="reveal-progress">
          <span />
          <em data-reveal-value>
            {String(Math.round(progress * 100)).padStart(3, "0")}%
          </em>
        </div>
      </div>
    </section>
  );
}

function CollectionMotion() {
  const sectionRef = useRef<HTMLElement>(null);
  const collection = [
    [
      "Crown Relic",
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1600&q=82",
    ],
    [
      "Obsidian Signet",
      "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=1600&q=82",
    ],
    [
      "The Golden Archive",
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1600&q=82",
    ],
    [
      "Emerald Relic",
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1600&q=82",
    ],
    [
      "Black Velvet Study",
      "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&w=1600&q=82",
    ],
    [
      "Gold / Patina",
      "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1600&q=82",
    ],
  ];
  const [phase, setPhase] = useState(0);
  const phaseRef = useRef(0);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    let frame = 0;
    let target = 0;
    let current = 0;
    const smooth = (value: number) => value * value * (3 - 2 * value);
    const tick = () => {
      current += (target - current) * 0.13;
      const p = current;
      const a = smooth(Math.max(0, Math.min(1, (p - 0.27) / 0.12)));
      const b = smooth(Math.max(0, Math.min(1, (p - 0.61) / 0.12)));
      node.style.setProperty("--collection-progress", p.toFixed(4));
      node.style.setProperty("--collection-bg0", (1 - a).toFixed(4));
      node.style.setProperty("--collection-bg1", a.toFixed(4));
      node.style.setProperty("--collection-bg2", "0");
      const nextPhase = p < 0.34 ? 0 : p < 0.67 ? 1 : 2;
      if (nextPhase !== phaseRef.current) {
        phaseRef.current = nextPhase;
        setPhase(nextPhase);
      }
      if (Math.abs(target - current) > 0.001)
        frame = requestAnimationFrame(tick);
      else frame = 0;
    };
    const update = () => {
      const rect = node.getBoundingClientRect();
      const span = Math.max(1, rect.height - window.innerHeight);
      target = Math.max(0, Math.min(1, -rect.top / span));
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const onScroll = () => update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const backgroundImages = [
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=2200&q=86",
    "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=2200&q=86",
  ];
  const phaseTitles = [
    ["A COLLECTION IN MOTION.", "Relics become atmosphere."],
    ["A COLLECTION IN MOTION.", "Gold remembers the hand."],
    ["A COLLECTION IN MOTION.", "The archive keeps moving."],
  ];
  return (
    <section
      ref={sectionRef}
      className="lux-collection-motion"
      style={{ "--collection-progress": 0 } as CSSProperties}
    >
      <div className="collection-sticky">
        <div className="collection-background" aria-hidden="true">
          {backgroundImages.map((src, i) => (
            <img
              key={src}
              className={`collection-background-layer collection-background-layer-${i}`}
              src={src}
              alt=""
              style={{
                opacity: `var(--collection-bg${i}, ${i === 0 ? 1 : 0})`,
              }}
              decoding="async"
              loading={i === 0 ? "eager" : "lazy"}
            />
          ))}
        </div>
        <div className="collection-background-shade" aria-hidden="true" />
        <div className="collection-topline">
          <span>04 / CURRENT WORKS</span>
          <span>06 OBJECTS / 02 SCENES · SCROLL</span>
        </div>
        <div className="collection-scene-copy">
          <span>ATELIER / 09</span>
          <strong key={phase}>{phaseTitles[phase][0]}</strong>
          <p key={`p-${phase}`}>{phaseTitles[phase][1]}</p>
        </div>
        <div className="collection-title">
          <p className="eyebrow">A COLLECTION IN MOTION.</p>
          <h2>
            Move through
            <br />
            <em>the vault.</em>
          </h2>
          <p>
            Relics become stories. Stories become heirlooms. Keep scrolling.
          </p>
        </div>
        <div className="collection-track">
          {collection.map(([title, image], i) => (
            <article className="collection-card" key={title}>
              <div className="collection-card-media">
                <img
                  src={image}
                  alt=""
                  loading={i < 4 ? "eager" : "lazy"}
                  decoding="async"
                />
              </div>
              <div className="collection-card-copy">
                <span>0{String(i + 1).padStart(2, "0")} / ATELIER EDITION</span>
                <h3>{title}</h3>
                <p>
                  {i % 2 ? "Limited material study" : "Hand-finished object"}
                </p>
              </div>
            </article>
          ))}
        </div>
        <div className="collection-meter">
          <span />
          <b>0{phase + 1} / 03</b>
        </div>
      </div>
    </section>
  );
}

function ExperienceCursor({ theme }: { theme: "luxury" | "space" }) {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    let x = -120;
    let y = -120;
    let lastX = -120;
    let lastY = -120;
    let raf = 0;
    let hideTimer = 0;

    const render = () => {
      raf = 0;

      node.style.setProperty("--cursor-x", `${x}px`);
      node.style.setProperty("--cursor-y", `${y}px`);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };

    const move = (event: PointerEvent) => {
      const nextX = event.clientX;
      const nextY = event.clientY;
      const dx = nextX - lastX;
      const dy = nextY - lastY;
      const distance = Math.hypot(dx, dy);
      const speed = Math.min(1, distance / 26);
      const previousAngle =
        Number(
          node.style.getPropertyValue("--trail-angle").replace("deg", ""),
        ) || 0;
      const angle =
        distance > 0.25 ? (Math.atan2(dy, dx) * 180) / Math.PI : previousAngle;

      x = nextX;
      y = nextY;
      lastX = nextX;
      lastY = nextY;
      node.style.setProperty("--trail-angle", `${angle}deg`);
      node.style.setProperty("--trail-length", `${28 + speed * 74}px`);
      node.style.setProperty("--trail-opacity", `${0.18 + speed * 0.72}`);
      node.style.setProperty("--trail-flare", `${0.2 + speed * 0.8}`);
      node.style.opacity = "1";
      if (hideTimer) window.clearTimeout(hideTimer);
      schedule();
    };

    const leave = () => {
      hideTimer = window.setTimeout(() => {
        node.style.opacity = "0";
      }, 60);
    };

    const addBurst = (event: PointerEvent) => {
      const count = theme === "luxury" ? 34 : 30;
      const prefix = theme === "luxury" ? "cursor-spark" : "cursor-space-spark";
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < count; i += 1) {
        const spark = document.createElement("i");
        const angle = Math.random() * Math.PI * 2;
        const distance = 10 + Math.random() * 76;
        spark.className = prefix;
        spark.style.setProperty("--click-x", `${event.clientX}px`);
        spark.style.setProperty("--click-y", `${event.clientY}px`);
        spark.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
        spark.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);
        spark.style.setProperty(
          "--spark-rotate",
          `${(angle * 180) / Math.PI + (theme === "luxury" ? 90 : 0)}deg`,
        );
        spark.style.setProperty("--spark-length", `${2 + Math.random() * 4}px`);
        spark.style.setProperty("--delay", `${i * 6}ms`);
        fragment.appendChild(spark);
      }
      document.body.appendChild(fragment);
      window.setTimeout(
        () =>
          document.querySelectorAll(`.${prefix}`).forEach((el) => el.remove()),
        760,
      );

      const ripple = document.createElement("i");
      ripple.className = `cursor-click-ripple cursor-click-ripple-${theme}`;
      ripple.style.setProperty("--click-x", `${event.clientX}px`);
      ripple.style.setProperty("--click-y", `${event.clientY}px`);
      document.body.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 560);
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerleave", leave, { passive: true });
    window.addEventListener("pointerdown", addBurst, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (hideTimer) window.clearTimeout(hideTimer);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", addBurst);
    };
  }, [theme]);
  return (
    <div
      ref={rootRef}
      className={`experience-cursor cursor-${theme}`}
      aria-hidden="true"
    >
      <i className="cursor-core" />
      <span className="cursor-cross" />
      <b className="cursor-trail" />
      <small className="cursor-fire" />
      <em className="cursor-aura" />
    </div>
  );
}

const luxuryStats = [
  ["09", "objects released"],
  ["31", "master artisans"],
  ["03", "continents sourced"],
  ["100", "year material promise"],
];
const spaceStats = [
  ["12.8B", "kilometres mapped"],
  ["0.42c", "cruise velocity"],
  ["247", "days in transit"],
  ["06", "crew systems"],
];
const luxuryVideo =
  "https://storage.googleapis.com/coverr-main/mp4/Footboys.mp4";
const spaceVideo = "https://storage.googleapis.com/coverr-main/mp4/宇宙.mp4";

function LuxuryFooter() {
  return (
    <footer className="lux-footer">
      <div className="footer-marquee" aria-hidden="true">
        ATELIER / 09 · OBJECTS FOR SLOWER ROOMS · ATELIER / 09 · OBJECTS FOR
        SLOWER ROOMS ·{" "}
      </div>
      <div className="footer-content">
        <div className="footer-lead">
          <p className="eyebrow">THE HOUSE / 09</p>
          <h3>
            Make room
            <br />
            <em>for wonder.</em>
          </h3>
          <p>
            Objects for the long view.
            <br />
            Paris · New York · Everywhere.
          </p>
        </div>
        <div className="footer-column">
          <h3>VISIT</h3>
          <Link href="/luxury/contact">Private viewings</Link>
          <Link href="/luxury/experience">The experience</Link>
          <Link href="/luxury/collection">Current collection</Link>
        </div>
        <div className="footer-column">
          <h3>EXPLORE</h3>
          <Link href="/luxury/stories">Journal</Link>
          <Link href="/luxury/services">Services</Link>
          <Link href="/luxury">Overview</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2024 Atelier 09 / All rights reserved</p>
        <span>
          Designed for the long view <b>↗</b>
        </span>
      </div>
    </footer>
  );
}

function SpaceFooter() {
  return (
    <footer className="space-footer">
      <div className="footer-marquee" aria-hidden="true">
        NOVA / 01 · KEEP LOOKING UP · NOVA / 01 · KEEP LOOKING UP ·{" "}
      </div>
      <div className="footer-content">
        <div className="footer-lead">
          <p className="space-eyebrow">MISSION CONTROL / 2049</p>
          <h3>
            Keep looking
            <br />
            <em>up.</em>
          </h3>
          <p>
            Deep space research for the long way around.
            <br />
            Signal open 24 / 7.
          </p>
        </div>
        <div className="footer-column">
          <h3>TRANSMIT</h3>
          <Link href="/space/missions">Mission logs</Link>
          <Link href="/space/technology">Technology</Link>
          <Link href="/space/future">The future</Link>
        </div>
        <div className="footer-column">
          <h3>CONTACT</h3>
          <Link href="/space/explore">Signal status</Link>
          <Link href="/space/origin">Crew archive</Link>
          <Link href="mailto:mission@nova.space">mission@nova.space</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2049 NOVA Space Research / All systems nominal</p>
        <span>
          Keep looking up <b>↗</b>
        </span>
      </div>
    </footer>
  );
}

export function LuxuryShell({ page = "Overview" }: { page?: string }) {
  useScrollDirector();
  const [content, setContent] = useState(defaultContent.luxury);
  const [muted, setMuted] = useState(true);
  useEffect(() => {
    getSessionOverrides<any>().then((o) =>
      setContent(resolveContent(defaultContent.luxury, o.luxury)),
    );
  }, []);
  if (page !== "Overview")
    return (
      <main className="luxury-page">
        <CreativeLoader theme="luxury" />
        <ExperienceCursor theme="luxury" />
        <header className="lux-nav lux-nav-light">
          <Link className="wordmark" href="/luxury">
            ATELIER / 09
          </Link>
          <nav className="lux-links">
            {navItems.luxury.slice(1).map(([href, label]) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
          </nav>
          <span className="nav-index">{page.toUpperCase()} / 09</span>
        </header>
        <RouteScreen theme="luxury" page={page} />
        <LuxuryFooter />
      </main>
    );
  return (
    <main className="luxury-page">
      <CreativeLoader theme="luxury" />
      <ExperienceCursor theme="luxury" />
      <header className="lux-nav lux-nav-light">
        <Link className="wordmark" href="/luxury">
          ATELIER / 09
        </Link>
        <nav className="lux-links">
          {navItems.luxury.slice(1).map(([href, label]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
        <span className="nav-index">OVERVIEW / 09</span>
      </header>
      <section className="lux-hero cinematic-hero">
        <video
          className="hero-video"
          autoPlay
          muted={muted}
          loop
          playsInline
          preload="auto"
        >
          <source
            src={content.heroVideo || "/media/luxury-hero.mp4"}
            type="video/mp4"
          />
          <source src={"/media/luxury-hero.mp4"} type="video/mp4" />
          <source src={luxuryVideo} type="video/mp4" />
        </video>
        <div className="hero-shade" />
        <div className="hero-meta">
          <span>ATELIER / FOR SENSORY OBJECTS</span>
          <span>EST. 2019 / NEW YORK — PARIS</span>
        </div>
        <div className="lux-hero-copy">
          <p className="eyebrow">01 / OVERVIEW</p>
          <h1>{content.title}</h1>
          <p>{content.subtitle}</p>
          <Link href="/luxury/experience" className="lux-button">
            {content.cta}
            <ArrowDown data-icon="inline-end" />
          </Link>
        </div>
        <div className="scroll-note">
          <span>SCROLL TO EXPLORE</span>
          <span className="line" />
        </div>
        <button
          className="video-control"
          onClick={() => setMuted(!muted)}
          aria-label={muted ? "Unmute film" : "Mute film"}
        >
          {muted ? <VolumeX /> : <Volume2 />}
        </button>
      </section>
      <section className="lux-story editorial-story">
        <div className="section-kicker">02 / THE HOUSE</div>
        <div className="story-grid">
          <div>
            <h2>
              We make <em>presence</em> tangible.
            </h2>
            <p className="lede">
              Atelier 09 works at the intersection of fine jewelry, antique
              objects, and modern relics. Every piece is designed to feel
              collected, not manufactured.
            </p>
            <p>
              Our studio pairs lost-wax casting, blackened metal, stone, enamel,
              and hand-set details. We work in small editions, with the patina
              and imperfection of objects meant to become heirlooms.
            </p>
            <Link className="text-link" href="/luxury/stories">
              Read the manifesto <ArrowUpRight />
            </Link>
          </div>
          <div className="story-orbit">
            <div className="orbit-ring" />
            <span>HAND / MATERIAL / MEMORY</span>
            <strong>09</strong>
          </div>
        </div>
        <div className="pull-quote">
          “The room changes when an object has a point of view.”
        </div>
      </section>
      <section className="lux-object">
        <div className="object-copy">
          <p className="eyebrow">03 / SIGNATURE SCULPTURE</p>
          <h2>The Black Panther Study</h2>
          <p>
            A sculptural lion transformed into a lacquered, jewel-like study in
            dark metal and warm gold.
          </p>
          <p className="spec-text">
            Blackened alloy / champagne metal accents
            <br />
            Hand-finished digital edition
            <br />
            Completed 2026
          </p>
        </div>
        <div className="lion-stage">
          <ExperienceScene color="#b99554" model="lion" onDiscover={() => {}} />
        </div>
      </section>
      <CollectionMotion />
      <MediaInterlude
        theme="luxury"
        label="05 / A STUDY IN LIGHT"
        title="Gold remembers everything."
        copy="A cinematic study of gold, lacquer, stone, and shadow. The film moves underneath the typography while the archive keeps scrolling."
        image="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=2200&q=88"
        video={luxuryVideo}
      />
      <ImageRevealPanels
        theme="luxury"
        label="06 / MATERIAL WEATHER"
        title="A jewel is never still."
      />
      <section className="lux-chapters">
        <p className="eyebrow">07 / THE PROCESS</p>
        <div className="chapter-stack">
          <SceneChapter
            index="01"
            eyebrow="SOURCE"
            title="Begin with the rare."
            copy="Stone from a single quarry. Brass aged by hand. Nothing enters the studio without a reason."
          />
          <SceneChapter
            index="02"
            eyebrow="SHAPE"
            title="Let the material lead."
            copy="The object is discovered slowly, through heat, pressure, and the patience of someone who knows when to stop."
          />
          <SceneChapter
            index="03"
            eyebrow="PLACE"
            title="Give it a room."
            copy="A finished piece is not complete until it changes the atmosphere around it."
          />
        </div>
      </section>
      <section className="lux-stats lux-numbers">
        <div className="numbers-intro">
          <p className="eyebrow">08 / THE NUMBERS</p>
          <h2>
            Small editions.
            <br />
            <em>Long lives.</em>
          </h2>
          <p>Measured by what remains after the first impression.</p>
        </div>
        <div className="stats-grid">
          {luxuryStats.map(([number, label]) => (
            <div key={label}>
              <strong>{number}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="lux-cta">
        <div>
          <p className="eyebrow">09 / THE NEXT OBJECT</p>
          <h2>
            Make room for <em>wonder.</em>
          </h2>
          <Link className="lux-button" href="/luxury/contact">
            Request a private viewing <ArrowUpRight />
          </Link>
        </div>
        <div className="cta-scene">
          <DeferredScene delayMs={280} color="#8f633b" model="lion" />
        </div>
      </section>
      <LuxuryFooter />
    </main>
  );
}

export function SpaceShell({ page = "Orbit" }: { page?: string }) {
  useScrollDirector();
  const journey = useElementProgress();
  const [planet, setPlanet] = useState(1);
  const [launch, setLaunch] = useState(false);
  if (page !== "Orbit")
    return (
      <main className="space-page">
        <div className="space-global-earth" aria-hidden="true" />
        <CreativeLoader theme="space" />
        <ExperienceCursor theme="space" />
        <header className="space-nav">
          <Link className="space-mark" href="/space">
            <span className="mark-orbit" /> NOVA / 01
          </Link>
          <nav>
            {navItems.space.slice(1).map(([href, label]) => (
              <Link key={href} href={href}>
                {label.toUpperCase()}
              </Link>
            ))}
          </nav>
          <button className="signal" onClick={() => setLaunch(!launch)}>
            {launch ? "T-0 LAUNCHED" : "SIGNAL STABLE"}
          </button>
        </header>
        <RouteScreen theme="space" page={page} />
        <SpaceFooter />
      </main>
    );
  return (
    <main className="space-page">
      <div className="space-global-earth" aria-hidden="true" />
      <CreativeLoader theme="space" />
      <ExperienceCursor theme="space" />
      <header className="space-nav">
        <Link className="space-mark" href="/space">
          <span className="mark-orbit" /> NOVA / 01
        </Link>
        <nav>
          {navItems.space.slice(1).map(([href, label]) => (
            <Link key={href} href={href}>
              {label.toUpperCase()}
            </Link>
          ))}
        </nav>
        <button className="signal" onClick={() => setLaunch(!launch)}>
          {launch ? "T-0 LAUNCHED" : "SIGNAL STABLE"}
        </button>
      </header>
      <section className="space-hero cinematic-hero">
        <video
          className="space-hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=2400&q=90"
        >
          <source src="/media/space-hero.mp4" type="video/mp4" />
          <source src={spaceVideo} type="video/mp4" />
        </video>
        <div className="space-video-shade" />
        <DeferredScene
          delayMs={350}
          space
          color={planets[planet].color}
          launch={launch}
          model="orbiter"
        />
        <div className="space-stars-copy">
          <p className="space-eyebrow">DEEP SPACE RESEARCH / 2049</p>
          <h1>Beyond the Known</h1>
          <p>
            A living archive of missions, machines, and the quiet courage to
            look farther.
          </p>
          <Link className="space-button" href="/space/missions">
            Begin the mission <ArrowDown />
          </Link>
        </div>
        <div className="coordinates">
          41° 24' 12.2 N<br />
          02° 10' 26.5 E
        </div>
        <div className="flight-readout">
          <span>VELOCITY</span>
          <strong>{launch ? "0.42C" : "0.00C"}</strong>
          <span>SCROLL / CAMERA LINK</span>
        </div>
      </section>
      <MediaInterlude
        theme="space"
        label="01 / DEEP FIELD TRANSMISSION"
        title="The dark is full of signals."
        copy="A moving archive of dust, ice, and distant light. Scroll slowly; the ship is listening."
        image="https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=2200&q=88"
        video={spaceVideo}
      />
      <section ref={journey.ref} className="space-journey space-depth">
        <div className="space-label">02 — ORIGIN</div>
        <h2>
          There is more between <span>here</span> and there.
        </h2>
        <p>
          We build instruments for the long way around. Scroll through the
          flight plan, lock a target, and send a signal into the void.
        </p>
        <div className="journey-line">
          <span>EARTH</span>
          <i />
          <span>ORBIT</span>
          <i />
          <span>DEEP FIELD</span>
          <b className="journey-route-dot" aria-hidden="true" />
        </div>
        <div className="space-chapters">
          <SceneChapter
            index="01"
            eyebrow="LAUNCH"
            title="Ignition sequence."
            copy="The ship leaves the blue hour behind. Scroll forward to increase velocity and open the flight path."
          />
          <SceneChapter
            index="02"
            eyebrow="ORBIT"
            title="The planet gets small."
            copy="Navigation locks to a moving constellation while the cabin lights switch to red."
          />
          <SceneChapter
            index="03"
            eyebrow="DEEP SPACE"
            title="No map survives."
            copy="Beyond the known, the archive becomes a living instrument. Select a target and keep moving."
          />
        </div>
      </section>
      <section className="planet-section space-command">
        <div className="planet-copy">
          <p className="space-eyebrow">03 — CELESTIAL BODIES</p>
          <h2>
            Choose your <span>vantage point.</span>
          </h2>
          <p>
            Every target changes the light, route, and mission data inside the
            simulation.
          </p>
        </div>
        <div className="planet-grid">
          {planets.map((p, i) => (
            <button
              key={p.name}
              className={`planet-card ${planet === i ? "active" : ""}`}
              onClick={() => setPlanet(i)}
            >
              <div
                className="planet-dot"
                style={{ backgroundColor: p.color }}
              />
              <span className="planet-index">TARGET 0{i + 1}</span>
              <h3>{p.name}</h3>
              <p>{p.copy}</p>
              <code>{p.code} / SIGNAL LOCKED</code>
            </button>
          ))}
        </div>
      </section>
      <section className="mission-section">
        <div className="space-label">04 — MISSION LOG</div>
        <h2>Four ways to leave Earth.</h2>
        <div className="mission-grid">
          {missions
            .concat([
              {
                id: "2040",
                name: "Asteria",
                detail: "First autonomous archive beyond the heliopause.",
                status: "PLANNED",
              },
            ])
            .map((mission, i) => (
              <article
                className="mission-card"
                key={mission.id}
                onClick={() => setLaunch(true)}
              >
                <span className="mission-year">
                  MISSION 0{i + 1} / {mission.id}
                </span>
                <h3>{mission.name}</h3>
                <p>{mission.detail}</p>
                <strong>{mission.status}</strong>
              </article>
            ))}
        </div>
      </section>
      <section className="space-tech">
        <div className="space-label">05 — INSTRUMENTS</div>
        <h2>The machine is the message.</h2>
        <div className="tech-grid">
          {[
            "Propulsion / ion lattice drive",
            "Navigation / quantum star map",
            "Materials / ceramic carbon skin",
            "Energy / closed-loop fusion",
            "Communication / neutrino relay",
            "Life support / adaptive ecology",
          ].map((tech, i) => (
            <article className="tech-card" key={tech}>
              <span>0{i + 1}</span>
              <h3>{tech.split(" / ")[0]}</h3>
              <p>{tech.split(" / ")[1]}</p>
              <div className="tech-meter">
                <i style={{ width: `${60 + i * 6}%` }} />
              </div>
            </article>
          ))}
        </div>
      </section>
      <ImageRevealPanels
        theme="space"
        label="06 / SYSTEMS IN MOTION"
        title="Watch the machine change state."
      />
      <section className="space-stats">
        <p className="space-eyebrow">07 / FLIGHT DATA</p>
        <div className="stats-grid">
          {spaceStats.map(([number, label]) => (
            <div key={label}>
              <strong>{number}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="space-timeline">
        <div className="space-label">08 — TIMELINE</div>
        <h2>We are only at the beginning.</h2>
        <div className="timeline">
          {[
            "2026 / first signal",
            "2028 / lunar relay",
            "2030 / crew habitat",
            "2035 / Europa flyby",
            "2040 / deep archive",
          ].map((item, i) => (
            <div
              key={item}
              style={{ "--delay": `${i * 80}ms` } as CSSProperties}
            >
              <span>{item.split(" / ")[0]}</span>
              <p>{item.split(" / ")[1]}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="space-cta">
        <div>
          <DeferredScene
            delayMs={420}
            space
            model="orbiter"
            color="#64eaff"
            launch={launch}
          />
        </div>
        <div>
          <p className="space-eyebrow">09 / FINAL TRANSMISSION</p>
          <h2>
            The future is <span>out there.</span>
          </h2>
          <button className="space-button" onClick={() => setLaunch(true)}>
            Launch the archive <ArrowUpRight />
          </button>
        </div>
      </section>
      <SpaceFooter />
    </main>
  );
}
