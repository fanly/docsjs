#!/usr/bin/env node

import { spawnSync } from "child_process";
import fs from "fs/promises";
import path from "path";

async function preMergeValidation() {
  console.log("Running Pre-Merge Validation Suite...\n");

  let validationPassed = true;
  const checks = [];

  console.log("Checking architecture component completeness...");
  const requiredFiles = [
    "src/engine/core.ts",
    "src/pipeline/manager.ts",
    "src/pipeline/types.ts",
    "src/plugins-v2/manager.ts",
    "src/plugins-v2/types.ts",
    "src/profiles/profile-manager.ts",
    "src/ast/types.ts",
    "src/ast/utils.ts",
  ];

  for (const file of requiredFiles) {
    try {
      await fs.access(file);
      console.log(`  OK ${file}`);
    } catch (error) {
      console.error(`  MISSING: ${file}`);
      validationPassed = false;
      checks.push({ check: `File Presence: ${file}`, status: "FAIL", error });
    }
  }

  console.log("\nRunning test suite...");
  try {
    const testResult = spawnSync("vp", ["test", "run", "--passWithNoTests"], {
      stdio: "pipe",
      cwd: process.cwd(),
    });

    if (testResult.status === 0) {
      console.log("  OK All tests passed");
      checks.push({ check: "Test Suite", status: "PASS" });
    } else {
      console.error("  FAIL Tests failed:");
      console.error(testResult.stderr?.toString() || testResult.stdout?.toString());
      validationPassed = false;
      checks.push({ check: "Test Suite", status: "FAIL", error: testResult.stderr?.toString() });
    }
  } catch (error) {
    console.error("  FAIL Test execution failed:", error);
    validationPassed = false;
    checks.push({ check: "Test Execution", status: "FAIL", error: error.message });
  }

  console.log("\nChecking API compatibility...");
  try {
    const {
      parseDocxToHtmlSnapshot,
      parseDocxToHtmlSnapshotWithReport,
      CoreEngine,
      SYSTEM_PROFILES,
    } = await import("./dist/index.js");

    if (typeof parseDocxToHtmlSnapshot === "function") {
      console.log("  OK Backward compatible API available");
      checks.push({ check: "Backward Compatibility", status: "PASS" });
    } else {
      throw new Error("parseDocxToHtmlSnapshot not a function");
    }

    if (typeof CoreEngine === "function") {
      console.log("  OK New Core Engine available");
      checks.push({ check: "Core Engine v2", status: "PASS" });
    } else {
      throw new Error("CoreEngine not a constructor");
    }

    if (SYSTEM_PROFILES && Object.keys(SYSTEM_PROFILES).length >= 4) {
      console.log("  OK System profiles available");
      checks.push({ check: "System Profiles", status: "PASS" });
    } else {
      throw new Error("System profiles invalid");
    }
  } catch (error) {
    console.error("  FAIL API compatibility check failed:", error);
    validationPassed = false;
    checks.push({ check: "API Compatibility", status: "FAIL", error: error.message });
  }

  console.log("\nRunning performance smoke test...");
  try {
    const start = performance.now();

    const TestEngine = await import("./dist/index.js").then((m) => m.CoreEngine);
    const testEngine = new TestEngine();

    const initTime = performance.now() - start;

    if (initTime < 200) {
      console.log(`  OK Engine initialization: ${initTime.toFixed(1)}ms`);
      checks.push({
        check: "Engine Init Performance",
        status: "PASS",
        value: `${initTime.toFixed(1)}ms`,
      });
    } else {
      console.log(`  SLOW Engine initialization: ${initTime.toFixed(1)}ms`);
      checks.push({
        check: "Engine Init Performance",
        status: "SLOW",
        value: `${initTime.toFixed(1)}ms`,
      });
    }

    testEngine?.destroy?.();
  } catch (error) {
    console.error("  FAIL Performance test failed:", error);
    validationPassed = false;
    checks.push({ check: "Performance Smoke Test", status: "FAIL", error: error.message });
  }

  console.log("\nVerifying build capability...");
  try {
    const buildResult = spawnSync("vp", ["build"], {
      stdio: "pipe",
      cwd: process.cwd(),
      timeout: 30000,
    });

    if (buildResult.status === 0) {
      console.log("  OK Build succeeded");
      checks.push({ check: "Build Capability", status: "PASS" });
    } else {
      console.error("  FAIL Build failed:", buildResult.stderr?.toString() || "Build timeout");
      validationPassed = false;
      checks.push({
        check: "Build Capability",
        status: "FAIL",
        error: buildResult.stderr?.toString(),
      });
    }
  } catch (error) {
    console.error("  FAIL Build execution failed:", error);
    validationPassed = false;
    checks.push({ check: "Build Execution", status: "FAIL", error: error.message });
  }

  console.log("\nValidation Summary:");
  console.log("=====================");
  for (const check of checks) {
    const statusSymbol = check.status === "PASS" ? "OK" : check.status === "SLOW" ? "SLOW" : "FAIL";
    console.log(
      `${statusSymbol} ${check.check}: ${check.status}${check.value ? ` (${check.value})` : ""}`,
    );
  }

  console.log(`\nOverall Status: ${validationPassed ? "ALL CHECKS PASSED" : "VALIDATION FAILED"}`);

  if (!validationPassed) {
    console.log("\nCRITICAL: Merge should not proceed until all validations pass");
    process.exit(1);
  }

  console.log("\nPre-Merge Validation Complete - Ready for merge!");
  console.log("All platform architecture components verified and passing");
}

preMergeValidation().catch((error) => {
  console.error("Pre-merge validation failed:", error);
  process.exit(1);
});
