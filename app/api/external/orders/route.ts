export const dynamic = "force-dynamic"
import { validateApiKey, unauthorizedResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const organization = await validateApiKey();

    if (!organization) {
        return unauthorizedResponse();
    }

    try {
        const orders = await prisma.order.findMany({
            where: {
                organizationId: organization.id,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 50, // Limit to 50 for now
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                invoices: {
                    select: {
                        id: true,
                        invoiceNumber: true,
                        status: true,
                        totalGross: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            data: orders,
            meta: {
                count: orders.length,
                organization: organization.name,
            },
        });
    } catch (error) {
        console.error("[EXTERNAL_API_ORDERS]", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
