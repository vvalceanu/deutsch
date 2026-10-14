/**
 * Serves words one at a time, refilling from a loader whenever it runs dry.
 *
 * The loader is whatever fetches a batch — a real endpoint or a stub. Keeping
 * the refill in here is what makes play endless without the UI knowing about
 * batches at all.
 */

export function createQueue(loadBatch) {
  let buffer = [];

  return {
    async next() {
      if (buffer.length === 0) {
        buffer = [...(await loadBatch())];
        if (buffer.length === 0) throw new Error('The word loader returned no words.');
      }
      return buffer.shift();
    },
  };
}
