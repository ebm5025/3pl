import { expect, test } from "vitest"
import { sum } from ".";

test("it adds 1 and 2", () => {
    expect(sum(1,2)).toBe(3);
});