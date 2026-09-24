"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteAccountAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DangerZone({
  email,
  qrCodeCount,
}: {
  email: string;
  qrCodeCount: number;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          <Trash2 className="size-4" />
          Delete account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete your account?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes your account ({email}), your{" "}
            {qrCodeCount} QR code{qrCodeCount === 1 ? "" : "s"} and all scan
            history. Printed codes will stop working. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => startTransition(async () => {
              await deleteAccountAction();
            })}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isPending ? "Deleting…" : "Yes, delete everything"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
