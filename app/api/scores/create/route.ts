import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { put } from "@vercel/blob";
import { logActivity } from "@/lib/logger";

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  
  if (!clerkId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await currentUser();
  const isMaster = !!user?.publicMetadata?.isMaster;
  const isArchiver = !!user?.publicMetadata?.isArchiver;

  if (!isMaster && !isArchiver) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const formData = await req.formData();
  const title = formData.get("title") as string;
  const file = formData.get("file") as File;
  const categoryId = formData.get("categoryId") as string;
  const rolesRaw = formData.getAll("roles");

  const isDocument = formData.get("isDocument") === "true" || formData.get("isDocument") === "on";

  if (!file || !title) {
    return new NextResponse("Faltan campos obligatorios", { status: 400 });
  }

  // Validaciones
  if (!categoryId && !isDocument) {
    return new NextResponse("Debes seleccionar un Repertorio o marcarlo como Documento.", { status: 400 });
  }
  if (rolesRaw.length === 0 && !isDocument) {
    return new NextResponse("Debes seleccionar al menos un instrumento o marcarlo como Documento (Público).", { status: 400 });
  }

  // 1. Subir a Vercel Blob
  let fileUrl = "";
  try {
    const cleanTitle = title.trim().replace(/[^a-zA-Z0-9_]/g, "_");
    const rolesSuffix = isDocument 
      ? "Documento" 
      : rolesRaw.map(r => String(r).replace(/[^a-zA-Z0-9]/g, "")).join("_");
      
    const newFilename = `${cleanTitle}_${rolesSuffix}.pdf`;

    const blob = await put(newFilename, file, {
      access: 'public',
    });
    fileUrl = blob.url;
  } catch (err) {
    console.error("Error uploading to Vercel Blob:", err);
    return new NextResponse("Error subiendo el archivo al servidor de nube", { status: 500 });
  }

  // 2. Guardar en la base de datos
  try {
    const newScore = await prisma.score.create({
      data: {
        title,
        fileUrl,
        isDocument,
        categoryId: categoryId ? parseInt(categoryId) : null,
        allowedRoles: rolesRaw.map(r => String(r))
      },
      include: { category: true }
    });
    
    // LOG ACTIVIDAD
    await logActivity("Nueva Partitura Publicada", clerkId, { 
      titulo: title, 
      programa: newScore.category?.name || "Sin programa",
      esDocumento: isDocument 
    });

    return NextResponse.json(newScore);
  } catch (error) {
    console.error("Error creating score in Prisma:", error);
    return new NextResponse("Error en la base de datos al guardar la partitura", { status: 500 });
  }
}
