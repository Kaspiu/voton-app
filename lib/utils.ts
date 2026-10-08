import type { KeyboardEvent } from "react";

export { cn } from "cn";

export function handleButtonKeyDown(event: KeyboardEvent<HTMLElement>): void {
  if (
    event.target !== event.currentTarget ||
    event.repeat ||
    (event.key !== "Enter" && event.key !== " ")
  )
    return;

  event.preventDefault();
  event.currentTarget.click();
}
