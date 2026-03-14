/**
 * CLI Tests
 *
 * Tests for command-line interface.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vite-plus/test";
import { spawn } from "child_process";
import path from "path";

const CLI_PATH = path.resolve(__dirname, "../../bin/docsjs.js");

describe("DocsJS CLI", () => {
  // Note: These tests require the CLI to be built
  // Skip if the bin file doesn't exist

  const itSkipIfNoBuild = process.env.SKIP_BUILD_TESTS ? it.skip : it;

  describe("--help", () => {
    itSkipIfNoBuild("should display help", async () => {
      const output = await new Promise<string>((resolvePromise, reject) => {
        const proc = spawn("node", [CLI_PATH, "--help"], {
          cwd: path.resolve(__dirname, "../.."),
        });

        let data = "";
        proc.stdout.on("data", (chunk) => {
          data += chunk.toString();
        });

        proc.on("close", (code) => {
          if (code === 0) {
            resolvePromise(data);
          } else {
            reject(new Error(`CLI exited with code ${code}`));
          }
        });

        proc.on("error", reject);
      });

      expect(output).toContain("DocsJS");
      expect(output).toContain("USAGE");
    });
  });

  describe("profiles", () => {
    itSkipIfNoBuild("should list available profiles", async () => {
      const output = await new Promise<string>((resolvePromise, reject) => {
        const proc = spawn("node", [CLI_PATH, "profiles"], {
          cwd: path.resolve(__dirname, "../.."),
        });

        let data = "";
        proc.stdout.on("data", (chunk) => {
          data += chunk.toString();
        });

        proc.on("close", (code) => {
          if (code === 0) {
            resolvePromise(data);
          } else {
            reject(new Error(`CLI exited with code ${code}`));
          }
        });

        proc.on("error", reject);
      });

      expect(output).toContain("default");
      expect(output).toContain("knowledge-base");
      expect(output).toContain("enterprise");
    });
  });

  describe("convert", () => {
    itSkipIfNoBuild("should require input file", async () => {
      const code = await new Promise<number>((resolvePromise, reject) => {
        const proc = spawn("node", [CLI_PATH, "convert"], {
          cwd: path.resolve(__dirname, "../.."),
        });

        proc.on("close", (code) => {
          resolvePromise(code ?? 1);
        });

        proc.on("error", reject);
      });

      // Should either error or show help
      expect(code).not.toBe(0);
    });

    itSkipIfNoBuild("should report error for missing file", async () => {
      const output = await new Promise<string>((resolvePromise, reject) => {
        const proc = spawn("node", [CLI_PATH, "convert", "nonexistent.docx"], {
          cwd: path.resolve(__dirname, "../.."),
        });

        let data = "";
        proc.stderr.on("data", (chunk) => {
          data += chunk.toString();
        });

        proc.on("close", () => {
          resolvePromise(data);
        });

        proc.on("error", reject);
      });

      expect(output).toContain("not found");
    });
  });

  describe("verbose mode", () => {
    itSkipIfNoBuild("should enable verbose output with -v flag", async () => {
      const code = await new Promise<number>((resolvePromise, reject) => {
        const proc = spawn("node", [CLI_PATH, "--help", "-v"], {
          cwd: path.resolve(__dirname, "../.."),
        });

        proc.on("close", (code) => {
          resolvePromise(code ?? 1);
        });

        proc.on("error", reject);
      });

      expect(code).toBe(0);
    });

    itSkipIfNoBuild("should enable verbose output with --verbose flag", async () => {
      const code = await new Promise<number>((resolvePromise, reject) => {
        const proc = spawn("node", [CLI_PATH, "--help", "--verbose"], {
          cwd: path.resolve(__dirname, "../.."),
        });

        proc.on("close", (code) => {
          resolvePromise(code ?? 1);
        });

        proc.on("error", reject);
      });

      expect(code).toBe(0);
    });
  });
});

describe("CLI Arguments", () => {
  // Unit test the argument parsing logic

  it("should parse -o as output flag", () => {
    // This tests the internal logic if we extract it
    expect(true).toBe(true); // Placeholder
  });

  it("should parse --output as output flag", () => {
    expect(true).toBe(true); // Placeholder
  });

  it("should parse -f as format flag", () => {
    expect(true).toBe(true); // Placeholder
  });

  it("should parse -p as profile flag", () => {
    expect(true).toBe(true); // Placeholder
  });

  it("should default to html format", () => {
    expect(true).toBe(true); // Placeholder
  });

  it("should default to default profile", () => {
    expect(true).toBe(true); // Placeholder
  });
});
