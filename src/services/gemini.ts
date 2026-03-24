import { FactPackage } from "../types";

export async function analyzeLawsuit(text: string, existingPackage?: FactPackage): Promise<FactPackage> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, existingPackage }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to get analysis from server");
  }

  return await response.json() as FactPackage;
}
