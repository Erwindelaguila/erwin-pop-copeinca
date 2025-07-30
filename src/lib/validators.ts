import type { Validator } from "./types"

export const validators: Validator[] = [
  { id: "4", name: "Erwin del Aguila" },
  { id: "5", name: "Ivan Sanchez" },
]

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ")
}
