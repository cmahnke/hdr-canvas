import { existsSync, rmSync, readFileSync } from "fs";
import { resolve } from "path";
import git from "isomorphic-git";
import http from "isomorphic-git/http/node";
import * as fs from "fs";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const argv = yargs(hideBin(process.argv))
  .option("directory", {
    alias: "d",
    type: "string",
    default: process.cwd(),
    description: "The root directory containing the .gitmodules file.",
  })
  .option("force", {
    alias: "f",
    type: "boolean",
    default: false,
    description: "Force a clean checkout by removing existing directories.",
  })
  .option("verbose", {
    alias: "v",
    type: "boolean",
    default: false,
    description: "Show verbose output during the cloning process.",
  })
  .option("list", {
    alias: "l",
    type: "boolean",
    default: false,
    description: "List submodules and their directories in a table.",
  })
  .option("clean", {
    alias: "c",
    type: "boolean",
    default: false,
    description: "Remove all directories listed in the .gitmodules file.",
  })
  .option("timeout", {
    alias: "t",
    type: "number",
    default: 120000, // Default timeout of 120 seconds (120000ms)
    description: "Set the timeout for git operations in milliseconds.",
  })
  .check((argv) => {
    const actionFlags = [argv.list, argv.clean];
    const trueFlags = actionFlags.filter((flag) => flag === true);
    if (trueFlags.length > 1) {
      throw new Error("Please use only one of the action flags: --list or --clean.");
    }
    return true;
  })
  .help()
  .alias("help", "h").argv;

function getSubmoduleEntries(dir) {
  const gitmodulesPath = resolve(dir, ".gitmodules");
  if (!existsSync(gitmodulesPath)) {
    console.error(`Error: No .gitmodules file found in the specified directory: ${dir}`);
    process.exit(1);
  }

  const gitmodulesContent = readFileSync(gitmodulesPath, "utf8");
  const submoduleEntries = gitmodulesContent.split("\n\n").filter((entry) => entry.trim().startsWith("[submodule"));
  if (submoduleEntries.length === 0) {
    console.log("No submodules found in .gitmodules file. Exiting.");
    process.exit(0);
  }

  const submodules = [];
  for (const entry of submoduleEntries) {
    const lines = entry.split("\n").map((line) => line.trim());
    let pathValue, urlValue;
    for (const line of lines) {
      if (line.startsWith("path =")) {
        pathValue = line.split("=")[1].trim();
      } else if (line.startsWith("url =")) {
        urlValue = line.split("=")[1].trim();
      }
    }
    if (pathValue && urlValue) {
      submodules.push({ path: pathValue, url: urlValue });
    }
  }
  return submodules;
}

function printTable(data) {
  const table = [
    ["URL", "Path"],
    ["---", "---"],
  ];
  data.forEach((sub) => {
    table.push([`\`${sub.url}\``, `\`${sub.path}\``]);
  });

  const maxCols = [0, 0];
  table.forEach((row) => {
    maxCols[0] = Math.max(maxCols[0], row[0].length);
    maxCols[1] = Math.max(maxCols[1], row[1].length);
  });

  table.forEach((row) => {
    const formattedRow = `| ${row[0].padEnd(maxCols[0])} | ${row[1].padEnd(maxCols[1])} |`;
    console.log(formattedRow);
  });
}

async function main() {
  const dir = resolve(argv.directory);
  const submodules = getSubmoduleEntries(dir);

  if (argv.list) {
    console.log("Submodules in .gitmodules:");
    printTable(submodules);
    return;
  }

  if (argv.clean) {
    console.log("Removing submodule directories...");
    for (const sub of submodules) {
      const submoduleDir = resolve(dir, sub.path);
      if (existsSync(submoduleDir)) {
        console.log(`Removing directory: ${submoduleDir}`);
        rmSync(submoduleDir, { recursive: true, force: true });
      } else {
        console.log(`Directory not found, skipping: ${submoduleDir}`);
      }
    }
    console.log("Clean operation complete.");
    return;
  }

  for (const sub of submodules) {
    const submoduleDir = resolve(dir, sub.path);

    if (argv.verbose) {
      console.log(`Processing submodule:`);
      console.log(`  URL: ${sub.url}`);
      console.log(`  Path: ${submoduleDir}`);
    } else {
      console.log(`Cloning submodule from ${sub.url} into ${submoduleDir}...`);
    }

    try {
      if (argv.force && existsSync(submoduleDir)) {
        if (argv.verbose) {
          console.log(`Force flag enabled. Removing existing directory: ${submoduleDir}`);
        }
        rmSync(submoduleDir, { recursive: true, force: true });
      } else if (existsSync(submoduleDir)) {
        if (argv.verbose) {
          console.log(`Directory ${submoduleDir} already exists. Skipping clone.`);
        }
        continue;
      }

      await git.clone({
        fs: fs,
        http: { ...http, timeout: argv.timeout },
        dir: submoduleDir,
        url: sub.url,
        singleBranch: true,
        depth: 1,
      });

      console.log(`Successfully cloned submodule into ${submoduleDir}.`);
    } catch (error) {
      console.error(`Error cloning submodule into ${submoduleDir}:`, error.message);
    }
  }
}

main();
