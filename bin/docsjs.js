#!/usr/bin/env node

/**
 * DocsJS CLI
 * 
 * Command-line interface for document transformation.
 * 
 * Usage:
 *   docsjs <input> [options]
 *   docsjs convert <input> -o <output> --profile <profile>
 *   docsjs serve [--port <port>]
 *   docsjs --help
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface CLIOptions {
  output?: string;
  profile?: string;
  format?: string;
  watch?: boolean;
  port?: string;
  help?: boolean;
  verbose?: boolean;
}

const HELP_TEXT = `
DocsJS - Document Transformation Platform

USAGE:
  docsjs <command> [options]

COMMANDS:
  convert <input>     Convert document to specified format
  serve               Start local development server
  profiles            List available profiles
  help                Show this help message

OPTIONS:
  -o, --output <path>     Output file path
  -f, --format <format>   Output format (html, markdown, json)
  -p, --profile <name>    Processing profile (default, knowledge-base, exam-paper, enterprise)
  --watch                 Watch for file changes
  --port <number>         Server port (default: 3000)
  -v, --verbose           Verbose output
  -h, --help              Show help

EXAMPLES:
  docsjs convert document.docx -o output.html
  docsjs convert document.docx -f markdown -p knowledge-base
  docsjs serve --port 8080
  docsjs profiles

PROFILES:
  default           - General purpose conversion
  knowledge-base    - High-fidelity for documentation
  exam-paper        - Academic papers and exams
  enterprise        - Security and compliance focused
`;

// Simple argument parser
function parseArgs(args: string[]): { command: string; input?: string; options: CLIOptions } {
  const options: CLIOptions = {};
  let command = "";
  let input = "";
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === "-o" || arg === "--output") {
      options.output = args[++i];
    } else if (arg === "-f" || arg === "--format") {
      options.format = args[++i];
    } else if (arg === "-p" || arg === "--profile") {
      options.profile = args[++i];
    } else if (arg === "--port") {
      options.port = args[++i];
    } else if (arg === "-v" || arg === "--verbose") {
      options.verbose = true;
    } else if (arg === "-h" || arg === "--help") {
      options.help = true;
    } else if (arg === "--watch") {
      options.watch = true;
    } else if (!arg.startsWith("-")) {
      if (!command) {
        command = arg;
      } else if (!input) {
        input = arg;
      }
    }
  }
  
  return { command, input, options };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { command, input, options } = args;

  if (options.help) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  switch (command) {
    case "convert":
      await handleConvert(input, options);
      break;

    case "serve":
      await handleServe(options);
      break;

    case "profiles":
      handleProfiles();
      break;

    case "help":
      console.log(HELP_TEXT);
      break;

    default:
      if (input) {
        // Assume convert if input provided
        await handleConvert(input, options);
      } else {
        console.log(HELP_TEXT);
        process.exit(1);
      }
  }
}

async function handleConvert(input: string | undefined, options: CLIOptions) {
  if (!input) {
    console.error("Error: Input file required");
    process.exit(1);
  }

  const output = options.output;
  const format = options.format || "html";
  const profileName = options.profile || "default";
  const verbose = options.verbose || false;

  if (verbose) {
    console.log(`Input: ${input}`);
    console.log(`Output: ${output || "stdout"}`);
    console.log(`Format: ${format}`);
    console.log(`Profile: ${profileName}`);
  }

  if (!existsSync(input)) {
    console.error(`Error: Input file not found: ${input}`);
    process.exit(1);
  }

  try {
    // Dynamic import to avoid loading engine in CLI help mode
    const { CoreEngine } = await import("./dist/index.js");
    const { SYSTEM_PROFILES } = await import("./dist/index.js");

    // Initialize engine
    const engine = new CoreEngine({ debug: verbose });

    // Register profiles
    for (const [id, profile] of Object.entries(SYSTEM_PROFILES)) {
      engine.registerProfile(profile);
    }

    // Apply profile
    engine.applyProfile(profileName);

    // Read input file
    const inputPath = resolve(process.cwd(), input);
    const fileContent = readFileSync(inputPath);

    // Create File-like object (Node.js doesn't have File API natively)
    const file = new Blob([fileContent], { type: "application/octet-stream" });
    Object.defineProperty(file, "name", { value: inputPath });

    if (verbose) {
      console.log("Processing...");
    }

    // Transform
    const result = await engine.transformDocument(file as unknown as File, profileName);

    // Output
    if (output) {
      const outputPath = resolve(process.cwd(), output);
      writeFileSync(outputPath, result.output);
      console.log(`✓ Saved to ${output}`);
    } else {
      console.log(result.output);
    }

    if (verbose && result.diagnostics) {
      console.log("\nDiagnostics:");
      if (result.diagnostics.errors?.length) {
        console.log(`  Errors: ${result.diagnostics.errors.length}`);
      }
      if (result.diagnostics.warnings?.length) {
        console.log(`  Warnings: ${result.diagnostics.warnings.length}`);
      }
      if (result.diagnostics.stats) {
        console.log(`  Time: ${result.diagnostics.stats.total_time_ms}ms`);
      }
    }

  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

async function handleServe(options: CLIOptions) {
  const port = parseInt(options.port || "3000");
  const verbose = options.verbose || false;

  console.log(`Starting DocsJS server on port ${port}...`);

  try {
    const { DocsJSServer } = await import("./dist/index.js");
    const { CoreEngine, SYSTEM_PROFILES } = await import("./dist/index.js");

    const server = new DocsJSServer({ port, logging: verbose });
    
    server.setRequestHandler(async (req) => {
      const engine = new CoreEngine({ debug: verbose });
      for (const [id, profile] of Object.entries(SYSTEM_PROFILES)) {
        engine.registerProfile(profile);
      }
      engine.applyProfile(req.profile || 'default');

      if (!req.file) {
        throw new Error('No file provided');
      }

      const buffer = Buffer.from(req.file, 'base64');
      const file = new Blob([buffer], { type: 'application/octet-stream' });
      Object.defineProperty(file, 'name', { value: 'input.docx' });

      const result = await engine.transformDocument(file as unknown as File, req.profile || 'default');
      
      return {
        output: result.output,
        outputFormat: req.outputFormat,
        profile: req.profile || 'default',
        metrics: result.diagnostics?.stats,
        diagnostics: result.diagnostics?.errors?.concat(result.diagnostics?.warnings || []),
      };
    });

    await server.start();
  } catch (error) {
    console.error(`Failed to start server: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}
  const port = parseInt(options.port || "3000");
  const verbose = options.verbose || false;

  console.log(`Starting DocsJS server on port ${port}...`);
  console.log("(Server implementation placeholder - needs HTTP server setup)");

  // This would start an HTTP server with the transformation API
  // For now, just a placeholder
}

function handleProfiles() {
  console.log("Available Profiles:\n");
  console.log("  default           - General purpose conversion");
  console.log("  knowledge-base   - High-fidelity for documentation");
  console.log("  exam-paper       - Academic papers and exams");
  console.log("  enterprise       - Security and compliance focused");
}

// Run
main();
