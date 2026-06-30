import { promises as fs } from "fs";
import path from "path";

/**
 * Tiny file-backed persistence for saved shortlists. Deliberately not a
 * database — for a single-user advisor a JSON file on disk is the right amount
 * of infrastructure, and it keeps `npm run dev` truly single-command with no
 * external services to boot.
 */

export interface SavedShortlist {
  id: string;
  createdAt: string;
  label: string;
  carIds: string[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "shortlists.json");

async function readAll(): Promise<SavedShortlist[]> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw) as SavedShortlist[];
  } catch {
    return [];
  }
}

async function writeAll(items: SavedShortlist[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(items, null, 2), "utf-8");
}

export async function listShortlists(): Promise<SavedShortlist[]> {
  const all = await readAll();
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveShortlist(
  label: string,
  carIds: string[]
): Promise<SavedShortlist> {
  const all = await readAll();
  const item: SavedShortlist = {
    id: `sl_${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    label: label.trim() || "My shortlist",
    carIds,
  };
  all.push(item);
  await writeAll(all);
  return item;
}

export async function deleteShortlist(id: string): Promise<void> {
  const all = await readAll();
  await writeAll(all.filter((s) => s.id !== id));
}
