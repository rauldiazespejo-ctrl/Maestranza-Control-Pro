"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { documentSchema, type DocumentFormData } from "@/lib/validations/document";
import { createDocument, deleteDocument } from "@/lib/actions/documents";
import type { Document } from "@prisma/client";

interface Props {
  parentType: "workOrder" | "hseqRecord";
  parentId: string;
  documents: Document[];
}

export function DocumentosSection({ parentType, parentId, documents }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      name: "",
      url: "",
      type: "",
      isPublic: false,
      workOrderId: parentType === "workOrder" ? parentId : "",
      hseqRecordId: parentType === "hseqRecord" ? parentId : "",
    },
  });

  React.useEffect(() => {
    reset({
      name: "",
      url: "",
      type: "",
      isPublic: false,
      workOrderId: parentType === "workOrder" ? parentId : "",
      hseqRecordId: parentType === "hseqRecord" ? parentId : "",
    });
  }, [parentType, parentId, reset]);

  const onSubmit = async (data: DocumentFormData) => {
    setServerError(null);
    try {
      await createDocument(data);
      setIsOpen(false);
      reset();
      router.refresh();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Error al crear el documento");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este documento/evidencia?")) return;
    try {
      await deleteDocument(id);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al eliminar el documento");
    }
  };

  const title = parentType === "workOrder" ? "Documentos y evidencias" : "Documentos HSEQ";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">{title}</CardTitle>
        <Button size="sm" onClick={() => setIsOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Agregar documento
        </Button>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <EmptyState
            title="Sin documentos"
            description="Aún no se han registrado documentos o evidencias para este registro."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-navy-light text-left text-xs uppercase tracking-wide text-steel">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Visibilidad</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-navy-light/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-steel" />
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-white hover:text-fire"
                        >
                          {doc.name}
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {doc.type ? (
                        <Badge variant="secondary">{doc.type}</Badge>
                      ) : (
                        <span className="text-steel">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={doc.public ? "success" : "outline"}>
                        {doc.public ? "Público" : "Privado"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-steel">
                      {doc.createdAt.toLocaleDateString("es-CL")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(doc.url, "_blank", "noopener,noreferrer")}
                          aria-label="Abrir documento"
                        >
                          <ExternalLink className="h-4 w-4 text-steel" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(doc.id)}
                          aria-label="Eliminar documento"
                        >
                          <Trash2 className="h-4 w-4 text-fire-bright" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <Dialog
        open={isOpen}
        onClose={() => { setIsOpen(false); setServerError(null); reset(); }}
        title="Agregar documento / evidencia"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-steel">Nombre</label>
            <Input {...register("name")} placeholder="Ej: Evidencia fotográfica" />
            {errors.name && <p className="mt-1 text-xs text-fire-bright">{errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-steel">URL o referencia</label>
            <Input {...register("url")} placeholder="https://..." />
            {errors.url && <p className="mt-1 text-xs text-fire-bright">{errors.url.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-steel">Tipo (opcional)</label>
            <Input {...register("type")} placeholder="Ej: imagen, PDF, certificado" />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              {...register("isPublic")}
              className="h-4 w-4 rounded border-border-subtle bg-navy-dark text-fire"
            />
            <label htmlFor="isPublic" className="text-sm text-steel">Documento público</label>
          </div>
          {serverError && (
            <p className="rounded-md bg-fire-bright/10 p-2 text-xs text-fire-bright">{serverError}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setIsOpen(false); setServerError(null); reset(); }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar documento"}
            </Button>
          </div>
        </form>
      </Dialog>
    </Card>
  );
}
