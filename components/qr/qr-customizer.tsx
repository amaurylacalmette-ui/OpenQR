"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, FileImage, Settings2 } from "lucide-react";
import { updateQrCustomizationAction } from "@/actions/qr-codes";
import type { ActionState } from "@/actions/auth";
import { QrPreview } from "@/components/qr/qr-preview";
import { CopyButton } from "@/components/qr/copy-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isScannableColorPair } from "@/lib/qr-client";
import { cn } from "@/lib/utils";

const initialState: ActionState = {};

const SIZES = [256, 512, 1024, 2048] as const;

const ECC_OPTIONS: { value: "L" | "M" | "Q" | "H"; label: string; hint: string }[] = [
  { value: "L", label: "L", hint: "7% recovery" },
  { value: "M", label: "M", hint: "15% recovery" },
  { value: "Q", label: "Q", hint: "25% recovery" },
  { value: "H", label: "H", hint: "30% recovery" },
];

export function QrCustomizerCard({
  qrCodeId,
  shortCode,
  redirectUrl,
  foregroundColor: initialFg,
  backgroundColor: initialBg,
  size: initialSize,
  errorCorrection: initialEcc,
}: {
  qrCodeId: string;
  shortCode: string;
  redirectUrl: string;
  foregroundColor: string;
  backgroundColor: string;
  size: number;
  errorCorrection: string;
}) {
  const [state, formAction, isPending] = useActionState(
    updateQrCustomizationAction,
    initialState
  );

  const [fg, setFg] = useState(initialFg);
  const [bg, setBg] = useState(initialBg);
  const [size, setSize] = useState(String(initialSize));
  const [ecc, setEcc] = useState(initialEcc as "L" | "M" | "Q" | "H");

  // Warn early but still let the server be the source of truth.
  const pairWarning = !isScannableColorPair(fg, bg);

  useEffect(() => {
    if (state.success) toast.success("Appearance saved");
    if (state.error) toast.error(state.error);
  }, [state]);

  const pairInvalid =
    !/^#[0-9a-fA-F]{6}$/.test(fg) || !/^#[0-9a-fA-F]{6}$/.test(bg) || pairWarning;

  const downloadHref = (format: "png" | "svg") =>
    `/api/qr/${qrCodeId}/download?format=${format}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="size-4 text-muted-foreground" />
          Appearance & downloads
        </CardTitle>
        <CardDescription>
          Customize colors, size and error correction. Downloads use saved settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Preview + short link + downloads */}
        <div className="flex flex-col items-center gap-4">
          <QrPreview
            data={redirectUrl}
            foregroundColor={fg}
            backgroundColor={bg}
            errorCorrectionLevel={ecc}
            pixelSize={188}
            className="shadow-sm"
          />
          <div className="flex w-full items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-muted px-3 py-2 text-sm text-center sm:text-left">
              /r/{shortCode}
            </code>
            <CopyButton value={redirectUrl} label="Copy" />
          </div>
          <div className="grid w-full grid-cols-2 gap-2">
            <Button asChild variant="outline" className="gap-2">
              <a href={downloadHref("png")} download>
                <FileImage className="size-4" />
                PNG
              </a>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <a href={downloadHref("svg")} download>
                <Download className="size-4" />
                SVG
              </a>
            </Button>
          </div>
        </div>

        {/* Customization form */}
        <form action={formAction} className="space-y-5 border-t pt-5">
          <input type="hidden" name="id" value={qrCodeId} />
          <input type="hidden" name="foregroundColor" value={fg} />
          <input type="hidden" name="backgroundColor" value={bg} />
          <input type="hidden" name="size" value={size} />
          <input type="hidden" name="errorCorrection" value={ecc} />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fg-color">Foreground</Label>
              <div className="flex items-center gap-2">
                <input
                  id="fg-color"
                  type="color"
                  value={fg}
                  onChange={(e) => setFg(e.target.value.toUpperCase())}
                  className="size-9 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5"
                  aria-label="Foreground color"
                />
                <Input
                  value={fg}
                  onChange={(e) => setFg(e.target.value.toUpperCase())}
                  className="h-9 font-mono text-xs"
                  maxLength={7}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bg-color">Background</Label>
              <div className="flex items-center gap-2">
                <input
                  id="bg-color"
                  type="color"
                  value={bg}
                  onChange={(e) => setBg(e.target.value.toUpperCase())}
                  className="size-9 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5"
                  aria-label="Background color"
                />
                <Input
                  value={bg}
                  onChange={(e) => setBg(e.target.value.toUpperCase())}
                  className="h-9 font-mono text-xs"
                  maxLength={7}
                />
              </div>
            </div>
          </div>

          {pairInvalid ? (
            <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              The foreground must be clearly darker than the background for scanners to
              read the code. Save is disabled until this is fixed.
            </p>
          ) : null}

          <div className="space-y-2">
            <Label>Export size</Label>
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger className="w-full" aria-label="Export size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SIZES.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s} × {s} px
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Larger exports stay sharp in print.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Error correction</Label>
            <RadioGroup
              value={ecc}
              onValueChange={(v) => setEcc(v as "L" | "M" | "Q" | "H")}
              className="grid grid-cols-4 gap-2"
            >
              {ECC_OPTIONS.map((opt) => (
                <Label
                  key={opt.value}
                  htmlFor={`ecc-${opt.value}`}
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-0.5 rounded-lg border p-2.5 text-center transition-colors",
                    ecc === opt.value
                      ? "border-emerald-600 bg-emerald-600/5 dark:border-emerald-400"
                      : "hover:bg-accent"
                  )}
                >
                  <RadioGroupItem
                    id={`ecc-${opt.value}`}
                    value={opt.value}
                    className="sr-only"
                  />
                  <span className="text-sm font-semibold">{opt.label}</span>
                  <span className="text-[10px] leading-tight text-muted-foreground">
                    {opt.hint}
                  </span>
                </Label>
              ))}
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              Higher levels survive more damage or occlusion, at slightly denser modules.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isPending || pairInvalid}>
            {isPending ? "Saving…" : "Save appearance"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
