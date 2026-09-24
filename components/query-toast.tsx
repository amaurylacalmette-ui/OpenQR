"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function QueryToast({
  param,
  message,
}: {
  param: string;
  message: string;
}) {
  useEffect(() => {
    if (param === "1") {
      toast.success(message);
    }
  }, [param, message]);
  return null;
}
