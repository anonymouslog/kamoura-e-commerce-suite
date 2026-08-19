import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { wishlistQuery } from "@/lib/account-queries";
import { toggleWishlist } from "@/lib/account.functions";

export const Route = createFileRoute("/account/wishlist")({
  loader: ({ context }) => context.queryClient.ensureQueryData(wishlistQuery),
  component: Wishlist,
});

function Wishlist() {
  const { data: items } = useSuspenseQuery(wishlistQuery as any);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Wishlist</h1>
      <div className="mt-6 space-y-4">
        {items.length === 0 && <p className="text-sm text-muted-foreground">No items saved.</p>}
        {items.map((it: any) => (
          <div
            key={it.id}
            className="flex items-center justify-between rounded-md border border-border p-4"
          >
            <div>
              <div className="font-medium">{it.products?.name ?? it.product_slug}</div>
              <div className="text-sm text-muted-foreground">₦{it.products?.price ?? "—"}</div>
            </div>
            <div>
              <button
                className="text-sm text-gold"
                onClick={async () => {
                  await toggleWishlist({ data: { slug: it.product_slug } });
                  location.reload();
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
