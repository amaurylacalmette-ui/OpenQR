import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ProfileForm, PasswordForm } from "@/components/settings/settings-forms";
import { DangerZone } from "@/components/settings/danger-zone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const qrCodeCount = await db.qRCode.count({ where: { userId: user.id } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account. Member since {formatDate(user.createdAt)}.
        </p>
      </div>

      <ProfileForm name={user.name} email={user.email} />
      <PasswordForm />

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>
            Deleting your account removes all QR codes and scan analytics
            immediately. There is no undo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DangerZone email={user.email} qrCodeCount={qrCodeCount} />
        </CardContent>
      </Card>
    </div>
  );
}
