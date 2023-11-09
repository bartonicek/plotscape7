import { Lazy, Stringable, asString } from "@abartonicek/utilities";
import { BinOptions, FromOptions, bin, from } from "./Factor";
import { NumMetadata, StrMetadata } from "./Metadata";
import { Num, Ref, ScalarLike, Str } from "./Scalar";
import { View } from "./Value";
import { UnwrapScalar } from "./types";

export type VariableLike<T extends ScalarLike<any>> = {
  n(): number;
  values(): UnwrapScalar<T>[];
  push(scalar: T): number;
  get(indexfn: Lazy<number>): T;
  meta(): Record<string, any>;
};

type NumVariableOptions = { name?: string; metadata?: NumMetadata };

export class NumVariable implements VariableLike<Num> {
  private metadata: NumMetadata;

  constructor(private array: number[], options?: NumVariableOptions) {
    this.metadata = options?.metadata ?? NumMetadata.from(array, options?.name);
  }

  static of(array: number[], options?: NumVariableOptions) {
    return new NumVariable(array, options);
  }

  n() {
    return this.array.length;
  }

  values() {
    return this.array;
  }

  get(indexfn: Lazy<number>) {
    return Num.of(View.of(this.array, indexfn));
  }

  push(scalar: Num) {
    const value = scalar.value();
    this.metadata.update(value);
    return this.array.push(value);
  }

  meta() {
    return this.metadata.values();
  }

  bin(options?: BinOptions) {
    return bin(this.array, { ...this.meta(), ...options });
  }
}

type StrVariableOptions = { name?: string; metadata?: StrMetadata };

export class StrVariable implements VariableLike<Str> {
  array: string[];
  private metadata: StrMetadata;

  constructor(array: Stringable[], options?: StrVariableOptions) {
    this.array = array.map(asString);
    this.metadata =
      options?.metadata ?? StrMetadata.from(this.array, options?.name);
  }

  static of(array: Stringable[], options?: StrVariableOptions) {
    return new StrVariable(array, options);
  }

  n() {
    return this.array.length;
  }

  values() {
    return this.array;
  }

  get(indexfn: Lazy<number>) {
    return Str.of(View.of(this.array, indexfn));
  }

  push(str: Str) {
    const value = str.value();
    this.metadata.update(value);
    return this.array.push(value);
  }

  meta() {
    return this.metadata.values();
  }

  factorize(options?: FromOptions) {
    const meta = this.meta();
    return from(this.array, {
      name: meta.name,
      labels: Array.from(meta.values),
      sort: true,
      ...options,
    });
  }
}

export class RefVariable implements VariableLike<any> {
  constructor(private array: any[]) {}

  static of(array: any[]) {
    return new RefVariable(array);
  }

  n() {
    return this.array.length;
  }

  values() {
    return this.array;
  }

  get(indexfn: Lazy<number>) {
    return Ref.of(View.of(this.array, indexfn));
  }

  push(ref: Ref) {
    return this.array.push(ref.value());
  }

  meta() {
    return {};
  }
}

export class IndexedVariable<T extends ScalarLike<any>>
  implements VariableLike<T>
{
  constructor(private variable: VariableLike<T>, private indices: number[]) {}

  static of<T extends ScalarLike<any>>(
    variable: VariableLike<T>,
    indices: number[]
  ) {
    return new IndexedVariable(variable, indices);
  }

  n() {
    return this.indices.length;
  }

  values() {
    const { variable, indices } = this;
    const result = [] as UnwrapScalar<T>[];
    for (let i = 0; i < this.indices.length; i++) {
      result.push(variable.get(() => indices[i]).value());
    }
    return result;
  }

  get(indexfn: Lazy<number>) {
    return this.variable.get(() => this.indices[indexfn()]);
  }

  push(scalar: T) {
    const value = scalar.value();
    this.variable.push(value);
    const index = this.variable.n();
    return this.indices.push(index);
  }

  meta() {
    return this.variable.meta();
  }
}
