export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server';
;
import { auth } from "@/lib/auth";
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  const session = await auth();
  //@ts-ignore
  const user = session?.user;

  if (!user || user.role !== 'ADMIN' || !user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action, path: requestedPath, content } = await req.json();
    const basePath = process.cwd();
    // Basic security sandbox (prevent escaping project root) - simplistic for now
    const safePath = path.resolve(basePath, requestedPath || '.');
    if (!safePath.startsWith(basePath)) {
        return NextResponse.json({ error: 'Access denied: Path outside project root' }, { status: 403 });
    }

    if (action === 'LIST') {
        const stats = await fs.stat(safePath);
        if (!stats.isDirectory()) {
             return NextResponse.json({ error: 'Not a directory' }, { status: 400 });
        }
        const files = await fs.readdir(safePath, { withFileTypes: true });
        const result = files.map(f => ({
            name: f.name,
            isDirectory: f.isDirectory(),
            path: path.relative(basePath, path.join(safePath, f.name))
        }));
        return NextResponse.json({ files: result, cwd: path.relative(basePath, safePath) });
    }

    if (action === 'READ') {
        const content = await fs.readFile(safePath, 'utf-8');
        return NextResponse.json({ content });
    }

    if (action === 'WRITE') {
        await fs.writeFile(safePath, content, 'utf-8');
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('File API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
