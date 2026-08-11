import { Link } from "@tanstack/react-router";
import { categories } from "@/lib/catalog";
import { Wordmark } from "./Wordmark";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-bg-soft">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-16 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Wordmark className="text-sm" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-grey">
            A small clothing label working in wool, silk and cashmere. Made in limited runs,
            shipped from Lagos.
          </p>
        </div>
        <div>
          <p className="eyebrow">Collection</p>
          <ul className="mt-4 space-y-3 text-sm text-grey">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  to="/shop/$category"
                  params={{ category: c.slug }}
                  className="transition-colors hover:text-ivory"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="eyebrow">House</p>
          <ul className="mt-4 space-y-3 text-sm text-grey">
            <li>
              <Link to="/about" className="transition-colors hover:text-ivory">
                About Kamoura
              </Link>
            </li>
            <li>
              <Link to="/contact" className="transition-colors hover:text-ivory">
                Contact
              </Link>
            </li>
            <li>
              <Link to="/bag" className="transition-colors hover:text-ivory">
                Your bag
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-5 py-6 text-xs text-grey-dim sm:flex-row sm:justify-between sm:px-8">
          <p>&copy; {new Date().getFullYear()} Kamoura. All rights reserved.</p>
          <p>Orders are confirmed by WhatsApp or email before dispatch.</p>
        </div>
      </div>
    </footer>
  );
}
