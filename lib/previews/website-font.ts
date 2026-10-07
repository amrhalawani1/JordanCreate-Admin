import localFont from "next/font/local";

/** The website's display face, so previews read like the real thing. */
export const websiteDisplay = localFont({
  src: "../../app/fonts/tt-ramillas-trl-variable-italic.woff2",
  style: "italic",
  weight: "100 900",
  variable: "--font-website-display",
  display: "swap",
});
