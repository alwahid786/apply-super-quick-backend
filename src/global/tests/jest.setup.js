import { beforeAll, jest } from "@jest/globals";
import { afterTestFunction, beforeTestFunction } from "./jest.utils.js";

jest.setTimeout(30000);
beforeAll(beforeTestFunction);
afterAll(afterTestFunction);
