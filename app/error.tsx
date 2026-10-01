"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

const Error = () => {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center truncate text-center">
      <h1 className="text-3xl font-bold">Ooops!</h1>
      <h3 className="text-xl font-medium">An unexpected error occurred.</h3>
      <Button asChild size="lg" className="mt-4 cursor-pointer">
        <Link href="/documents">Go back</Link>
      </Button>
    </div>
  );
};

export default Error;
