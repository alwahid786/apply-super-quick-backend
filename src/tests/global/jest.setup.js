import { beforeAll, jest } from "@jest/globals";
import { afterTestFunction, beforeTestFunction } from "../../utils/jestUtils.js";

jest.setTimeout(30000);
beforeAll(beforeTestFunction);
afterAll(afterTestFunction);
