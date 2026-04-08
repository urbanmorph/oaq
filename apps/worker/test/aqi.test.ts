// Run with: pnpm -C apps/worker test
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeAqi, aqiBand } from "../src/aqi";

// Reference values from CPCB breakpoints
// https://cpcb.nic.in/National-Air-Quality-Index/

test("PM2.5 30 → sub-index 50 (Good upper bound)", () => {
  assert.equal(computeAqi({ pm25: 30 }), 50);
});

test("PM2.5 60 → sub-index 100 (Satisfactory upper bound)", () => {
  assert.equal(computeAqi({ pm25: 60 }), 100);
});

test("PM2.5 90 → sub-index 200 (Moderate upper bound)", () => {
  assert.equal(computeAqi({ pm25: 90 }), 200);
});

test("PM2.5 120 → sub-index 300 (Poor upper bound)", () => {
  assert.equal(computeAqi({ pm25: 120 }), 300);
});

test("PM2.5 250 → sub-index 400 (Very Poor upper bound)", () => {
  assert.equal(computeAqi({ pm25: 250 }), 400);
});

test("PM2.5 500 → sub-index 500 (Severe cap)", () => {
  assert.equal(computeAqi({ pm25: 500 }), 500);
});

test("PM2.5 above top breakpoint saturates at 500", () => {
  assert.equal(computeAqi({ pm25: 750 }), 500);
});

test("PM10 250 → 200", () => {
  assert.equal(computeAqi({ pm10: 250 }), 200);
});

test("CO 2.0 mg/m³ → 100", () => {
  assert.equal(computeAqi({ co: 2.0 }), 100);
});

test("Overall AQI = max of sub-indices", () => {
  // PM2.5 = 45 → ~75, PM10 = 250 → 200, NO2 = 10 → ~12 → max = 200
  assert.equal(computeAqi({ pm25: 45, pm10: 250, no2: 10 }), 200);
});

test("No pollutants → null", () => {
  assert.equal(computeAqi({}), null);
});

test("Negative / non-finite values ignored", () => {
  assert.equal(computeAqi({ pm25: -1, pm10: 100 }), 100);
  assert.equal(computeAqi({ pm25: NaN }), null);
});

test("aqiBand classification", () => {
  assert.equal(aqiBand(0), "good");
  assert.equal(aqiBand(50), "good");
  assert.equal(aqiBand(51), "satisfactory");
  assert.equal(aqiBand(100), "satisfactory");
  assert.equal(aqiBand(101), "moderate");
  assert.equal(aqiBand(200), "moderate");
  assert.equal(aqiBand(201), "poor");
  assert.equal(aqiBand(300), "poor");
  assert.equal(aqiBand(301), "vpoor");
  assert.equal(aqiBand(400), "vpoor");
  assert.equal(aqiBand(401), "severe");
  assert.equal(aqiBand(500), "severe");
  assert.equal(aqiBand(null), "unknown");
});
