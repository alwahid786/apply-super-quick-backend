import { afterAll, beforeAll, jest } from "@jest/globals";
import { afterTestFunction, beforeTestFunction } from "../utils/jestUtils.js";

jest.setTimeout(10000);

beforeAll(beforeTestFunction);
afterAll(afterTestFunction);
