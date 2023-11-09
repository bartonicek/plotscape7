import { Value, ValueLike } from "./Value";
import {
  NumVariable,
  RefVariable,
  StrVariable,
  VariableLike,
} from "./Variable";

export type ScalarLike<T> = ValueLike<T> & {
  toVariable(): VariableLike<ScalarLike<T>>;
};

export function num(number: number) {
  return Num.of(Value.of(number));
}

export function str(string: string) {
  return Str.of(Value.of(string));
}

export function ref(reference: any) {
  return Ref.of(Value.of(reference));
}

export class Num implements ScalarLike<number> {
  constructor(private valueLike: ValueLike<number>) {}

  static of(valueLike: ValueLike<number>) {
    return new Num(valueLike);
  }

  value() {
    return this.valueLike.value();
  }

  toVariable() {
    return NumVariable.of([this.value()]);
  }

  inc() {
    return num(this.value() + 1);
  }

  dec() {
    return num(this.value() - 1);
  }

  add(other: Num) {
    return num(this.value() + other.value());
  }

  minus(other: Num) {
    return num(this.value() - other.value());
  }

  times(other: Num) {
    return num(this.value() * other.value());
  }

  divideBy(other: Num) {
    return num(this.value() / other.value());
  }
}

export class Str implements ScalarLike<string> {
  constructor(private valueLike: ValueLike<string>) {}

  static of(valueLike: ValueLike<string>) {
    return new Str(valueLike);
  }

  value() {
    return this.valueLike.value();
  }

  toVariable() {
    return StrVariable.of([this.value()]);
  }

  uppercase() {
    return str(this.value().toLocaleUpperCase());
  }

  lowercase() {
    return str(this.value().toLocaleLowerCase());
  }
}

export class Ref implements ScalarLike<any> {
  constructor(private valueLike: ValueLike<any>) {}

  static of(valueLike: ValueLike<any>) {
    return new Ref(valueLike);
  }

  value() {
    return this.valueLike.value();
  }

  toVariable() {
    return RefVariable.of([this.value()]);
  }
}

// export class None implements Num, Str, Ref {
//   constructor() {}
// }
