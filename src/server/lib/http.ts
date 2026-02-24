import { NextResponse } from "next/server";

import { AppError } from "@/server/errors";

export const jsonOk = <T>(data: T, status = 200): NextResponse<T> => NextResponse.json(data, { status });

export const jsonError = (error: unknown): NextResponse<{ error: string }> => {
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }

  if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
    return NextResponse.json({ error: "Resource already exists" }, { status: 409 });
  }

  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
};
