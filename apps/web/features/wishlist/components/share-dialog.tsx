"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { Wishlist } from "@grifto/contracts";
import { Button, Dialog, Input } from "@grifto/ui";

/**
 * Share options per the scope PDF: public URL + downloadable hi-res QR code.
 * QR is generated client-side from the share URL — updates to the wishlist
 * never require regenerating the link or the code.
 */
export function ShareDialog({
  wishlist,
  open,
  onClose,
}: {
  wishlist: Wishlist;
  open: boolean;
  onClose: () => void;
}) {
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    void QRCode.toDataURL(wishlist.shareUrl, { width: 240, margin: 1 }).then(setQrPreview);
  }, [open, wishlist.shareUrl]);

  async function copyLink() {
    await navigator.clipboard.writeText(wishlist.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function downloadQr() {
    // High-resolution render suitable for print (wedding invitations).
    const dataUrl = await QRCode.toDataURL(wishlist.shareUrl, { width: 1200, margin: 2 });
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `grifto-wishlist-${wishlist.shareSlug}.png`;
    link.click();
  }

  return (
    <Dialog open={open} onClose={onClose} title="Share your wishlist">
      <div className="space-y-5">
        <div>
          <p className="mb-1.5 text-sm font-medium text-neutral-700">Public link</p>
          <div className="flex gap-2">
            <Input readOnly value={wishlist.shareUrl} aria-label="Wishlist share URL" />
            <Button variant="secondary" onClick={copyLink}>
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 rounded-lg border border-neutral-200 p-4">
          {qrPreview ? (
            /* plain <img>: QR is a locally generated data URL */
            <img src={qrPreview} alt="Wishlist QR code" className="size-40" />
          ) : (
            <div className="size-40 animate-pulse rounded bg-neutral-100" />
          )}
          <p className="text-center text-xs text-neutral-500">
            Print this QR code on your wedding invitation — guests scan it to open your wishlist.
          </p>
          <Button variant="outline" onClick={downloadQr}>
            Download hi-res QR
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
