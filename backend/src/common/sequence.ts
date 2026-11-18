import type { Model } from 'mongoose';

/**
 * Next sequential number from the highest existing `PREFIX-NNNNNN` value.
 * Safer than countDocuments()+1 when records can be deleted.
 */
export async function nextSequenceNumber(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: Model<any>,
  field: string,
  prefix: string,
): Promise<string> {
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  const docs = await model
    .find({ [field]: { $regex: `^${prefix}-\\d+$` } })
    .select({ [field]: 1 })
    .lean()
    .exec();

  let max = 0;
  for (const doc of docs) {
    const match = pattern.exec(String(doc?.[field] ?? ''));
    if (match) {
      max = Math.max(max, Number(match[1]));
    }
  }

  return `${prefix}-${String(max + 1).padStart(6, '0')}`;
}
