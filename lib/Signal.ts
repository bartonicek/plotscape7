import { Accessor, Setter, createSignal } from "solid-js";
import { ValueLike } from "./Value";

// Wrapper for Solid JS signal

export class Signal<T> implements ValueLike<T> {
  private get: Accessor<T>;
  set: Setter<T>;

  constructor(value: T) {
    const [get, set] = createSignal(value);
    this.get = get;
    this.set = set;
  }

  static of<T>(value: T) {
    return new Signal(value);
  }

  value() {
    return this.get();
  }
}
