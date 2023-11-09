import { Dataframe } from "../lib/Dataframe";
import { Reducer } from "../lib/Reducer";
import { num } from "../lib/Scalar";
import { Signal } from "../lib/Signal";
import { fetchData } from "../lib/funs";
import "./style.css";

const mpgJSON = await fetchData("../data/mpg.json");
const spec = {
  hwy: "numeric",
  displ: "numeric",
  manufacturer: "discrete",
  model: "discrete",
} as const;

const mpgData = Dataframe.parseCols(mpgJSON, spec);

const anchor = Signal.of(0);
const width = Signal.of(5);

const f1 = () => mpgData.col("hwy").bin({ width: width.value() });
const f2 = () => mpgData.col("displ").bin();
const f3 = () => f1().product(f2());

const reducedData = () =>
  mpgData.reduceAcross(
    f3(),
    () => ({ sum: num(0) }),
    ({ sum }, { hwy, displ }) => ({ sum: sum.add(hwy).add(displ) })
  );

const factors = [f1, f3] as const;

const reducer = Reducer.of(
  mpgData,
  factors,
  () => ({ sum: num(0) }),
  ({ sum }, { hwy }) => ({ sum: sum.add(hwy) })
);

const g = reducer.getters[1]();
