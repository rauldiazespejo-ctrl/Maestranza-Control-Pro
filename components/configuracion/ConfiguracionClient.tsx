"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { createUser, toggleUserActive } from "@/lib/actions/users";
import { saveCompany } from "@/lib/actions/company";
import { companySchema, type CompanyFormData } from "@/lib/validations/company";
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
  const [companyMessage, setCompanyMessage] = React.useState<string | null>(null);
  const [companyError, setCompanyError] = React.useState<string | null>(null);
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

  const {
    register: registerCompany,
    handleSubmit: handleCompanySubmit,
    reset: resetCompany,
    formState: { errors: companyErrors, isSubmitting: companySubmitting },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company?.name ?? "",
      rut: company?.rut ?? "",
      address: company?.address ?? "",
      phone: company?.phone ?? "",
      email: company?.email ?? "",
      logoUrl: company?.logoUrl ?? "",
    },
  });

  const role = useWatch({ control, name: "role" });

  React.useEffect(() => {
    resetCompany({
      name: company?.name ?? "",
      rut: company?.rut ?? "",
      address: company?.address ?? "",
      phone: company?.phone ?? "",
      email: company?.email ?? "",
      logoUrl: company?.logoUrl ?? "",
    });
  }, [company, resetCompany]);

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

  const onCompanySubmit = async (data: CompanyFormData) => {
    setCompanyMessage(null);
    setCompanyError(null);
    try {
      await saveCompany(data, company?.id);
      setCompanyMessage("Datos de empresa actualizados.");
      router.refresh();
    } catch (err) {
      setCompanyError(err instanceof Error ? err.message : "No se pudo actualizar la empresa");
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold text-white">Configuración</h1>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-cyan-bright" />
              Datos de empresa
            </CardTitle>
            <p className="mt-1 text-sm text-steel">
              Estos datos alimentan encabezados, reportes y trazabilidad documental.
            </p>
          </div>
          {companyMessage && <Badge variant="default">{companyMessage}</Badge>}
        </CardHeader>
        <CardContent>
          {companyError && (
            <div className="mb-4 rounded-lg border border-fire/30 bg-fire/10 p-3 text-sm text-fire-bright">
              {companyError}
            </div>
          )}
          <form onSubmit={handleCompanySubmit(onCompanySubmit)} className="grid gap-4 lg:grid-cols-2">
            <div>
              <Label className="mb-2 block">Razón social</Label>
              <Input {...registerCompany("name")} placeholder="BOILER COMP S.A." />
              {companyErrors.name && <p className="mt-1 text-xs text-fire-bright">{companyErrors.name.message}</p>}
            </div>
            <div>
              <Label className="mb-2 block">RUT empresa</Label>
              <Input {...registerCompany("rut")} placeholder="76.238.153-2" />
              {companyErrors.rut && <p className="mt-1 text-xs text-fire-bright">{companyErrors.rut.message}</p>}
            </div>
            <div className="lg:col-span-2">
              <Label className="mb-2 block">Dirección</Label>
              <Input {...registerCompany("address")} placeholder="Dirección comercial" />
              {companyErrors.address && <p className="mt-1 text-xs text-fire-bright">{companyErrors.address.message}</p>}
            </div>
            <div>
              <Label className="mb-2 block">Email</Label>
              <Input type="email" {...registerCompany("email")} placeholder="contacto@empresa.cl" />
              {companyErrors.email && <p className="mt-1 text-xs text-fire-bright">{companyErrors.email.message}</p>}
            </div>
            <div>
              <Label className="mb-2 block">Teléfono</Label>
              <Input {...registerCompany("phone")} placeholder="+56 2 2345 6789" />
              {companyErrors.phone && <p className="mt-1 text-xs text-fire-bright">{companyErrors.phone.message}</p>}
            </div>
            <div className="lg:col-span-2">
              <Label className="mb-2 block">Logo URL</Label>
              <Input {...registerCompany("logoUrl")} placeholder="https://..." />
              {companyErrors.logoUrl && <p className="mt-1 text-xs text-fire-bright">{companyErrors.logoUrl.message}</p>}
            </div>
            <div className="flex justify-end lg:col-span-2">
              <Button type="submit" disabled={companySubmitting} className="gap-2">
                <Save className="h-4 w-4" />
                {companySubmitting ? "Guardando..." : company ? "Guardar empresa" : "Crear empresa"}
              </Button>
            </div>
          </form>
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
