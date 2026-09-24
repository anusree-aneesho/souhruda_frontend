// src/utils/orderPricing.js
//
// Package-matching + package-aware pricing for the New Order → Select Tests
// step. Two separate concerns live here, on purpose:
//
//  1. matchPackages()      — pure "detection": given the tests currently
//                             ticked, which active packages fully match and
//                             which are a near-miss? Never changes price.
//  2. computeOrderPricing() — pure "pricing": given the tests ticked AND the
//                             package IDs the staff explicitly applied
//                             (by clicking "Apply Package"), work out the
//                             bill. A package that was applied but no longer
//                             fully matches (because a required test was
//                             unticked) is silently excluded here — the
//                             caller is responsible for noticing that and
//                             dropping it from applied state (see
//                             SelectTestsStep's auto-revert effect).
//
// Mirrored server-side in OrderService::priceTests() — the backend re-checks
// "is_active" + "every package test is present" itself and never trusts a
// price from the client, so this file only controls what the STAFF SEES
// before submitting; it is not the source of truth for billing.

function toId(value) {
  // Selected test ids and package/test ids from the API aren't guaranteed to
  // be the same type (e.g. one path stores strings, the other numbers), so
  // every comparison in this file goes through this normalizer.
  return String(value);
}
export { toId };

function packageTests(pkg) {
  return pkg.lab_tests || pkg.tests || [];
}

function individualTotalFor(tests) {
  return tests.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
}

function savingsFor(individualTotal, packagePrice) {
  // Never show a negative or misleading "save ₹0" when the package isn't
  // actually cheaper than buying the tests separately.
  return Math.max(0, individualTotal - packagePrice);
}

/**
 * Detects, for the tests currently selected, which active packages are a
 * full match (every required test is selected) and which are a partial
 * match (at least one required test selected, but not all).
 *
 * @param {Array<{id:number|string, price:number}>} selectedTests
 * @param {Array} packages - raw package objects from getTestPackages()
 * @returns {{ fullMatches: Array, partialMatches: Array }}
 */
export function matchPackages(selectedTests, packages = []) {
  const selectedIds = new Set(selectedTests.map((t) => toId(t.id)));

  const fullMatches = [];
  const partialMatches = [];

  for (const pkg of packages) {
    if (!pkg.is_active) continue; // inactive packages are never offered

    const tests = packageTests(pkg);
    if (tests.length === 0) continue; // package has no tests configured — nothing to match

    const matchedTests = tests.filter((t) => selectedIds.has(toId(t.id)));
    const missingTests = tests.filter((t) => !selectedIds.has(toId(t.id)));

    if (matchedTests.length === 0) continue; // staff hasn't touched this package at all — stay silent

    const individualTotal = individualTotalFor(tests);
    const price = Number(pkg.price) || 0;
    const info = {
      id: pkg.id,
      name: pkg.name,
      price,
      testIds: tests.map((t) => t.id),
      individualTotal,
      savings: savingsFor(individualTotal, price),
      missingTests,
    };

    if (missingTests.length === 0) {
      fullMatches.push(info);
    } else {
      partialMatches.push(info);
    }
  }

  return { fullMatches, partialMatches };
}

/**
 * Prices the order: applied packages (explicitly clicked "Apply Package" AND
 * still fully matching) are billed at their package price; every other
 * selected test is billed at its own actual price.
 *
 * @param {Array<{id:number|string, price:number}>} selectedTests
 * @param {Array} packages
 * @param {Array<number|string>} appliedPackageIds
 */
/**
 * Groups an already-placed order's tests by the package each was actually
 * billed under.
 *
 * Unlike matchPackages()/computeOrderPricing() above — which re-detect
 * matches against the full package catalog for the *in-progress* New Order
 * flow — this works off data that already came back from the server for an
 * *existing* order: each test carries the packageId/packageName/packagePrice
 * it was billed under (order_items.test_package_id, resolved server-side in
 * OrderService::priceTests() and persisted at order-creation time). So this
 * is just a display grouping, not a re-match; a test with no packageId is
 * simply priced individually.
 *
 * @param {Array<{id, price, packageId?, packageName?, packagePrice?}>} tests
 * @returns {{ packageGroups: Array<{id, name, price, tests: Array}>, individualTests: Array }}
 */
export function groupTestsByPackage(tests) {
  const packageGroups = [];
  const groupsById = new Map();
  const individualTests = [];

  for (const test of tests) {
    if (test.packageId != null) {
      const key = toId(test.packageId);
      let group = groupsById.get(key);
      if (!group) {
        group = {
          id: test.packageId,
          name: test.packageName || "Package",
          price: Number(test.packagePrice) || 0,
          tests: [],
        };
        groupsById.set(key, group);
        packageGroups.push(group);
      }
      group.tests.push(test);
    } else {
      individualTests.push(test);
    }
  }

  return { packageGroups, individualTests };
}

export function computeOrderPricing(selectedTests, packages = [], appliedPackageIds = []) {
  const appliedIdSet = new Set(appliedPackageIds.map(toId));
  const { fullMatches } = matchPackages(selectedTests, packages);

  const appliedPackages = fullMatches
    .filter((m) => appliedIdSet.has(toId(m.id)))
    .map((m) => ({
      ...m,
      tests: selectedTests.filter((t) => m.testIds.some((id) => toId(id) === toId(t.id))),
    }));

  const coveredTestIds = new Set();
  const packageByTestId = {};
  appliedPackages.forEach((pkg) => {
    pkg.testIds.forEach((id) => {
      coveredTestIds.add(toId(id));
      packageByTestId[toId(id)] = pkg.id;
    });
  });

  const individualTests = selectedTests.filter((t) => !coveredTestIds.has(toId(t.id)));

  const packagesTotal = appliedPackages.reduce((sum, p) => sum + p.price, 0);
  const individualTotal = individualTotalFor(individualTests);

  return {
    total: packagesTotal + individualTotal,
    appliedPackages,
    individualTests,
    packageByTestId,
  };
}
