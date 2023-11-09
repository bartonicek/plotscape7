import {
  Key,
  Lazy,
  ReduceFn,
  allEntries,
  allKeys,
  allValues,
  lazy,
  unwrapAll,
} from "@abartonicek/utilities";
import { Factor } from "./Factor";
import {
  NumVariable,
  RefVariable,
  StrVariable,
  VariableLike,
} from "./Variable";
import { reduceWithFactor } from "./rmsfuns";
import { Row, RowOf, ScalarOf, Variables, VariablesOf } from "./types";

type ColType = "numeric" | "discrete" | "reference";
type ColTypeMap = {
  numeric: NumVariable;
  discrete: StrVariable;
  reference: RefVariable;
};

const colConstructorMap = {
  numeric: NumVariable,
  discrete: StrVariable,
  reference: RefVariable,
};

export class Dataframe<T extends Variables> {
  usedKeys: Set<string>;

  constructor(private _cols: T) {
    this.usedKeys = new Set(Object.keys(_cols));
  }

  static of<T extends Variables>(cols: T) {
    return new Dataframe(cols);
  }

  static parseCols<V extends Record<string, ColType>>(unparsed: any, spec: V) {
    let n = undefined;
    const cols = {} as any;

    for (const [k, v] of Object.entries(spec)) {
      if (!(k in unparsed)) errorParseMissing(k);
      if (!Array.isArray(unparsed[k])) errorParseArray(k);
      if (n === undefined) n = unparsed[k].length;
      if (unparsed[k].length != n) errorParseLength(k);

      cols[k] = new colConstructorMap[v](unparsed[k], { name: k }) as any;
    }

    return Dataframe.of(cols as { [key in keyof V]: ColTypeMap[V[key]] });
  }

  static liftRow<T extends Row>(row: T) {
    const cols = {} as any;
    for (const [k, v] of allEntries(row)) cols[k] = v.toVariable();
    return Dataframe.of(cols as VariablesOf<T>);
  }

  n() {
    return allValues(this._cols)[0].n();
  }

  cols() {
    return this._cols;
  }

  col<K extends keyof T>(key: K) {
    return this._cols[key];
  }

  append<U extends VariableLike<any>>(key: Key, variable: U) {
    const cols = this._cols as any;

    if (typeof key === "symbol" || typeof key === "number") {
      cols[key] = variable;
      return Dataframe.of(cols as Variables);
    }

    if (this.usedKeys.has(key)) key += "$";
    this.usedKeys.add(key);
    cols[key] = variable;
    return Dataframe.of(cols as Variables);
  }

  push(row: { [key in keyof T]: ScalarOf<T[key]> }) {
    for (const k of allKeys(row)) this._cols[k].push(row[k]);
    return this.n();
  }

  row(indexfn: Lazy<number>) {
    const result = {} as any;
    for (const k of allKeys(this._cols)) result[k] = this._cols[k].get(indexfn);
    return result as { [key in keyof T]: ScalarOf<T[key]> };
  }

  reduceAcross<U extends Row, V extends Variables>(
    factor: Factor<V>,
    reduceinit: Lazy<U>,
    reducefn: ReduceFn<RowOf<T>, U>
  ) {
    return reduceWithFactor(this, factor, reduceinit, reducefn);
  }

  unwrapRow(indexfn: Lazy<number>) {
    return unwrapAll(this.row(indexfn));
  }

  unwrapRows() {
    const n = this.n();
    const result = [] as any[];
    for (let i = 0; i < n; i++) result.push(this.unwrapRow(lazy(i)));
    return result;
  }
}

function errorParseMissing(key: Key) {
  throw new Error(`Property '${key.toString()}' is missing from the raw data`);
}

function errorParseArray(key: Key) {
  throw new Error(`Property '${key.toString()}' of raw data is not an array`);
}

function errorParseLength(key: Key) {
  throw new Error(
    `Property '${key.toString()}' has a different length than previous arrays`
  );
}
