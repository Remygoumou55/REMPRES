import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const config: Config = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["./jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: [
    "<rootDir>/tests/unit/purchase-orders.test.ts",
    "<rootDir>/tests/unit/marketing.test.ts",
    "<rootDir>/tests/unit/finance.test.ts",
    "<rootDir>/tests/unit/forecast.test.ts",
    "<rootDir>/tests/unit/quotes.test.ts",
  ],
  modulePathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  collectCoverageFrom: [
    "lib/server/**/*.ts",
    "lib/utils/**/*.ts",
    "!lib/**/*.d.ts",
  ],
};

export default createJestConfig(config);
