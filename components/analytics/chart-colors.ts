/**
 * Chart colors for the dark admin surface (#131316).
 *
 * The brand orange (#ea8f2d) is a touch too light for a data mark on this
 * surface, so marks use one deeper step of it. Orange → blue → aqua passed the
 * dataviz palette validator in dark mode (lightness band, chroma, colorblind
 * separation, normal-vision separation, 3:1 contrast). Re-run it before adding
 * a fourth series color.
 */
export const CHART = {
  surface: "#131316",
  /** Primary series: this period, single-series bars. */
  orange: "#d8781e",
  blue: "#3987e5",
  aqua: "#199e70",
  /** De-emphasis: the previous period, non-highlighted bars, "Other". */
  muted: "#5f5f69",
  grid: "rgba(255, 255, 255, 0.07)",
  axisText: "#71717a",
  track: "rgba(255, 255, 255, 0.05)",
} as const;

/** Device identity is fixed, never by rank: mobile is always orange. */
export const DEVICE_COLORS: Record<string, string> = {
  mobile: CHART.orange,
  desktop: CHART.blue,
  tablet: CHART.aqua,
  other: CHART.muted,
};
