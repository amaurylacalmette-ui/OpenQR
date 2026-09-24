"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Wand2 } from "lucide-react";
import { createQrCodeAction } from "@/actions/qr-codes";
import type { ActionState } from "@/actions/auth";
import { QrPreview } from "@/components/qr/qr-preview";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";

const initialState: ActionState = {};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-xs text-destructive">{messages[0]}</p>;
}

export function CreateQrForm({ baseUrl }: { baseUrl: string }) {
  const [state, formAction, isPending] = useActionState(
    createQrCodeAction,
    initialState
  );
  const [name, setName] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [description, setDescription] = useState("");

  // Preview shows a sample QR until a plausible URL is typed
  const previewData =
    /^https?:\/\/.+\..+/.test(destinationUrl.trim())
      ? destinationUrl.trim()
      : `${baseUrl}/r/your-code`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="size-8" aria-label="Back to QR codes">
          <Link href="/dashboard/qr-codes">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create QR Code</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            You can change the destination anytime — the printed code stays valid.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Name your code and set where it points today.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-5">
              {state.error ? (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. Restaurant menu — front door"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={100}
                />
                <FieldError messages={state.fieldErrors?.name} />
                <p className="text-xs text-muted-foreground">
                  Only visible to you — use anything that helps you stay organized.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destinationUrl">Destination URL</Label>
                <Input
                  id="destinationUrl"
                  name="destinationUrl"
                  type="url"
                  inputMode="url"
                  placeholder="https://example.com"
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  required
                />
                <FieldError messages={state.fieldErrors?.destinationUrl} />
                <p className="text-xs text-muted-foreground">
                  Must start with http:// or https://. Editable later without regenerating the code.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Where will you print or share this code?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
                <FieldError messages={state.fieldErrors?.description} />
              </div>

              <div className="flex gap-3 pt-1">
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      <Wand2 className="size-4" />
                      Create QR code
                    </>
                  )}
                </Button>
                <Button asChild type="button" variant="ghost">
                  <Link href="/dashboard/qr-codes">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-base">Live preview</CardTitle>
              <CardDescription>
                This is how your code will look when scanned.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <QrPreview
                data={previewData}
                pixelSize={190}
                className="shadow-sm"
              />
              <div className="w-full space-y-1.5 text-center">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Your code will point to
                </p>
                <p className="truncate rounded-lg bg-muted px-3 py-2 text-sm font-medium">
                  {destinationUrl.trim() || "https://example.com"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
