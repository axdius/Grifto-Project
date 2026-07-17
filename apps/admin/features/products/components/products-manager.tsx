"use client";

import { useState } from "react";
import type { Product } from "@grifto/contracts";
import {
  useCategories,
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from "@grifto/sdk";
import { Button, Dialog, Field, Input, Select } from "@grifto/ui";
import { formatMoney, parseMoneyInput } from "@grifto/utils";
import { PageHeader } from "@/components/admin-shell";
import { DataTable } from "@/components/data-table";

export function ProductsManager() {
  const [search, setSearch] = useState("");
  const products = useProducts({ search: search || undefined });
  const categories = useCategories();
  const deleteProduct = useDeleteProduct();
  const [editing, setEditing] = useState<Product | "new" | null>(null);

  const categoryName = (id: string) =>
    categories.data?.items.find((c) => c.id === id)?.name ?? id;

  return (
    <>
      <PageHeader
        title="Products"
        actions={<Button onClick={() => setEditing("new")}>Add product</Button>}
      />
      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search products"
        />
      </div>
      <DataTable
        loading={products.isLoading}
        rows={products.data?.items}
        emptyText="No products"
        columns={[
          {
            key: "title",
            header: "Product",
            render: (p) => (
              <div>
                <p className="font-medium text-neutral-900">{p.title}</p>
                <p className="max-w-md truncate text-xs text-neutral-400">{p.description}</p>
              </div>
            ),
          },
          { key: "category", header: "Category", render: (p) => categoryName(p.categoryId) },
          { key: "price", header: "Price", align: "right", render: (p) => formatMoney(p.price) },
          {
            key: "actions",
            header: "",
            align: "right",
            render: (p) => (
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(p)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-danger-600"
                  loading={
                    deleteProduct.isPending && deleteProduct.variables?.productId === p.id
                  }
                  onClick={() => deleteProduct.mutate({ productId: p.id })}
                >
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
      />
      {editing ? (
        <ProductDialog
          product={editing === "new" ? null : editing}
          categories={categories.data?.items ?? []}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </>
  );
}

function ProductDialog({
  product,
  categories,
  onClose,
}: {
  product: Product | null;
  categories: { id: string; name: string }[];
  onClose: () => void;
}) {
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const [title, setTitle] = useState(product?.title ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? "");
  const [price, setPrice] = useState(
    product ? String(product.price.amountMinor / 100) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const busy = create.isPending || update.isPending;

  function submit() {
    const priceMinor = parseMoneyInput(price);
    if (!title.trim()) return setError("Title is required");
    if (!priceMinor) return setError("Enter a valid price");
    if (!categoryId) return setError("Choose a category");
    setError(null);
    const body = { title: title.trim(), description, categoryId, priceMinor };
    if (product) {
      update.mutate(
        { productId: product.id, body },
        { onSuccess: onClose, onError: (e) => setError(e.message) },
      );
    } else {
      create.mutate(body, { onSuccess: onClose, onError: (e) => setError(e.message) });
    }
  }

  return (
    <Dialog open onClose={onClose} title={product ? "Edit product" : "Add product"}>
      <div className="space-y-4">
        <Field label="Title" htmlFor="p-title">
          <Input id="p-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Description" htmlFor="p-desc">
          <Input
            id="p-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <Field label="Category" htmlFor="p-cat">
          <Select id="p-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Price (₹)" htmlFor="p-price">
          <Input
            id="p-price"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </Field>
        {error ? (
          <p className="text-sm text-danger-600" role="alert">
            {error}
          </p>
        ) : null}
        <Button className="w-full" loading={busy} onClick={submit}>
          {product ? "Save changes" : "Create product"}
        </Button>
      </div>
    </Dialog>
  );
}
