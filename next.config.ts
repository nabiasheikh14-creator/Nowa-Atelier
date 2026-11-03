import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The reading room and the keeper's desk are request-time: the collection,
  // the session cookie, and borrow writes. Cache Components would force a
  // prerender boundary around all of that without making the room any faster.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
