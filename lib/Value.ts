import { Lazy } from "@abartonicek/utilities";
import { Setter, createSignal } from "solid-js";

export type ValueLike<T> = {
  value(): T;
};

export class Value<T> {
  constructor(private val: T) {}

  static of<T>(val: T) {
    return new Value(val);
  }

  value() {
    return this.val;
  }
}

export class View<T> {
  constructor(private array: T[], private indexfn: Lazy<number>) {}

  static of<T>(array: T[], indexfn: Lazy<number>) {
    return new View(array, indexfn);
  }

  value() {
    const index = this.indexfn();
    if (index < 0 || index > this.array.length) errorOutOfBounds(index);
    return this.array[index];
  }
}

export class Getter<T> {
  constructor(private getter: Lazy<T>) {}

  static of<T>(getter: Lazy<T>) {
    return new Getter(getter);
  }

  value() {
    return this.getter();
  }
}

export class Signal<T> implements ValueLike<T> {
  private getter: Getter<T>;
  set: Setter<T>;

  constructor(value: T) {
    const [get, set] = createSignal(value);
    this.getter = Getter.of(get);
    this.set = set;
  }

  static of<T>(value: T) {
    return new Signal(value);
  }

  value() {
    return this.getter.value();
  }
}

function errorOutOfBounds(index: number) {
  throw new Error(`Out of bounds access (index: '${index}')`);
}
