import { cva, type VariantProps } from "class-variance-authority";
import Image from "next/image";

import { cn } from "@/lib/utils";

const LOGO_SRC = "/logo.svg";
const LOGO_SRC_DARK = "/logo-dark.svg";

const textVariants = cva("font-bold", {
  variants: {
    size: {
      default: "text-lg",
      sm: "text-base",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

const imageSizes = {
  default: 40,
  sm: 30,
};

interface LogoProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof textVariants> {}

export const Logo = ({ size, className }: LogoProps) => {
  const sizeKey = size ?? "default";
  const imageSize = imageSizes[sizeKey];

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Image
        src={LOGO_SRC}
        width={imageSize}
        height={imageSize}
        alt="Logo"
        className="dark:hidden"
      />
      <Image
        src={LOGO_SRC_DARK}
        width={imageSize}
        height={imageSize}
        alt="Logo"
        className="hidden dark:block"
      />
      <p className={cn(textVariants({ size: sizeKey }))}>Voton</p>
    </div>
  );
};
