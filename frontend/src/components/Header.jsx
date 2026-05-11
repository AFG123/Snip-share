import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950 px-6 py-3">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
        <Link to="/" className="text-sm font-semibold text-gray-100 transition hover:text-white">
          SnipShare
        </Link>
        <Link to="/" className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-100 transition hover:bg-gray-700">
          New Snippet
        </Link>
      </div>
    </header>
  );
}
