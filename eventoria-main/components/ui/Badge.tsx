import React from "react";
import styles from "./Badge.module.css";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly variant?: "amber" | "emerald" | "rose" | "sky" | "gray";
  readonly icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "amber",
  icon,
  className = "",
  ...props
}) => {
  return (
    <span
      className={`${styles.badge} ${styles[variant]} ${className}`}
      {...props}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
};
