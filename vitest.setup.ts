import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

vi.mock("next/font/google", () => ({
  Outfit: () => ({
    className: "font-outfit",
  }),
}));
