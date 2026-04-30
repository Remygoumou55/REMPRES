#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { TextDecoder } = require("util");

const decoder = new TextDecoder("utf-8", { fatal: true });
const TEXT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".css", ".md", ".sql", ".yml", ".yaml"]);
const IGNORED_DIRS = new Set(["node_modules", ".git", ".next"]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const root = process.cwd();
const allFiles = walk(root);
const invalid = [];

for (const file of allFiles) {
  const ext = path.extname(file).toLowerCase();
  if (!TEXT_EXTENSIONS.has(ext)) continue;
  const bytes = fs.readFileSync(file);
  try {
    decoder.decode(bytes);
  } catch {
    invalid.push(path.relative(root, file));
  }
}

if (invalid.length > 0) {
  console.error("UTF-8 check failed. Invalid files:\n");
  for (const f of invalid) console.error(` - ${f}`);
  process.exit(1);
}

console.log("UTF-8 check passed.");