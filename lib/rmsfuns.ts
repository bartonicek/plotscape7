import { Lazy, ReduceFn, allEntries } from "@abartonicek/utilities";
import { Dataframe } from "./Dataframe";
import { Factor } from "./Factor";
import { Row, RowOf, Variables, VariablesOf } from "./types";

export function reduceWithFactor<
  T extends Variables,
  U extends Variables,
  V extends Row
>(
  data: Dataframe<T>,
  factor: Factor<U>,
  reduceinit: Lazy<V>,
  reducefn: ReduceFn<RowOf<T>, V>
) {
  const indices = factor.indices();
  const uniqueIndices = factor.uniqueIndices();
  const factorData = factor.data();

  const parts = {} as Record<number, V>;
  for (const i of uniqueIndices) parts[i] = reduceinit();

  let i = 0;
  const indexfn = () => i;
  const row = data.row(indexfn);

  for (; i < indices.length; i++) {
    const index = indices[i];
    parts[index] = reducefn(parts[index], row);
  }

  const rows = Object.values(parts);
  const row1 = rows[0];

  const result = Dataframe.liftRow(row1);
  for (let i = 1; i < rows.length; i++) result.push(rows[i] as any);
  for (const [k, v] of allEntries(factorData.cols())) result.append(k, v);

  return result as unknown as Dataframe<U & VariablesOf<V>>;
}
