import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { categories } from "@/lib/catalog";
import { Wordmark } from "./Wordmark";

const linkClass =
  "text-[0.72rem] uppercase tracking-[0.18em] text-grey transition-colors hover:text-ivory";

export function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-6 px-5 sm:px-8">
        <nav className="hidden flex-1 items-center gap-7 md:flex">
          <Link to="/shop" className={linkClass}>
            Shop all
          </Link>
          {categories.slice(0, 3).map((c) => (
            <Link
              key={c.slug}
              to="/shop/$category"
              params={{ category: c.slug }}
              className={linkClass}
            >
              {c.name}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-ivory md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        <Link to="/" className="shrink-0 text-base" aria-label="Kamoura — home">
          <Wordmark />
        </Link>

        <nav className="flex flex-1 items-center justify-end gap-7">
          <Link to="/about" className={`${linkClass} hidden md:inline`}>
            About
          </Link>
          <Link to="/contact" className={`${linkClass} hidden md:inline`}>
            Contact
          </Link>
          <Link to="/bag" className={`${linkClass} whitespace-nowrap`}>
            Bag <span className="numeral text-gold">({count})</span>
          </Link>
        </nav>
      </div>

      {open && (
        <nav className="border-t border-border bg-bg-soft px-5 py-5 md:hidden">
          <ul className="space-y-4">
            {[{ slug: "", name: "Shop all" }, ...categories].map((c) => (
              <li key={c.slug || "all"}>
                {c.slug ? (
                  <Link
                    to="/shop/$category"
                    params={{ category: c.slug }}
                    className={linkClass}
                    onClick={() => setOpen(false)}
                  >
                    {c.name}
                  </Link>
                ) : (
                  <Link to="/shop" className={linkClass} onClick={() => setOpen(false)}>
                    Shop all
                  </Link>
                )}
              </li>
            ))}
            <li>
              <Link to="/about" className={linkClass} onClick={() => setOpen(false)}>
                About
              </Link>
            </li>
            <li>
              <Link to="/contact" className={linkClass} onClick={() => setOpen(false)}>
                Contact
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
