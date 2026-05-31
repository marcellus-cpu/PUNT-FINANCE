export type MarketRegion =
  | "kenya_eastafrica"
  | "africa"
  | "europe"
  | "north_america"
  | "asia_pacific"
  | "middle_east"
  | "latin_america";

export type MarketDirection = "up" | "down" | "flat";

export interface MarketIndex {
  symbol:      string;
  name:        string;
  country:     string;
  countryFlag: string;
  price:       string;
  change:      string;
  changePct:   string;
  direction:   MarketDirection;
  currency:    string;
  lastUpdated: string;
}

export interface RegionData {
  region:      MarketRegion;
  label:       string;
  shortLabel:  string;
  indices:     MarketIndex[];
  headline:    string;
  headlineUrl: string;
  source:      string;
  fetchedAt:   string;
}

export interface TradingFloorResult {
  ok:         boolean;
  regions:    RegionData[];
  fetchedAt:  string;
  isFallback: boolean;
}

export const REGION_CONFIG: Record<MarketRegion, { label: string; shortLabel: string }> = {
  kenya_eastafrica: { label: "Kenya & East Africa",  shortLabel: "Kenya · EA"    },
  africa:           { label: "Africa",               shortLabel: "Africa"        },
  europe:           { label: "Europe",               shortLabel: "Europe"        },
  north_america:    { label: "North America",        shortLabel: "N. America"    },
  asia_pacific:     { label: "Asia Pacific",         shortLabel: "Asia Pacific"  },
  middle_east:      { label: "Middle East",          shortLabel: "Middle East"   },
  latin_america:    { label: "Latin America",        shortLabel: "Latin America" },
};
