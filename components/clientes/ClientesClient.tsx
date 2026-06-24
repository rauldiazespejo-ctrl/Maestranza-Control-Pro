"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { clientSchema, type ClientFormData } from "@/lib/validations/client";
import { createClient, updateClient, deleteClient } from "@/lib/actions/clients";
import type { Prisma } from "@prisma/client";

type ClientWithCount = Prisma.ClientGetPayload<{
  include: { _count: { select: { workOrders: true } } };
}>;

interface Props {
  clients: ClientWithCount[];
}

export function ClientesClient({ clients }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ClientWithCount | null>(null);
  const [search, setSearch] = React.useState(searchParams.get("search") ?? "");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", rut: "", industry: "", address: "", phone: "", email: "", paymentTerm: "", notes: "" },
  });

  React.useEffect(() => {
    if (editing) {
      reset({
        name: editing.name,
        rut: editing.rut ?? "",
        industry: editing.industry ?? "",
        address: editing.address ?? "",
        phone: editing.phone ?? "",
        email: editing.email ?? "",
        paymentTerm: editing.paymentTerm?.toString() ?? "",
        notes: editing.notes ?? "",
      });
    } else {
      reset({ name: "", rut: "", industry: "", address: "", phone: "", email: "", paymentTerm: "", notes: "" });
    }
  }, [editing, reset]);

  const onSubmit = async (data: ClientFormData) => {
    if (editing) await updateClient(editing.id, data);
    else await createClient(data);
    setIsOpen(false);
    setEditing(null);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este cliente?")) return;
    await deleteClient(id);
    router.refresh();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search) params.set("search", search);
    else params.delete("search");
    router.push(`/clientes?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-2xl font-bold text-white">Clientes</h1>
        <Button onClick={() => { setEditing(null); setIsOpen(true); }} className="gap-2"><Plus className="h-4 w-4" /> Nuevo cliente</Button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
          <Input placeholder="Buscar cliente..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button type="submit" variant="secondary">Buscar</Button>
      </form>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-navy-light text-left text-xs uppercase tracking-wide text-steel">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">RUT</th>
                  <th className="px-4 py-3">Industria</th>
                  <th className="px-4 py-3">Órdenes</th>
                  <th className="px-4 py-3">Plazo pago</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {clients.length === 0 && <tr><td colSpan={6} className="px-4 py-8"><EmptyState title="No hay clientes" /></td></tr>}
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-navy-light/30">
                    <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                    <td className="px-4 py-3 text-steel">{c.rut ?? "—"}</td>
                    <td className="px-4 py-3 text-steel">{c.industry ?? "—"}</td>
                    <td className="px-4 py-3"><Badge>{c._count.workOrders}</Badge></td>
                    <td className="px-4 py-3 text-steel">{c.paymentTerm ? `${c.paymentTerm} días` : "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(c); setIsOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-fire-bright" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onClose={() => { setIsOpen(false); setEditing(null); }} title={editing ? "Editar cliente" : "Nuevo cliente"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-steel">Nombre</label>
            <Input {...register("name")} />
            {errors.name && <p className="mt-1 text-xs text-fire-bright">{errors.name.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="mb-1 block text-xs font-medium text-steel">RUT</label><Input {...register("rut")} /></div>
            <div><label className="mb-1 block text-xs font-medium text-steel">Industria</label><Input {...register("industry")} /></div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-steel">Dirección</label>
            <Input {...register("address")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="mb-1 block text-xs font-medium text-steel">Teléfono</label><Input {...register("phone")} /></div>
            <div><label className="mb-1 block text-xs font-medium text-steel">Email</label><Input type="email" {...register("email")} /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="mb-1 block text-xs font-medium text-steel">Plazo de pago (días)</label><Input type="number" {...register("paymentTerm")} /></div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-steel">Notas</label>
            <textarea {...register("notes")} rows={3} className="w-full rounded-md border border-border-subtle bg-navy-dark px-3 py-2 text-sm text-white placeholder-steel/50 focus:border-fire focus:outline-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => { setIsOpen(false); setEditing(null); }}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : editing ? "Guardar cambios" : "Crear cliente"}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
