import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  // Build script (CommonJS) and codegen output — not app source.
  { ignores: ["generate-data.js", "data/*.ts"] },
  ...nextCoreWebVitals,
];

export default config;
