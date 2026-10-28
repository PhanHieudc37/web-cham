import { notFound } from "next/navigation";
import { AppError } from "@/server/errors";

export async function readCatalogPage<T>(read: () => Promise<T>): Promise<T> {
  try { return await read(); }
  catch (error) { if (error instanceof AppError && error.code === "NOT_FOUND") notFound(); throw error; }
}
