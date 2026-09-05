import Link from "next/link";

export function HomeCta({ label }: { label: string }) {
  return (
    <p>
      <Link
        href="/"
        className="font-medium text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-300"
      >
        {label}
      </Link>
    </p>
  );
}
