import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function validateApiKey() {
    const headersList = await headers();
    const apiKey = headersList.get("x-api-key");

    if (!apiKey) {
        return null;
    }

    const keyRecord = await prisma.apiKey.findUnique({
        where: { key: apiKey },
        include: { organization: true },
    });

    if (!keyRecord) {
        return null;
    }

    // Update last used at in background (fire and forget)
    // await db.apiKey.update({
    //   where: { id: keyRecord.id },
    //   data: { lastUsedAt: new Date() },
    // });
    // Better to await it to ensure accuracy or use a separate job if high traffic
    await prisma.apiKey.update({
        where: { id: keyRecord.id },
        data: { lastUsedAt: new Date() },
    });

    return keyRecord.organization;
}

export function unauthorizedResponse() {
    return NextResponse.json(
        { error: "Unauthorized", message: "Invalid or missing API Key" },
        { status: 401 }
    );
}
