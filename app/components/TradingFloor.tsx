/**
 * PUNT FINANCE — TradingFloor RSC Wrapper
 * Async Server Component — fetches data, passes to client tabbed UI.
 */

import { Suspense }               from "react";
import { fetchTradingFloor }      from "@/lib/ledger/tradingFloor";
import { TradingFloorClient }     from "@/app/components/TradingFloor";

/* ── Skeleton shown while data loads ───────────────────────────────────── */

function TradingFloorSkeleton() {
  return (
    <section
      style={{ borderBottom: "1px solid #E2DDD5", width: "100%", backgroundColor: "#F4EFE6" }}
      aria-label="Loading global markets"
    >
      <style>{`
        @keyframes skPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "5rem 2rem" }}>
        {/* Header skeleton */}
        <div style={{ marginBottom: "2rem", borderBottom: "1px solid #C9C3B8", paddingBottom: "1.25rem" }}>
          <div style={{ width: "8rem", height: "0.6rem", backgroundColor: "#E2DDD5", marginBottom: "0.6rem", animation: "skPulse 1.8s ease-in-out infinite" }} />
          <div style={{ width: "14rem", height: "1.75rem", backgroundColor: "#E2DDD5", animation: "skPulse 1.8s ease-in-out infinite" }} />
        </div>
        {/* Tab bar skeleton */}
        <div style={{ display: "flex", gap: "0.25rem", borderBottom: "1px solid #E2DDD5", backgroundColor: "#EDE8DE", padding: "0 0.5rem" }}>
          {[7, 5, 6, 8, 9, 7, 8].map((w, i) => (
            <div key={i} style={{ width: `${w}rem`, height: "2.5rem", backgroundColor: "#E2DDD5", animation: `skPulse 1.8s ease-in-out ${i * 80}ms infinite` }} />
          ))}
        </div>
        {/* Table skeleton */}
        <div style={{ marginTop: "1.5rem", border: "1px solid #E2DDD5", borderTop: "2px solid #002147", backgroundColor: "#FAF9F6", padding: "1rem" }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: "0.75rem", paddingBlock: "0.75rem", borderBottom: i < 5 ? "1px solid #E2DDD5" : "none" }}>
              <div style={{ width: "6rem", height: "0.75rem", backgroundColor: "#E2DDD5", animation: `skPulse 1.8s ease-in-out ${i * 60}ms infinite` }} />
              <div style={{ width: "8rem", height: "0.75rem", backgroundColor: "#E2DDD5", animation: `skPulse 1.8s ease-in-out ${i * 60 + 30}ms infinite` }} />
              <div style={{ width: "5rem", height: "0.75rem", backgroundColor: "#E2DDD5", animation: `skPulse 1.8s ease-in-out ${i * 60 + 60}ms infinite` }} />
              <div style={{ width: "4rem", height: "0.75rem", backgroundColor: "#E2DDD5", animation: `skPulse 1.8s ease-in-out ${i * 60 + 90}ms infinite` }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Inner async RSC ────────────────────────────────────────────────────── */

async function LiveTradingFloor() {
  const data = await fetchTradingFloor();
  if (!data.ok || data.regions.length === 0) {
    return (
      <section style={{ borderBottom: "1px solid #E2DDD5", width: "100%", backgroundColor: "#F4EFE6" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "5rem 2rem", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.125rem", fontStyle: "italic", color: "#002147" }}>
            The Trading Floor is currently being updated.
          </p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.8125rem", color: "#7A7369", marginTop: "0.5rem" }} lang="sw">
            Masoko ya biashara yanasasishwa. Tafadhali rudi hivi karibuni.
          </p>
        </div>
      </section>
    );
  }
  return <TradingFloorClient data={data} />;
}

/* ── Exported wrapper with Suspense boundary ────────────────────────────── */

export function TradingFloor() {
  return (
    <Suspense fallback={<TradingFloorSkeleton />}>
      <LiveTradingFloor />
    </Suspense>
  );
}
