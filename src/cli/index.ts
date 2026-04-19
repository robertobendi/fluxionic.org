#!/usr/bin/env node
import 'dotenv/config';
import path from 'path';
import fs from 'fs/promises';
import { loadConfig, writeConfigFromCollections } from './config-loader.js';
import { applyDiff, diff } from './migrate.js';
import { generateTypes } from './codegen.js';
import { listCollections } from '../modules/content/collection.service.js';

function usage(): void {
  console.log(`slatestack CLI

Commands:
  slatestack migrate [--force]       Apply slatestack.config.ts to the database
  slatestack diff                    Print pending changes without applying
  slatestack pull                    Export current DB collections to slatestack.config.ts
  slatestack gen [--out <path>]      Generate typed content-types.ts
`);
}

async function cmdMigrate(args: string[]): Promise<void> {
  const force = args.includes('--force');
  const config = await loadConfig();
  const { applied, warnings } = await applyDiff(config.collections, { force });
  console.log(`Applied ${applied.length} change(s):`);
  for (const c of applied) {
    const label = c.fieldName ? `${c.collectionSlug}.${c.fieldName}` : c.collectionSlug;
    console.log(`  - ${c.kind} ${label}`);
  }
  for (const w of warnings) console.warn(`! ${w}`);
}

async function cmdDiff(): Promise<void> {
  const config = await loadConfig();
  const changes = await diff(config.collections);
  if (changes.length === 0) {
    console.log('No pending changes.');
    return;
  }
  for (const c of changes) {
    const label = c.fieldName ? `${c.collectionSlug}.${c.fieldName}` : c.collectionSlug;
    console.log(`  ${c.kind.padEnd(18)} ${label}`);
  }
}

async function cmdPull(): Promise<void> {
  const collections = await listCollections();
  const defs = collections.map((c) => ({
    slug: c.slug,
    name: c.name,
    fields: c.fields,
  }));
  const outPath = path.resolve(process.cwd(), 'slatestack.config.ts');
  await writeConfigFromCollections(defs, outPath);
  console.log(`Wrote ${outPath} (${defs.length} collection(s))`);
}

async function cmdGen(args: string[]): Promise<void> {
  const outIdx = args.indexOf('--out');
  const outPath = outIdx >= 0 ? args[outIdx + 1] : 'generated/content-types.ts';
  const collections = await listCollections();
  const code = generateTypes(collections);
  const absPath = path.resolve(process.cwd(), outPath);
  await fs.mkdir(path.dirname(absPath), { recursive: true });
  await fs.writeFile(absPath, code, 'utf8');
  console.log(`Generated ${absPath} (${collections.length} collection(s))`);
}

async function main(): Promise<void> {
  const [cmd, ...rest] = process.argv.slice(2);
  switch (cmd) {
    case 'migrate':
      await cmdMigrate(rest);
      break;
    case 'diff':
      await cmdDiff();
      break;
    case 'pull':
      await cmdPull();
      break;
    case 'gen':
      await cmdGen(rest);
      break;
    case undefined:
    case 'help':
    case '--help':
    case '-h':
      usage();
      break;
    default:
      console.error(`Unknown command: ${cmd}`);
      usage();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err?.stack ?? err);
  process.exit(1);
});
