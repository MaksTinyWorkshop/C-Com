export type SpacerAxis = "vertical" | "horizontal";

export interface SpacerProps {
  size?: number | string;
  axis?: SpacerAxis;
  inline?: boolean;
  class?: string;
  style?: string;
  ariaHidden?: boolean;
  [key: string]: unknown;
}
