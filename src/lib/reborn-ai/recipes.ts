import { craftingGrid, craftingSlot } from '@/lib/pages/crafting';
import type { AssistantBlock, KnowledgeDoc, RecipeItem } from '@/lib/reborn-ai/types';

export type Recipe = {
  item: string;
  middle: string;
  items: RecipeItem[];
};

const heading = /^##\s+(.+)$/;
const bullet = /^[*-]\s+(.+)$/;
const middleLine = /^middle:\s*(.+)$/i;
const amountLine = /^(.+?)\s*[×x]\s*(\d+)$/i;

const romans: Record<string, string> = { '1': 'i', '2': 'ii', '3': 'iii' };

const matchKey = (value: string) => value
  .toLowerCase()
  .replace(/\d+/g, (digits) => romans[digits] ?? digits)
  .replace(/[^a-z0-9]/g, '');

function parseDoc(body: string) {
  const recipes: Recipe[] = [];
  let item = '';
  let middle = '';
  let items: RecipeItem[] = [];
  let inside = false;

  const flush = () => {
    if (item && middle) recipes.push({ item, middle, items });
    middle = '';
    items = [];
    inside = false;
  };

  for (const raw of body.split(/\r?\n/)) {
    const line = raw.trim();
    const head = line.match(heading);

    if (head) {
      flush();
      item = head[1].trim();
      continue;
    }

    if (/^recipe:?$/i.test(line)) {
      inside = true;
      continue;
    }

    if (!inside) continue;

    const part = line.match(bullet);
    if (!part) {
      if (line) inside = false;
      continue;
    }

    const core = part[1].match(middleLine);
    if (core) {
      middle = core[1].trim();
      continue;
    }

    const amount = part[1].match(amountLine);
    if (amount) items.push({ name: amount[1].trim(), quantity: Number(amount[2]) });
    else items.push({ name: part[1].trim(), quantity: 1 });
  }

  flush();
  return recipes;
}

export function parseRecipes(docs: KnowledgeDoc[]) {
  return docs
    .filter((doc) => doc.category === 'crafting')
    .flatMap((doc) => parseDoc(doc.body));
}

export function findRecipe(name: string, recipes: Recipe[]) {
  const search = matchKey(name);
  if (!search) return null;

  return recipes.find((recipe) => matchKey(recipe.item) === search)
    ?? recipes.find((recipe) => matchKey(recipe.item).includes(search))
    ?? recipes.find((recipe) => search.includes(matchKey(recipe.item)))
    ?? null;
}

export const recipeBlock = (recipe: Recipe): AssistantBlock => ({
  type: 'recipe',
  item: recipe.item,
  middle: craftingSlot(recipe.middle),
  slots: craftingGrid(recipe.items),
});
