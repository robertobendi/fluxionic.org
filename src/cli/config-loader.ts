import { pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs/promises';
import { FieldDefinition } from '../modules/content/content.types.js';

export interface DefinedCollection {
  slug: string;
  name: string;
  fields: FieldDefinition[];
  permissions?: { editor?: 'write' | 'read' | 'none'; viewer?: 'read' | 'none' };
  isForm?: boolean;
}

export interface SlatestackConfig {
  collections: DefinedCollection[];
}

/**
 * Identity helper — kept so config files read the same as the docs:
 *   defineCollection({ slug, name, fields })
 * ...even though it's just a pass-through today.
 */
export function defineCollection(def: DefinedCollection): DefinedCollection {
  return def;
}

async function loadWithTsx(absPath: string): Promise<SlatestackConfig> {
  // tsx provides a loader that can be invoked via dynamic import when the
  // parent process runs under tsx. When the CLI is compiled and run from
  // dist/, we rely on the config being built alongside. For DX, we try
  // dynamic import first and fall back to esbuild-less plain evaluation.
  const url = pathToFileURL(absPath).href;
  const mod = await import(url);
  const config = (mod.default ?? mod) as SlatestackConfig;
  if (!config || !Array.isArray(config.collections)) {
    throw new Error(`${absPath} must export a config with { collections: [...] }`);
  }
  return config;
}

export async function loadConfig(cwd: string = process.cwd()): Promise<SlatestackConfig> {
  const candidates = ['slatestack.config.ts', 'slatestack.config.js', 'slatestack.config.mjs'];
  for (const name of candidates) {
    const full = path.join(cwd, name);
    try {
      await fs.access(full);
      return loadWithTsx(full);
    } catch {
      // try next
    }
  }
  throw new Error(`No slatestack.config.{ts,js,mjs} found in ${cwd}`);
}

export async function writeConfigFromCollections(
  collections: DefinedCollection[],
  filePath: string
): Promise<void> {
  const body = `import { defineCollection } from "slatestack";\n\nexport default {\n  collections: [\n${collections
    .map((c) => {
      const lines = [];
      lines.push('    defineCollection({');
      lines.push(`      slug: ${JSON.stringify(c.slug)},`);
      lines.push(`      name: ${JSON.stringify(c.name)},`);
      lines.push(`      fields: ${JSON.stringify(c.fields, null, 2).replace(/\n/g, '\n      ')},`);
      if (c.permissions) lines.push(`      permissions: ${JSON.stringify(c.permissions)},`);
      if (c.isForm) lines.push(`      isForm: true,`);
      lines.push('    }),');
      return lines.join('\n');
    })
    .join('\n')}\n  ],\n};\n`;
  await fs.writeFile(filePath, body, 'utf8');
}
