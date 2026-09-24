"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Power, Trash2 } from "lucide-react";
import { toggleQrCodeAction, deleteQrCodeAction } from "@/actions/qr-codes";
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

export function DetailActions({
  qrCodeId,
  name,
  isActive,
}: {
  qrCodeId: string;
  name: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleQrCodeAction(qrCodeId);
      toast.success(isActive ? "QR code disabled" : "QR code enabled");
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteQrCodeAction(qrCodeId);
      toast.success(`"${name}" deleted`);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        onClick={handleToggle}
        disabled={isPending}
        className="gap-2"
      >
        <Power className="size-4" />
        {isActive ? "Disable" : "Enable"}
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={isPending} className="gap-2">
            <Trash2 className="size-4" />
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the QR code and all of its scan history.
              Anyone scanning the printed code will see an error page. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isPending ? "Deleting…" : "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
