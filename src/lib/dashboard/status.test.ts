import { buildGaugeData, getPerformanceStatus } from "@/lib/dashboard/status";

describe("dashboard status rules", () => {
  const thresholds = {
    limite_regular: 100,
    limite_suficiente: 150,
    limite_bom: 250,
    limite_otimo: 300,
  };

  it("classifies regular below the first threshold", () => {
    expect(getPerformanceStatus(99, thresholds)).toBe("regular");
  });

  it("classifies sufficient between regular and sufficient", () => {
    expect(getPerformanceStatus(120, thresholds)).toBe("suficiente");
  });

  it("classifies bom before otimo", () => {
    expect(getPerformanceStatus(250, thresholds)).toBe("bom");
  });

  it("classifies otimo at or above the otimo threshold", () => {
    expect(getPerformanceStatus(300, thresholds)).toBe("otimo");
  });

  it("builds gauge metadata with the correct label", () => {
    const gauge = buildGaugeData("medico", 186, thresholds);

    expect(gauge.label).toBe("Medico");
    expect(gauge.summary).toContain("186");
  });
});
