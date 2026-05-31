"use client";

/**
 * PUNT FINANCE — The Trading Floor
 * Global markets section with 7 regional tabs.
 * Client component for tab switching only — data is passed from RSC parent.
 */

import { useState } from "react";
import { ArrowUpRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { TradingFloorResult, RegionData, MarketIndex, MarketRegion } from "@/types/tradingFloor";

/* ── Direction styling ──────────────────────────────────────────────────── */

function getDirectionColor(direction: MarketIndex["direction"]): string {
  if (direction === "up")   return "#1B4332";
  if (direction === "down") return "#8B2020";
  return "#7A7369";
}

function DirectionIcon({ direction }: { direction: MarketIndex["direction"] }) {
  if (direction === "up")   return <TrendingUp   size={11} strokeWidth={2} aria-hidden="true" />;
  if (direction === "down") return <TrendingDown size={11} strokeWidth={2} aria-hidden="true" />;
  return <Minus size={11} strokeWidth={2} aria-hidden="true" />;
}

/* ── Index Row ──────────────────────────────────────────────────────────── */

function IndexRow({ index, isLast }: { index: MarketIndex; isLast: boolean }) {
  const color = getDirectionColor(index.direction);
  return (
    <div
      style={{
        display:       "grid",
        gridTemplateColumns: "auto 1fr auto auto",
        alignItems:    "center",
        gap:           "0.75rem",
        padding:       "0.75rem 0",
        borderBottom:  isLast ? "none" : "1px solid #E2DDD5",
      }}
      role="row"
      aria-label={`${index.name}: ${index.price} ${index.currency}, ${index.changePct}`}
    >
      {/* Flag + Country */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", minWidth: "6.5rem" }}>
        <span style={{ fontSize: "0.875rem" }} aria-hidden="true">{index.countryFlag}</span>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.5625rem", color: "#7A7369", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
          {index.country}
        </span>
      </div>

      {/* Name */}
      <div>
        <p style={{ fontFamily: "var(--font-serif)", fontSize: "0.875rem", color: "#002147", lineHeight: 1.2 }}>
          {index.name}
        </p>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.5rem", color: "#7A7369", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {index.symbol}
        </p>
      </div>

      {/* Price */}
      <div style={{ textAlign: "right" }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.875rem", fontWeight: 600, color: "#2C2C2C", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
          {index.price}
        </p>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.5rem", color: "#7A7369", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {index.currency}
        </p>
      </div>

      {/* Change */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", minWidth: "5rem", justifyContent: "flex-end" }}>
        <span style={{ color }}><DirectionIcon direction={index.direction} /></span>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", fontWeight: 600, color, whiteSpace: "nowrap" }}>
            {index.changePct}
          </p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.5rem", color, whiteSpace: "nowrap" }}>
            {index.change}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Region Panel ───────────────────────────────────────────────────────── */

function RegionPanel({ region }: { region: RegionData }) {
  return (
    <div style={{ padding: "1.5rem 0" }}>
      {/* Indices table */}
      <div
        role="table"
        aria-label={`${region.label} market indices`}
        style={{
          border:          "1px solid #E2DDD5",
          borderTop:       "2px solid #002147",
          backgroundColor: "#FAF9F6",
          marginBottom:    "1.25rem",
        }}
      >
        {/* Table header */}
        <div
          style={{
            display:             "grid",
            gridTemplateColumns: "auto 1fr auto auto",
            gap:                 "0.75rem",
            padding:             "0.625rem 1rem",
            backgroundColor:     "#F4EFE6",
            borderBottom:        "1px solid #E2DDD5",
          }}
          role="rowheader"
        >
          {["Market", "Index", "Price", "Change"].map((h) => (
            <p key={h} style={{ fontFamily: "var(--font-sans)", fontSize: "0.5rem", fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "#7A7369" }}>{h}</p>
          ))}
        </div>

        {/* Index rows */}
        <div style={{ padding: "0 1rem" }}>
          {region.indices.map((index, i) => (
            <IndexRow
              key={index.symbol}
              index={index}
              isLast={i === region.indices.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Headline */}
      <div
        style={{
          display:      "flex",
          alignItems:   "flex-start",
          gap:          "0.75rem",
          padding:      "1rem 1.25rem",
          border:       "1px solid #E2DDD5",
          borderLeft:   "3px solid #B5892A",
          backgroundColor: "#FAF9F6",
        }}
      >
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.5rem", fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "#B5892A", marginBottom: "0.4rem" }}>
            Top Story
          </p>
          <p style={{ fontFamily: "var(--font-serif)", fontSize: "0.9375rem", color: "#002147", lineHeight: 1.4, marginBottom: "0.5rem" }}>
            {region.headline}
          </p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.5625rem", color: "#7A7369", letterSpacing: "0.06em" }}>
            Source: {region.source}
          </p>
        </div>
        <a
          href={region.headlineUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display:       "flex",
            alignItems:    "center",
            gap:           "0.25rem",
            fontFamily:    "var(--font-sans)",
            fontSize:      "0.5625rem",
            fontWeight:    500,
            letterSpacing: "0.08em",
            color:         "#2C2C2C",
            borderBottom:  "1px solid #B5892A",
            paddingBottom: "1px",
            textDecoration:"none",
            flexShrink:    0,
            marginTop:     "1.5rem",
            whiteSpace:    "nowrap",
          }}
          aria-label={`Read full story from ${region.source}`}
        >
          Read More <ArrowUpRight size={9} strokeWidth={2} aria-hidden="true" />
        </a>
      </div>

      {/* Data disclaimer */}
      <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.5rem", color: "#7A7369", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "0.75rem", textAlign: "right" }}>
        Indicative data · Refreshes every 6 hours · Not for trading purposes
      </p>
    </div>
  );
}

/* ── Tab Button ─────────────────────────────────────────────────────────── */

function TabButton({
  label,
  isActive,
  onClick,
}: {
  label:    string;
  isActive: boolean;
  onClick:  () => void;
}) {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={isActive}
      style={{
        fontFamily:      "var(--font-sans)",
        fontSize:        "0.5625rem",
        fontWeight:      600,
        letterSpacing:   "0.12em",
        textTransform:   "uppercase",
        padding:         "0.6rem 1rem",
        border:          "none",
        borderBottom:    isActive ? "2px solid #002147" : "2px solid transparent",
        backgroundColor: isActive ? "#FAF9F6" : "transparent",
        color:           isActive ? "#002147" : "#7A7369",
        cursor:          "pointer",
        transition:      "all 200ms ease",
        whiteSpace:      "nowrap",
      }}
    >
      {label}
    </button>
  );
}

/* ── Main Component ─────────────────────────────────────────────────────── */

export function TradingFloorClient({ data }: { data: TradingFloorResult }) {
  const [activeRegion, setActiveRegion] = useState<MarketRegion>("kenya_eastafrica");

  const currentRegion = data.regions.find((r) => r.region === activeRegion) ?? data.regions[0];

  return (
    <section
      id="trading-floor"
      aria-labelledby="trading-floor-heading"
      style={{ borderBottom: "1px solid #E2DDD5", width: "100%", backgroundColor: "#F4EFE6" }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "5rem 2rem" }}>

        {/* Section header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "2rem", borderBottom: "1px solid #C9C3B8", paddingBottom: "1.25rem" }}>
          <div>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7A7369", marginBottom: "0.5rem" }}>
              §03 — Global Markets
            </p>
            <h2
              id="trading-floor-heading"
              style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 400, color: "#002147", letterSpacing: "-0.01em" }}
            >
              The Trading Floor
            </h2>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.5625rem", color: "#7A7369", letterSpacing: "0.08em", textTransform: "uppercase", lineHeight: 1.6 }}>
              7 Regions · {data.regions.reduce((acc, r) => acc + r.indices.length, 0)} Indices
            </p>
            {data.isFallback && (
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.5rem", color: "#B5892A", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: "0.25rem" }}>
                ● Indicative Prices
              </p>
            )}
          </div>
        </div>

        {/* Tab bar — scrollable on mobile */}
        <div
          role="tablist"
          aria-label="Select market region"
          style={{
            display:         "flex",
            overflowX:       "auto",
            borderBottom:    "1px solid #E2DDD5",
            backgroundColor: "#EDE8DE",
            marginBottom:    "0",
            scrollbarWidth:  "none",
          }}
        >
          {data.regions.map((region) => (
            <TabButton
              key={region.region}
              label={region.shortLabel}
              isActive={activeRegion === region.region}
              onClick={() => setActiveRegion(region.region)}
            />
          ))}
        </div>

        {/* Active region panel */}
        {currentRegion && (
          <div role="tabpanel" aria-label={`${currentRegion.label} markets`}>
            <RegionPanel region={currentRegion} />
          </div>
        )}
      </div>
    </section>
  );
}
