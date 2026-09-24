import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { renderQrPng, renderQrSvg, redirectUrlFor, getBaseUrl } from "@/lib/qr";

type Params = Promise<{ id: string }>;

const VALID_ECC = new Set(["L", "M", "Q", "H"]);

function sanitizeFilename(name: string): string {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[^\w\s.-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 48);
  return cleaned || "qr-code";
}

/**
 * GET /api/qr/{id}/download?format=png|svg[&size=128..2048]
 *
 * Streams the QR code (with the owner's saved customization) as a file
 * download. Requires an authenticated session and ownership of the code.
 */
export async function GET(request: Request, { params }: { params: Params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const qr = await db.qRCode.findFirst({
    where: { id, userId: user.id },
    select: {
      name: true,
      shortCode: true,
      foregroundColor: true,
      backgroundColor: true,
      size: true,
      errorCorrection: true,
    },
  });

  if (!qr) {
    return NextResponse.json({ error: "QR code not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "svg" ? "svg" : "png";

  let size = qr.size;
  const sizeParam = Number(url.searchParams.get("size"));
  if (Number.isInteger(sizeParam) && sizeParam >= 128 && sizeParam <= 2048) {
    size = sizeParam;
  }

  const ecc = VALID_ECC.has(qr.errorCorrection)
    ? (qr.errorCorrection as "L" | "M" | "Q" | "H")
    : "M";

  const baseUrl = await getBaseUrl();
  const data = redirectUrlFor(baseUrl, qr.shortCode);

  const baseName = sanitizeFilename(`${qr.name}-${qr.shortCode}`);

  try {
    if (format === "svg") {
      const svg = await renderQrSvg(data, {
        foregroundColor: qr.foregroundColor,
        backgroundColor: qr.backgroundColor,
        width: size,
        errorCorrectionLevel: ecc,
      });
      return new NextResponse(svg, {
        status: 200,
        headers: {
          "content-type": "image/svg+xml; charset=utf-8",
          "content-disposition": `attachment; filename="${baseName}.svg"`,
          "cache-control": "no-store",
        },
      });
    }

    const png = await renderQrPng(data, {
      foregroundColor: qr.foregroundColor,
      backgroundColor: qr.backgroundColor,
      width: size,
      errorCorrectionLevel: ecc,
    });
    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        "content-type": "image/png",
        "content-disposition": `attachment; filename="${baseName}.png"`,
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    console.error("QR download failed:", err);
    return NextResponse.json(
      { error: "Could not render the QR code" },
      { status: 500 }
    );
  }
}
