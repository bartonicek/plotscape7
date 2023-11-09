import { minMax } from "@abartonicek/utilities";

// Metadata should be idempotent with respect to update().
// E.g. adding the same case of the data twice should not change it.
// This is so that it remains valid for IndexedVariable(s)

export type Metadata<T> = {
  values(): Record<string, any>;
  update(value: T): void;
};

type NumMetaValues = { name?: string; min: number; max: number };

export class NumMetadata implements Metadata<number> {
  constructor(private _values: NumMetaValues) {}

  static of(values: NumMetaValues) {
    return new NumMetadata(values);
  }

  static from(array: number[], name?: string) {
    const [min, max] = minMax(array);
    return NumMetadata.of({ name, min, max });
  }

  values() {
    return this._values;
  }

  update(value: number) {
    this._values.min = Math.min(this._values.min, value);
    this._values.max = Math.max(this._values.max, value);
  }
}

type StrMetaValues = { name?: string; values: Set<string> };

export class StrMetadata implements Metadata<string> {
  constructor(private _values: StrMetaValues) {}

  static of(values: StrMetaValues) {
    return new StrMetadata(values);
  }

  static from(array: string[], name?: string) {
    return StrMetadata.of({ name, values: new Set(array) });
  }

  values() {
    return this._values;
  }

  update(value: string) {
    this._values.values.add(value);
  }
}
