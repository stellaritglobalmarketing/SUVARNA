import Link from "next/link";
import type { ButtonHTMLAttributes, MouseEventHandler } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary: "bg-brand-forest text-brand-sand hover:bg-brand-forest-light",
  secondary: "bg-brand-gold text-brand-ink hover:bg-brand-gold-light",
  outline: "border border-brand-forest text-brand-forest hover:bg-brand-forest hover:text-brand-sand",
  ghost: "text-brand-forest hover:bg-brand-sand-dark",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

interface ButtonAsButton
  extends CommonProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "href" | "children"> {
  href?: undefined;
}

interface ButtonAsLink extends CommonProps {
  href: string;
  onClick?: MouseEventHandler;
}

type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", className, children } = props;
  const classes = cn(baseClasses, variantClasses[variant], sizeClasses[size], className);

  if (props.href) {
    return (
      <Link href={props.href} onClick={props.onClick} className={classes}>
        {children}
      </Link>
    );
  }

  const { variant: _variant, size: _size, className: _className, children: _children, href, ...rest } = props;
  void _variant;
  void _size;
  void _className;
  void _children;
  void href;

  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}
