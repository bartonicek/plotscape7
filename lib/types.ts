import { Key } from "@abartonicek/utilities";
import { Num, Ref, ScalarLike, Str } from "./Scalar";
import {
  NumVariable,
  RefVariable,
  StrVariable,
  VariableLike,
} from "./Variable";

export type DisjointUnion<
  T extends Record<string, any>,
  U extends Record<string, any>
> = {
  [K in keyof T as K extends keyof U ? `${Extract<K, string>}` : K]: T[K];
} & {
  [K in keyof U as K extends keyof T ? `${Extract<K, string>}$` : K]: U[K];
};

export type Variable = NumVariable | StrVariable | RefVariable;
export type Variables = Record<Key, VariableLike<any>>;
export type Scalar = Num | Str | Ref;
export type Row = Record<Key, Scalar>;

export type ScalarOf<T extends VariableLike<any>> = T extends VariableLike<
  infer U
>
  ? U
  : never;

export type VariableOf<T extends ScalarLike<any>> = T extends ScalarLike<
  infer U
>
  ? U extends number
    ? NumVariable
    : U extends string
    ? StrVariable
    : U extends any
    ? RefVariable
    : never
  : never;

export type RowOf<T extends Variables> = {
  [key in keyof T]: ScalarOf<T[key]>;
};

export type VariablesOf<T extends Row> = {
  [key in keyof T]: VariableOf<T[key]>;
};

export type UnwrapScalar<T extends ScalarLike<any>> = T extends ScalarLike<
  infer U
>
  ? U
  : never;

export type UnwrapVariable<T extends VariableLike<any>> =
  T extends VariableLike<infer U> ? UnwrapScalar<U> : never;
