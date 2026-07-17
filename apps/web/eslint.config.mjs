import base from "@grifto/config/eslint/base";
import { appBoundaryRules, boundaryExemptions } from "@grifto/config/eslint/boundaries";

export default [...base, appBoundaryRules, boundaryExemptions];
