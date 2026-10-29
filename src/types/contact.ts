export type ContactMessageDTO = {
  id: string; name: string; phone: string; email: string | null; message: string;
  status: "new" | "handled"; createdAt: string; handledAt: string | null; handledByName: string | null;
};
export type ContactListDTO = { items: ContactMessageDTO[]; page: number; totalPages: number; total: number; counts: { new: number; handled: number } };
