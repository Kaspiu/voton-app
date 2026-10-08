import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import errorIllustration from "@/public/error.webp";
import errorIllustrationDark from "@/public/error-dark.webp";

export const metadata: Metadata = {
  title: { absolute: "Page Not Found - Voton" },
  description: "The page you are looking for could not be found.",
};

const ERROR_IMAGE_WIDTH = 300;
const ERROR_IMAGE_HEIGHT = 150;

const NotFound = () => {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center truncate text-center">
      <Image
        src={errorIllustration}
        width={ERROR_IMAGE_WIDTH}
        height={ERROR_IMAGE_HEIGHT}
        alt="Page not found illustration"
        unoptimized
        className="dark:hidden"
      />
      <Image
        src={errorIllustrationDark}
        width={ERROR_IMAGE_WIDTH}
        height={ERROR_IMAGE_HEIGHT}
        alt="Page not found illustration"
        unoptimized
        className="hidden dark:block"
      />
      <h1 className="text-2xl font-bold">Ooops!</h1>
      <h3 className="text-lg font-medium">
        Looks like you&apos;re in the wrong place.
      </h3>
      <Button asChild size="lg" className="mt-4 cursor-pointer">
        <Link href="/documents">Go back</Link>
      </Button>
    </div>
  );
};

export default NotFound;
