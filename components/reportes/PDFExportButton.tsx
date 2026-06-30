"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Prisma } from "@prisma/client";

// Dynamic import para evitar SSR issues con @react-pdf/renderer
const exportOrdersPDF = dynamic<{
  orders: Prisma.WorkOrderGetPayload<{ include: { client: true } }>[];
}>(() => import("@/lib/pdf-export").then((mod) => mod.exportOrdersToPDF as unknown as React.ComponentType<{
  orders: Prisma.WorkOrderGetPayload<{ include: { client: true } }>[];
}>), {
  ssr: false,
  loading: () => <span className="text-xs text-steel">Cargando...</span>,
});

interface PDFExportButtonProps {
  orders: Prisma.WorkOrderGetPayload<{ include: { client: true } }>[];
  overdueCount: number;
  avgProgress: number;
  clients: Prisma.ClientGetPayload<{ include: { _count: { select: { workOrders: true } } } }>[];
}

/**
 * Boton para exportar el reporte operacional a PDF.
 * Usa dynamic import para evitar problemas de SSR con @react-pdf/renderer.
 */
export function PDFExportButton({ orders, overdueCount, avgProgress, clients }: PDFExportButtonProps) {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <Button variant="outline" className="gap-2" disabled>
        <FileDown className="h-4 w-4" />
        Exportar PDF
      </Button>
    );
  }

  return (
    <PDFExportLink
      orders={orders}
      overdueCount={overdueCount}
      avgProgress={avgProgress}
      clients={clients}
    />
  );
}

// Componente interno que se renderiza solo en cliente
function PDFExportLink({ orders, overdueCount, avgProgress, clients }: PDFExportButtonProps) {
  const { PDFDownloadLink } = require("@react-pdf/renderer");

  const ReportPDFDocument = React.useMemo(() => {
    const { Document, Page, View, Text, StyleSheet } = require("@react-pdf/renderer");

    const styles = StyleSheet.create({
      page: { padding: 30, fontSize: 10, fontFamily: "Helvetica" },
      title: { fontSize: 16, marginBottom: 12, fontWeight: "bold" },
      subtitle: { fontSize: 12, marginBottom: 8, color: "#555" },
      tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#000", paddingBottom: 4, marginBottom: 4, fontWeight: "bold" },
      tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#ccc", paddingVertical: 4 },
      cell: { flex: 1, paddingRight: 4 },
      cellWide: { flex: 2, paddingRight: 4 },
      footer: { position: "absolute", bottom: 20, left: 30, right: 30, fontSize: 8, color: "#888", textAlign: "center" },
      section: { marginBottom: 12 },
      metricRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
      metricBox: { flex: 1, padding: 8, borderWidth: 0.5, borderColor: "#ccc", marginRight: 4 },
      metricLabel: { fontSize: 8, color: "#666", marginBottom: 2 },
      metricValue: { fontSize: 12, fontWeight: "bold" },
    });

    const statusCounts = orders.reduce<Record<string, number>>((acc: Record<string, number>, o: { status: string }) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    return () =>
      React.createElement(
        Document,
        {},
        React.createElement(
          Page,
          { style: styles.page },
          React.createElement(Text, { style: styles.title }, "Reporte Operacional"),
          React.createElement(
            Text,
            { style: styles.subtitle },
            `MAESTRANZA Control Pro | ${new Date().toLocaleDateString("es-CL")}`
          ),
          React.createElement(
            View,
            { style: styles.section },
            React.createElement(
              View,
              { style: styles.metricRow },
              React.createElement(
                View,
                { style: styles.metricBox },
                React.createElement(Text, { style: styles.metricLabel }, "Total Ordenes"),
                React.createElement(Text, { style: styles.metricValue }, orders.length)
              ),
              React.createElement(
                View,
                { style: styles.metricBox },
                React.createElement(Text, { style: styles.metricLabel }, "Atrasadas"),
                React.createElement(Text, { style: styles.metricValue }, overdueCount)
              ),
              React.createElement(
                View,
                { style: styles.metricBox },
                React.createElement(Text, { style: styles.metricLabel }, "Avance Promedio"),
                React.createElement(Text, { style: styles.metricValue }, `${avgProgress}%`)
              ),
              React.createElement(
                View,
                { style: styles.metricBox },
                React.createElement(Text, { style: styles.metricLabel }, "Clientes"),
                React.createElement(Text, { style: styles.metricValue }, clients.length)
              )
            )
          ),
          React.createElement(Text, { style: [styles.subtitle, { marginTop: 8 }] }, "Ordenes por estado"),
          React.createElement(
            View,
            { style: styles.tableHeader },
            React.createElement(Text, { style: styles.cellWide }, "Estado"),
            React.createElement(Text, { style: styles.cell }, "Cantidad")
          ),
          ...Object.entries(statusCounts).map(([status, count]) =>
            React.createElement(
              View,
              { key: status, style: styles.tableRow },
              React.createElement(Text, { style: styles.cellWide }, status),
              React.createElement(Text, { style: styles.cell }, String(count))
            )
          ),
          React.createElement(Text, { style: [styles.subtitle, { marginTop: 12 }] }, "Indicadores por cliente"),
          React.createElement(
            View,
            { style: styles.tableHeader },
            React.createElement(Text, { style: styles.cellWide }, "Cliente"),
            React.createElement(Text, { style: styles.cell }, "Ordenes")
          ),
          ...clients.map((c: { id: string; name: string; _count: { workOrders: number } }) =>
            React.createElement(
              View,
              { key: c.id, style: styles.tableRow },
              React.createElement(Text, { style: styles.cellWide }, c.name),
              React.createElement(Text, { style: styles.cell }, String(c._count.workOrders))
            )
          ),
          React.createElement(
            Text,
            { style: styles.footer },
            `MAESTRANZA Control Pro | ${new Date().toLocaleDateString("es-CL")}`
          )
        )
      );
  }, [orders, overdueCount, avgProgress, clients]);

  return (
    <PDFDownloadLink
      document={<ReportPDFDocument />}
      fileName={`reporte-operacional-${new Date().toISOString().slice(0, 10)}.pdf`}
    >
      {({ loading }: { loading: boolean }) => (
        <Button variant="outline" className="gap-2" disabled={loading}>
          <FileDown className="h-4 w-4" />
          {loading ? "Generando..." : "Exportar PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
