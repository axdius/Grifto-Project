"use client";

import { useState } from "react";
import { useCreateWishlistItem, useFetchUrlMetadata, useProducts } from "@grifto/sdk";
import { Badge, Button, Dialog, Field, Input, Spinner, cn } from "@grifto/ui";
import { formatMoney, parseMoneyInput } from "@grifto/utils";

type Tab = "manual" | "url" | "catalog";

/**
 * Add-item flow with the three creation methods from the scope PDF:
 * manual entry, product URL (auto-fetch + manual completion), Grifto catalog.
 */
export function AddItemDialog({
  wishlistId,
  open,
  onClose,
}: {
  wishlistId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("manual");
  const create = useCreateWishlistItem(wishlistId);

  function close() {
    create.reset();
    onClose();
  }

  return (
    <Dialog open={open} onClose={close} title="Add Wishlist Item" className="max-w-lg">
      <div className="mb-4 flex gap-1 rounded-lg bg-neutral-100 p-1" role="tablist">
        {(
          [
            ["manual", "Manual"],
            ["url", "From URL"],
            ["catalog", "Grifto Catalog"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-medium",
              tab === key ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "manual" ? <ManualForm wishlistId={wishlistId} onDone={close} /> : null}
      {tab === "url" ? <UrlForm wishlistId={wishlistId} onDone={close} /> : null}
      {tab === "catalog" ? <CatalogPicker wishlistId={wishlistId} onDone={close} /> : null}
    </Dialog>
  );
}

function ManualForm({ wishlistId, onDone }: { wishlistId: string; onDone: () => void }) {
  const create = useCreateWishlistItem(wishlistId);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const priceMinor = parseMoneyInput(price);
    if (!title.trim()) return setError("Product title is required");
    if (!priceMinor) return setError("Enter a valid estimated price");
    setError(null);
    create.mutate(
      {
        source: "manual",
        title: title.trim(),
        priceMinor,
        productUrl: productUrl.trim() || null,
      },
      { onSuccess: onDone },
    );
  }

  return (
    <div className="space-y-4">
      <Field label="Product Title" htmlFor="mi-title">
        <Input id="mi-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="Estimated Price (₹)" htmlFor="mi-price">
        <Input
          id="mi-price"
          inputMode="decimal"
          placeholder="e.g. 25,000"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </Field>
      <Field label="Product URL (optional)" htmlFor="mi-url">
        <Input
          id="mi-url"
          type="url"
          placeholder="https://…"
          value={productUrl}
          onChange={(e) => setProductUrl(e.target.value)}
        />
      </Field>
      {error || create.error ? (
        <p className="text-sm text-danger-600" role="alert">
          {error ?? create.error?.message}
        </p>
      ) : null}
      <Button className="w-full" loading={create.isPending} onClick={submit}>
        Add to wishlist
      </Button>
    </div>
  );
}

function UrlForm({ wishlistId, onDone }: { wishlistId: string; onDone: () => void }) {
  const fetchMeta = useFetchUrlMetadata();
  const create = useCreateWishlistItem(wishlistId);
  const [url, setUrl] = useState("");
  const [fetched, setFetched] = useState(false);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);

  function fetchDetails() {
    setError(null);
    fetchMeta.mutate(
      { url },
      {
        onSuccess: (meta) => {
          setFetched(true);
          setTitle(meta.title ?? "");
          setPrice(meta.priceMinor ? String(meta.priceMinor / 100) : "");
        },
        onError: (e) => setError(e.message),
      },
    );
  }

  function submit() {
    const priceMinor = parseMoneyInput(price);
    if (!title.trim()) return setError("Product title is required");
    if (!priceMinor) return setError("Enter a valid price");
    setError(null);
    create.mutate(
      { source: "url", title: title.trim(), priceMinor, productUrl: url },
      { onSuccess: onDone },
    );
  }

  return (
    <div className="space-y-4">
      <Field label="Paste Product URL" htmlFor="uf-url">
        <div className="flex gap-2">
          <Input
            id="uf-url"
            type="url"
            placeholder="https://store.example.com/product"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button variant="secondary" loading={fetchMeta.isPending} onClick={fetchDetails}>
            Fetch
          </Button>
        </div>
      </Field>

      {fetched ? (
        <>
          <p className="text-xs text-neutral-500">
            We filled in what we could find — review and complete the details before saving.
          </p>
          <Field label="Product Title" htmlFor="uf-title">
            <Input id="uf-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Price (₹)" htmlFor="uf-price">
            <Input
              id="uf-price"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </Field>
          <Button className="w-full" loading={create.isPending} onClick={submit}>
            Add to wishlist
          </Button>
        </>
      ) : null}

      {error ? (
        <p className="text-sm text-danger-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function CatalogPicker({ wishlistId, onDone }: { wishlistId: string; onDone: () => void }) {
  const [search, setSearch] = useState("");
  const products = useProducts({ search: search || undefined });
  const create = useCreateWishlistItem(wishlistId);
  const [addingId, setAddingId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search products…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search products"
      />
      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {products.isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner className="text-brand-500" />
          </div>
        ) : (
          products.data?.items.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-neutral-900">{product.title}</p>
                <p className="text-xs text-neutral-500">{formatMoney(product.price)}</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                loading={create.isPending && addingId === product.id}
                onClick={() => {
                  setAddingId(product.id);
                  create.mutate(
                    {
                      source: "catalog",
                      title: product.title,
                      priceMinor: product.price.amountMinor,
                      productId: product.id,
                      imageUrl: product.image?.url ?? null,
                    },
                    { onSuccess: onDone },
                  );
                }}
              >
                Add
              </Button>
            </div>
          ))
        )}
        {products.data && products.data.items.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-500">No products found.</p>
        ) : null}
      </div>
      <Badge tone="neutral">Catalog managed by Grifto — grows via the admin panel (M7)</Badge>
    </div>
  );
}
