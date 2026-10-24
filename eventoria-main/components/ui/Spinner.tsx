import React from "react";
import styles from "./Spinner.module.css";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly size?: "sm" | "md" | "lg";
  readonly label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  label = "Loading...",
  className = "",
  ...props
}) => {
  return (
    <div
      role="status"
      className={`${styles.spinner} ${styles[size]} ${className}`}
      {...props}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
};
