import { removeFixtures } from "./browsing-fixtures.mjs";
import { removeProbe } from "./content-cache-probe.mjs";
export default function teardown() { removeFixtures(); removeProbe(); }
