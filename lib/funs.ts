import { DisjointUnion } from "./types";

export async function fetchData(path: string) {
  const response = await fetch(path);
  return await response.json();
}

export function computeBreaks(
  min: number,
  max: number,
  width?: number,
  anchor?: number
) {
  const nBins = width ? Math.ceil((max - min) / width) + 1 : 10;
  width = width ?? (max - min) / (nBins - 1);
  anchor = anchor ?? min;

  const breaks = [];
  const breakMin = min - width + ((anchor - min) % width);

  for (let i = 0; i < nBins + 1; i++) breaks.push(breakMin + i * width);

  return breaks;
}

export function disjointUnion<
  T extends Record<string, any>,
  U extends Record<string, any>
>(object1: T, object2: U) {
  const result = {} as any;

  for (const k of Object.keys(object1)) result[k] = object1[k];
  for (let k of Object.keys(object2)) {
    let newK = k;
    while (newK in result) newK += "$";
    result[newK] = object2[k];
  }

  return result as DisjointUnion<T, U>;
}
