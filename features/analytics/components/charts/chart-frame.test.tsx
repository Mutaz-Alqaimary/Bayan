// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { AnalyticsTrendPoint } from "@/features/analytics/types";

import { ChartFrame } from "./chart-frame";

/**
 * Regression guard for the chart accessible-table fallback (fixed during Phase
 * 18). A `<table>` ignores `sr-only`'s `height:1px`/`overflow:hidden`, so putting
 * `sr-only` on the table itself leaves it full-height and (being absolutely
 * positioned) inflates the page's scrollHeight — the phantom blank space. The
 * table must instead live inside an `sr-only` **wrapper** (which collapses), and
 * must stay complete in the accessibility tree.
 */
const points: AnalyticsTrendPoint[] = [
  { bucketId: "a", date: "2026-06-01T00:00:00.000Z", label: "Jun 1", value: 10 },
  { bucketId: "b", date: "2026-06-02T00:00:00.000Z", label: "Jun 2", value: null },
  { bucketId: "c", date: "2026-06-03T00:00:00.000Z", label: "Jun 3", value: 14 },
];

const labels = { caption: "Reading speed", period: "Period", value: "Words per minute" };

afterEach(cleanup);

describe("ChartFrame accessible data table", () => {
  it("wraps the table in an sr-only container rather than putting sr-only on the table", () => {
    const { container } = render(
      <ChartFrame
        points={points}
        width={320}
        height={120}
        aspectClassName="aspect-[8/3]"
        formatValue={(v) => String(v)}
        labels={labels}
      >
        <g />
      </ChartFrame>,
    );

    // `sr-only` on the <table> itself is the bug (a table won't collapse/clip).
    expect(container.querySelector("table.sr-only")).toBeNull();

    // It must live inside an sr-only wrapper that DOES collapse.
    const table = container.querySelector("div.sr-only > table");
    expect(table).not.toBeNull();
  });

  it("keeps every bucket row in the accessibility tree (a11y fallback intact)", () => {
    const { container } = render(
      <ChartFrame
        points={points}
        width={320}
        height={120}
        aspectClassName="aspect-[8/3]"
        formatValue={(v) => String(v)}
        labels={labels}
      >
        <g />
      </ChartFrame>,
    );

    const table = container.querySelector("div.sr-only > table")!;
    expect(table.querySelector("caption")?.textContent).toBe(labels.caption);
    expect(table.querySelectorAll("tbody tr")).toHaveLength(points.length);
    // Null buckets render an em-dash, real values are formatted.
    expect(table.textContent).toContain("—");
    expect(table.textContent).toContain("14");
  });
});
