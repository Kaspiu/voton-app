import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const ERROR_IMAGE_SRC = "/error.webp";
const ERROR_IMAGE_SRC_DARK = "/error-dark.webp";
const ERROR_IMAGE_WIDTH = 300;
const ERROR_IMAGE_HEIGHT = 150;

const NotFound = () => {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center truncate text-center">
      <Image
        src={ERROR_IMAGE_SRC}
        width={ERROR_IMAGE_WIDTH}
        height={ERROR_IMAGE_HEIGHT}
        alt="Page not found illustration"
        className="dark:hidden"
      />
      <Image
        src={ERROR_IMAGE_SRC_DARK}
        width={ERROR_IMAGE_WIDTH}
        height={ERROR_IMAGE_HEIGHT}
        alt="Page not found illustration"
        className="hidden dark:block"
      />
      <h1 className="text-2xl font-bold">Ooops!</h1>
      <h3 className="text-lg font-medium">
        We couldn&apos;t find this document.
      </h3>
      <Button asChild size="lg" className="mt-4 cursor-pointer">
        <Link href="/documents">Go back</Link>
      </Button>
    </div>
  );
};

export default NotFound;
