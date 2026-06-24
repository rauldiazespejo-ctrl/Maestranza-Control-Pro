"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { createUser, toggleUserActive } from "@/lib/actions/users";
import type { Prisma } from "@prisma/client";

type User = Prisma.UserGetPayload<{ select: { id: true; email: true; name: true; role: true; active: true; clientId: true; companyId: true } }>;
type Company = Prisma.CompanyGetPayload<object>;

interface Props {
  users: User[];
  company: Company | null;
  clients: { id: string; name: string }[];
}

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(4),
  role: z.enum(["ADMIN", "HSEQ_MANAGER", "OPERATIONS", "CLIENT", "VIEWER"]),
  clientId: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  HSEQ_MANAGER: "Gerente HSEQ",
  OPERATIONS: "Operaciones",
  CLIENT: "Cliente",
  VIEWER: "Visualizador",
};

export function ConfiguracionClient({ users, company, clients }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: "", email: "", password: "", role: "VIEWER" },
  });

  const role = useWatch({ control, name: "role" });

  const onSubmit = async (data: UserFormData) => {
    await createUser(data);
    setIsOpen(false);
    reset();
    router.refresh();
  };

  const handleToggle = async (id: string, active: boolean) => {
    await toggleUserActive(id, !active);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold text-white">Configuración</h1>

      <Card>
        <CardHeader><CardTitle>Datos de empresa</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {company ? (
            <>
              <p className="text-white"><span className="text-steel">Razón social:</span> {company.name}</p>
              <p className="text-white"><span className="text-steel">RUT:</span> {company.rut}</p>
              <p className="text-white"><span className="text-steel">Dirección:</span> {company.address ?? "—"}</p>
              <p className="text-white"><span className="text-steel">Email:</span> {company.email ?? "—"}</p>
              <p className="text-white"><span className="text-steel">Teléfono:</span> {company.phone ?? "—"}</p>
            </>
          ) : (
            <p className="text-steel">No hay empresa configurada.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Usuarios y roles</CardTitle>
          <Button onClick={() => setIsOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Nuevo usuario</Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-navy-light text-left text-xs uppercase text-steel">
                <tr><th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Rol</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3 text-right">Acciones</th></tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-navy-light/30">
                    <td className="px-4 py-3 text-white">{u.name}</td>
                    <td className="px-4 py-3 text-steel">{u.email}</td>
                    <td className="px-4 py-3"><Badge>{roleLabels[u.role]}</Badge></td>
                    <td className="px-4 py-3"><Badge variant={u.active ? "default" : "secondary"}>{u.active ? "Activo" : "Inactivo"}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleToggle(u.id, u.active)}>{u.active ? "Desactivar" : "Activar"}</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)} title="Nuevo usuario">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-steel">Nombre</label>
            <Input {...register("name")} />
            {errors.name && <p className="mt-1 text-xs text-fire-bright">{errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-steel">Email</label>
            <Input type="email" {...register("email")} />
            {errors.email && <p className="mt-1 text-xs text-fire-bright">{errors.email.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-steel">Contraseña</label>
            <Input type="password" {...register("password")} />
            {errors.password && <p className="mt-1 text-xs text-fire-bright">{errors.password.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-steel">Rol</label>
            <Select {...register("role")}>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
          </div>
          {role === "CLIENT" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-steel">Cliente asociado</label>
              <Select {...register("clientId")}><option value="">Seleccionar cliente</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : "Crear usuario"}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
