/** Splits items into consecutive chunks of at most `size` items. */
export function chunk<Item>(items: readonly Item[], size: number): Item[][] {
  if (size < 1) {
    throw new Error('Chunk size must be at least 1');
  }
  const chunks: Item[][] = [];
  for (let start = 0; start < items.length; start += size) {
    chunks.push(items.slice(start, start + size));
  }
  return chunks;
}
