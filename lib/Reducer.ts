import { Lazy, ReduceFn, lazy } from "@abartonicek/utilities";
import { Accessor } from "solid-js";
import { Dataframe } from "./Dataframe";
import { Factor } from "./Factor";
import { Row, RowOf, Variables, VariablesOf } from "./types";

export class Reducer<
  T extends Variables,
  U extends readonly Accessor<Factor<any>>[],
  V extends Row
> {
  getters: {
    [key in keyof U]: U[key] extends Accessor<Factor<infer W>>
      ? Accessor<Dataframe<W & VariablesOf<V>>>
      : never;
  };

  constructor(
    private data: Dataframe<T>,
    public factors: U,
    private initfn: Lazy<V>,
    private reducefn: ReduceFn<RowOf<T>, V>
  ) {
    const getters = [] as any;
    for (const factor of factors) {
      getters.push(lazy(data.reduceAcross(factor(), initfn, reducefn)));
    }

    this.getters = getters;
  }

  static of<
    T extends Variables,
    U extends readonly Accessor<Factor<any>>[],
    V extends Row
  >(
    data: Dataframe<T>,
    factors: U,
    initfn: Lazy<V>,
    reducefn: ReduceFn<RowOf<T>, V>
  ) {
    return new Reducer(data, factors, initfn, reducefn);
  }
}
