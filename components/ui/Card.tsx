import React from "react";
import styles from "./Card.module.css";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly title?: string;
  readonly subtitle?: string;
  readonly glass?: boolean;
  readonly hoverable?: boolean;
  readonly headerAction?: React.ReactNode;
  readonly footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  glass = false,
  hoverable = false,
  headerAction,
  footer,
  className = "",
  ...props
}) => {
  const classNames = [
    styles.card,
    glass ? styles.glass : "",
    hoverable ? styles.hoverable : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames} {...props}>
      {(title || subtitle || headerAction) && (
        <div className={styles.header}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              {title && <h3 className={styles.title}>{title}</h3>}
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
            {headerAction && <div>{headerAction}</div>}
          </div>
        </div>
      )}
      <div>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
};
