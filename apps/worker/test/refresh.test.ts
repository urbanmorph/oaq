import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanStationName } from "../src/refresh";

test("cleanStationName strips trailing agency suffix", () => {
  assert.equal(cleanStationName("Ashok Vihar, Delhi - DPCC"), "Ashok Vihar");
  assert.equal(cleanStationName("FTI Kidwai Nagar, Kanpur - UPPCB"), "FTI Kidwai Nagar");
  assert.equal(cleanStationName("Ratandeep Housing Society, Solapur - MPCB"), "Ratandeep Housing Society");
  assert.equal(cleanStationName("Suryakiran Bhawan NCL, Singrauli - MPPCB"), "Suryakiran Bhawan NCL");
});

test("cleanStationName preserves names without the pattern", () => {
  assert.equal(cleanStationName("Anand Vihar"), "Anand Vihar");
  assert.equal(cleanStationName("Silk Board"), "Silk Board");
  assert.equal(cleanStationName("Bandra Kurla Complex"), "Bandra Kurla Complex");
});

test("cleanStationName leaves names with non-agency tails alone", () => {
  // No trailing uppercase acronym → keep as-is.
  assert.equal(cleanStationName("Sector 62, Noida"), "Sector 62, Noida");
});
