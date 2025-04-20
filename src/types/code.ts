import type { ComponentProps } from "react";

export interface CodeBlockProps extends ComponentProps<"code"> {
  inline?: boolean;
}

export interface CopyButtonState {
  copied: boolean;
  timeoutId?: NodeJS.Timeout;
}