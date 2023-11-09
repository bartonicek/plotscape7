import { Lazy, ReduceFn } from "@abartonicek/utilities";
import { Accessor, Setter, createMemo, createSignal } from "solid-js";
import { Dataframe } from "./Dataframe";
import { Factor } from "./Factor";
import { Row, RowOf, Variables } from "./types";

type ReducedData<
  T extends Variables,
  U extends Accessor<Factor<any>>
> = U extends Accessor<Factor<infer V>> ? Accessor<Dataframe<T & V>> : never;

export class Reducer<
  T extends Variables,
  U extends readonly Accessor<Factor<any>>[],
  V extends Variables,
  W = { [key in keyof U]: ReducedData<V, U[key]> }
> {
  private trigger: Accessor<undefined>;
  private setTrigger: Setter<undefined>;
  public readonly getters: W;

  constructor(
    private data: Dataframe<T>,
    public factors: U,
    private initfn: Lazy<RowOf<V>>,
    private reducefn: ReduceFn<RowOf<T>, RowOf<V>>
  ) {
    const getters = [] as any;

    const [trigger, setTrigger] = createSignal(undefined, { equals: false });
    this.trigger = trigger;
    this.setTrigger = setTrigger;

    for (const factor of factors) {
      const getter = createMemo(() => {
        this.trigger();
        return this.data.reduceAcross(factor(), this.initfn, this.reducefn);
      });

      getters.push(getter);
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

  private rerun() {
    this.setTrigger(undefined);
    return this;
  }

  get<I extends keyof U>(level: I) {
    // @ts-ignore
    if (level < 0 || level > this.getters.length - 1) errorOutOfBounds(level);

    // @ts-ignore
    return (this.getters[level] as Function)() as ReturnType<W[I]>;
  }

  setReducer<X extends Variables>(
    initfn: Lazy<X>,
    reducefn: ReduceFn<RowOf<T>, RowOf<X>>
  ) {
    this.initfn = initfn as any;
    this.reducefn = reducefn as any;
    this.rerun();

    return this as unknown as Reducer<T, U, X>;
  }
}

function errorOutOfBounds(index: number) {
  throw new Error(`Out of bounds access (index: '${index}')`);
}
