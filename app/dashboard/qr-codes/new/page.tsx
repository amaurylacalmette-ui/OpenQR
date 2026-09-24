import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getBaseUrl } from "@/lib/qr";
import { CreateQrForm } from "@/components/qr/create-qr-form";

export const metadata: Metadata = { title: "Create QR Code" };

export default async function NewQrCodePage() {
  await requireUser();
  const baseUrl = await getBaseUrl();

  return <CreateQrForm baseUrl={baseUrl} />;
}
