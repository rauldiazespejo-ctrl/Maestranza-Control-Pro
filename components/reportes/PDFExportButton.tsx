"use client";

import * as React from "react";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PDFDownloadLink,
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Prisma } from "@prisma/client";

interface PDFExportButtonProps {
  orders: Prisma.WorkOrderGetPayload<{ include: { client: true } }>[];
  overdueCount: number;
  avgProgress: number;
  clients: Prisma.ClientGetPayload<{
    include: { _count: { select: { workOrders: true } } };
  }>[];
}

/** Detecta client-side rendering sin setState en effect (React 19 compliant) */
function useIsClient() {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/** Documento PDF del reporte operacional */
function ReportPDFDocument({
  orders,
  overdueCount,
  avgProgress,
  clients,
}: PDFExportButtonProps) {
  const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 10, fontFamily: "Helvetica" },
    title: { fontSize: 16, marginBottom: 12, fontWeight: "bold" },
    subtitle: {
      fontSize: 12,
      marginBottom: 8,
      color: "#555",
    },
    tableHeader: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#000",
      paddingBottom: 4,
      marginBottom: 4,
      fontWeight: "bold",
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 0.5,
      borderBottomColor: "#ccc",
      paddingVertical: 4,
    },
    cell: { flex: 1, paddingRight: 4 },
    cellWide: { flex: 2, paddingRight: 4 },
    footer: {
      position: "absolute",
      bottom: 20,
      left: 30,
      right: 30,
      fontSize: 8,
      color: "#888",
      textAlign: "center",
    },
    section: { marginBottom: 12 },
    metricRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    metricBox: {
      flex: 1,
      padding: 8,
      borderWidth: 0.5,
      borderColor: "#ccc",
      marginRight: 4,
    },
    metricLabel: { fontSize: 8, color: "#666", marginBottom: 2 },
    metricValue: { fontSize: 12, fontWeight: "bold" },
  });

  const statusCounts = orders.reduce<Record<string, number>>(
    (acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    },
    {},
  );

  return (
    <Document>
      <Page style={styles.page}>
        <Text style={styles.title}>Reporte Operacional</Text>
        <Text style={styles.subtitle}>
          {`ForgeOps | ${new Date().toLocaleDateString("es-CL")}`}
        </Text>
        <View style={styles.section}>
          <View style={styles.metricRow}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Total Ordenes</Text>
              <Text style={styles.metricValue}>{orders.length}</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Atrasadas</Text>
              <Text style={styles.metricValue}>{overdueCount}</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Avance Promedio</Text>
              <Text style={styles.metricValue}>{`${avgProgress}%`}</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Clientes</Text>
              <Text style={styles.metricValue}>{clients.length}</Text>
            </View>
          </View>
        </View>
        <Text style={[styles.subtitle, { marginTop: 8 }]}>
          Ordenes por estado
        </Text>
        <View style={styles.tableHeader}>
          <Text style={styles.cellWide}>Estado</Text>
          <Text style={styles.cell}>Cantidad</Text>
        </View>
        {Object.entries(statusCounts).map(([status, count]) => (
          <View key={status} style={styles.tableRow}>
            <Text style={styles.cellWide}>{status}</Text>
            <Text style={styles.cell}>{String(count)}</Text>
          </View>
        ))}
        <Text style={[styles.subtitle, { marginTop: 12 }]}>
          Indicadores por cliente
        </Text>
        <View style={styles.tableHeader}>
          <Text style={styles.cellWide}>Cliente</Text>
          <Text style={styles.cell}>Ordenes</Text>
        </View>
        {clients.map((c) => (
          <View key={c.id} style={styles.tableRow}>
            <Text style={styles.cellWide}>{c.name}</Text>
            <Text style={styles.cell}>{String(c._count.workOrders)}</Text>
          </View>
        ))}
        <Text style={styles.footer}>
          {`ForgeOps | ${new Date().toLocaleDateString("es-CL")}`}
        </Text>
      </Page>
    </Document>
  );
}
ReportPDFDocument.displayName = "ReportPDFDocument";

/**
 * Boton para exportar el reporte operacional a PDF.
 * Usa useSyncExternalStore para deteccion de cliente (React 19 compliant).
 */
export function PDFExportButton({
  orders,
  overdueCount,
  avgProgress,
  clients,
}: PDFExportButtonProps) {
  const isClient = useIsClient();

  if (!isClient) {
    return (
      <Button variant="outline" className="gap-2" disabled>
        <FileDown className="h-4 w-4" />
        Exportar PDF
      </Button>
    );
  }

  return (
    <PDFDownloadLink
      document={
        <ReportPDFDocument
          orders={orders}
          overdueCount={overdueCount}
          avgProgress={avgProgress}
          clients={clients}
        />
      }
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
