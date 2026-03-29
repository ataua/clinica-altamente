import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/bcrypt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nome, email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email já está cadastrado" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const userRole = role || "PATIENT";
    const isPatient = userRole === "PATIENT";

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: userRole as "PATIENT" | "ADMIN" | "PROFESSIONAL" | "SECRETARY" | "RESPONSIBLE" | "TEACHER" | "COORDINATOR",
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      if (isPatient) {
        await tx.patient.create({
          data: {
            userId: newUser.id,
            phone: phone || null,
          },
        });
      }

      return newUser;
    });

    return NextResponse.json(
      { message: "Usuário criado com sucesso", user },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json(
      { error: "Erro ao criar usuário" },
      { status: 500 }
    );
  }
}
