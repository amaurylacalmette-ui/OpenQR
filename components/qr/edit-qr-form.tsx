"use client";

import { useActionState, useEffect } from "react";
import { CheckCircle2, Loader2, PencilLine } from "lucide-react";
import { toast } from "sonner";
import { updateQrCodeAction } from "@/actions/qr-codes";
import type { ActionState } from "@/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";
import { useState } from "react";

const initialState: ActionState = {};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-xs text-destructive">{messages[0]}</p>;
}

export function EditQrForm({
  qrCodeId,
  name,
  destinationUrl,
  description,
  isActive,
}: {
  qrCodeId: string;
  name: string;
  destinationUrl: string;
  description: string | null;
  isActive: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    updateQrCodeAction,
    initialState
  );
  const [active, setActive] = useState(isActive);

  useEffect(() => {
    if (state.success) toast.success("QR code updated");
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PencilLine className="size-4 text-muted-foreground" />
          Destination & details
        </CardTitle>
        <CardDescription>
          Change where this code points — the short code and printed QR never change.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="id" value={qrCodeId} />
          <input type="hidden" name="isActive" value={active ? "on" : "off"} />

          {state.error ? (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              name="name"
              defaultValue={name}
              required
              maxLength={100}
            />
            <FieldError messages={state.fieldErrors?.name} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-url">Destination URL</Label>
            <Input
              id="edit-url"
              name="destinationUrl"
              type="url"
              inputMode="url"
              defaultValue={destinationUrl}
              required
            />
            <FieldError messages={state.fieldErrors?.destinationUrl} />
            <p className="text-xs text-muted-foreground">
              Saving a new URL is instant — previously printed codes start
              redirecting to the new destination immediately.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="edit-description"
              name="description"
              defaultValue={description ?? ""}
              rows={2}
              maxLength={500}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="edit-active" className="cursor-pointer">
                Active
              </Label>
              <p className="text-xs text-muted-foreground">
                Disabled codes show a friendly notice instead of redirecting.
              </p>
            </div>
            <Switch
              id="edit-active"
              checked={active}
              onCheckedChange={setActive}
            />
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                Save changes
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
