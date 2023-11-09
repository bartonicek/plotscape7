import { Dataframe } from "../lib/Dataframe";
import { num } from "../lib/Scalar";
import { Signal } from "../lib/Signal";
import { fetchData } from "../lib/funs";
import { reduceWithFactor } from "../lib/rmsfuns";
import "./style.css";

const mpgJSON = await fetchData("../data/mpg.json");
const spec = {
  hwy: "numeric",
  displ: "numeric",
  manufacturer: "discrete",
} as const;

const mpgData = Dataframe.parseCols(mpgJSON, spec);

const anchor = Signal.of(0);
const width = Signal.of(5);

const f1 = () => mpgData.col("hwy").bin({ width: width.value() });
const f2 = () => mpgData.col("displ").bin();
const f3 = () => f1().product(f2());

// createEffect(() => {
//   console.log(f3().data().unwrapRows());
// });

const reducedData = reduceWithFactor(
  mpgData,
  f3(),
  () => ({ sum: num(0) }),
  ({ sum }, { hwy, displ }) => ({ sum: sum.add(hwy).add(displ) })
);

const sum = reducedData.cols().sum;
console.log(reducedData.unwrapRows());
