import { compareAlphaNumeric, diff, minMax } from "@abartonicek/utilities";
import { Dataframe } from "./Dataframe";
import { NumMetadata } from "./Metadata";
import {
  IndexedVariable,
  NumVariable,
  RefVariable,
  StrVariable,
} from "./Variable";
import { computeBreaks } from "./funs";
import { PARENT, POSITONS } from "./symbols";
import { DisjointUnion, Variables } from "./types";

export type FactorLike<T extends Variables> = {
  cardinality(): number;
  uniqueIndices(): Set<number>;
  indices(): number[];
  data(): Dataframe<T>;
};

export class Factor<T extends Variables> implements FactorLike<T> {
  constructor(
    private _uniqueIndices: Set<number>,
    private _indices: number[],
    private _data: Dataframe<T>
  ) {}

  cardinality() {
    return this._uniqueIndices.size;
  }

  uniqueIndices() {
    return this._uniqueIndices;
  }

  indices() {
    return this._indices;
  }

  data() {
    return this._data;
  }

  product<U extends Variables>(other: FactorLike<U>) {
    return product(this, other);
  }

  nest<U extends Variables>(other: FactorLike<U>) {
    return product(this, other);
  }
}

export type FromOptions = { name?: string; labels?: string[]; sort?: boolean };

export function from(array: string[], options?: FromOptions) {
  const labels = options?.labels ?? Array.from(new Set(array));
  if (options?.sort ?? true) labels.sort(compareAlphaNumeric);

  let uniqueIndices = new Set<number>();
  const indices = [] as number[];
  const positions = [] as Set<number>[];

  for (let i = 0; i < labels.length; i++) positions.push(new Set());

  for (let i = 0; i < array.length; i++) {
    const index = labels.indexOf(array[i]);
    uniqueIndices.add(index);
    positions[index].add(i);
    indices.push(index);
  }

  uniqueIndices = new Set(Array.from(uniqueIndices).sort(diff));
  const data = Dataframe.of({
    label: StrVariable.of(labels),
    [POSITONS]: RefVariable.of(positions),
  });

  return new Factor(uniqueIndices, indices, data);
}

export type BinOptions = {
  name?: string;
  min?: number;
  max?: number;
  breaks?: number[];
  width?: number;
  anchor?: number;
};

export function bin(array: number[], options?: BinOptions) {
  let { name, min, max, width, anchor, breaks } = options ?? {};

  if (!min || !max) [min, max] = minMax(array);
  if (!breaks) breaks = computeBreaks(min, max, width, anchor);

  const uniqueIndices = new Set<number>();
  const indices = [] as number[];
  const positionsMap = {} as Record<number, Set<number>>;

  for (let i = 0; i < array.length; i++) {
    const index = breaks.findIndex((br) => br >= array[i]) - 1;
    if (!positionsMap[index]) positionsMap[index] = new Set();

    positionsMap[index].add(i);
    uniqueIndices.add(index);
    indices.push(index);
  }

  const sortedIndices = new Set(Array.from(uniqueIndices).sort(diff));

  const binMin = [] as number[];
  const binMax = [] as number[];

  for (const i of sortedIndices) {
    binMin.push(breaks[i]);
    binMax.push(breaks[i + 1]);
  }

  const metadata = NumMetadata.from(breaks, name);

  const cols = {
    bin0: NumVariable.of(binMin, { metadata }),
    bin1: NumVariable.of(binMax, { metadata }),
    [POSITONS]: RefVariable.of(Object.values(positionsMap)),
  };

  const data = Dataframe.of(cols);

  return new Factor(sortedIndices, indices, data);
}

export function product<T extends Variables, U extends Variables>(
  factor1: FactorLike<T>,
  factor2: FactorLike<U>
) {
  const firstCoarser = factor1.cardinality() < factor2.cardinality();
  const coarser = firstCoarser ? factor1 : factor2;
  const finer = firstCoarser ? factor2 : factor1;

  const k = finer.cardinality() + 1;

  const coarserIndices = coarser.indices();
  const finerIndices = finer.indices();
  const factor1Indices = factor1.indices();
  const factor2Indices = factor2.indices();

  const indices = [] as number[];
  const uniqueIndices = new Set<number>();

  const positionsMap = {} as Record<number, Set<number>>;
  const parentMap = {} as Record<number, number>;
  const factor1Map = {} as Record<number, number>;
  const factor2Map = {} as Record<number, number>;

  for (let i = 0; i < finerIndices.length; i++) {
    const index = k * coarserIndices[i] + finerIndices[i];

    if (!factor1Map[index]) {
      factor1Map[index] = factor1Indices[i];
      factor2Map[index] = factor2Indices[i];
      positionsMap[index] = new Set();
      parentMap[index] = factor1Indices[i];
    }

    indices.push(index);
    uniqueIndices.add(index);
    positionsMap[index].add(i);
  }

  let cols = {} as any;

  for (const [k, v] of Object.entries(factor1.data().cols())) {
    cols[k] = IndexedVariable.of(v, Object.values(factor1Map));
  }

  for (let [k, v] of Object.entries(factor2.data().cols())) {
    while (k in cols) k += "$";
    cols[k] = IndexedVariable.of(v, Object.values(factor2Map));
  }

  cols[PARENT] = RefVariable.of(Object.values(parentMap));
  cols[POSITONS] = RefVariable.of(Object.values(positionsMap));

  return new Factor(
    uniqueIndices,
    indices,
    Dataframe.of(cols) as Dataframe<
      { [PARENT]: RefVariable; [POSITONS]: RefVariable } & DisjointUnion<T, U>
    >
  );
}
