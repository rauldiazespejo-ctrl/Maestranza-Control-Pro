"use client";

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";
import type { Prisma } from "@prisma/client";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  title: {
    fontSize: 16,
    marginBottom: 12,
    fontWeight: "bold",
  },
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
  cell: {
    flex: 1,
    paddingRight: 4,
  },
  cellWide: {
    flex: 2,
    paddingRight: 4,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    fontSize: 8,
    color: "#888",
    textAlign: "center",
  },
  section: {
    marginBottom: 12,
  },
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
  metricLabel: {
    fontSize: 8,
    color: "#666",
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: "bold",
  },
});

// ── Types ───────────────────────────────────────────────────────────
type WorkOrderWithClient = Prisma.WorkOrderGetPayload<{
  include: { client: true };
}>;

type WorkerWithRelations = Prisma.WorkerGetPayload<{
  include: { assignments: { include: { workOrder: true } }; ledOrders: true };
}>;

// ── Orders PDF ──────────────────────────────────────────────────────
interface OrdersPDFProps {
  orders: WorkOrderWithClient[];
}

function OrdersPDFDocument({ orders }: OrdersPDFProps) {
  return (
    <Document>
      <Page style={styles.page}>
        <Text style={styles.title}>Reporte de Ordenes de Trabajo</Text>
        <Text style={styles.subtitle}>
          Total: {orders.length} ordenes | Generado: {new Date().toLocaleDateString("es-CL")}
        </Text>

        <View style={styles.tableHeader}>
          <Text style={styles.cell}>Codigo</Text>
          <Text style={styles.cellWide}>Titulo</Text>
          <Text style={styles.cell}>Cliente</Text>
          <Text style={styles.cell}>Estado</Text>
          <Text style={styles.cell}>Prioridad</Text>
          <Text style={styles.cell}>Avance</Text>
        </View>

        {orders.map((o) => (
          <View key={o.id} style={styles.tableRow}>
            <Text style={styles.cell}>{o.code}</Text>
            <Text style={styles.cellWide}>{o.title}</Text>
            <Text style={styles.cell}>{o.client?.name ?? "-"}</Text>
            <Text style={styles.cell}>{o.status}</Text>
            <Text style={styles.cell}>{o.priority}</Text>
            <Text style={styles.cell}>{o.progress}%</Text>
          </View>
        ))}

        <Text style={styles.footer}>
          ForgeOps | {new Date().toLocaleDateString("es-CL")}
        </Text>
      </Page>
    </Document>
  );
}

/**
 * Genera un componente PDFDownloadLink para exportar ordenes de trabajo.
 * @param orders - Lista de ordenes con cliente incluido.
 * @returns Componente PDFDownloadLink configurado.
 */
export function exportOrdersToPDF(
  orders: WorkOrderWithClient[]
): React.ReactElement {
  return (
    <PDFDownloadLink
      document={<OrdersPDFDocument orders={orders} />}
      fileName={`ordenes-${new Date().toISOString().slice(0, 10)}.pdf`}
    >
      {({ loading }) => (loading ? "Generando PDF..." : "Descargar PDF")}
    </PDFDownloadLink>
  );
}

// ── Workers PDF ─────────────────────────────────────────────────────
interface WorkersPDFProps {
  workers: WorkerWithRelations[];
}

function WorkersPDFDocument({ workers }: WorkersPDFProps) {
  return (
    <Document>
      <Page style={styles.page}>
        <Text style={styles.title}>Reporte de Trabajadores</Text>
        <Text style={styles.subtitle}>
          Total: {workers.length} trabajadores | Generado:{" "}
          {new Date().toLocaleDateString("es-CL")}
        </Text>

        <View style={styles.tableHeader}>
          <Text style={styles.cellWide}>Nombre</Text>
          <Text style={styles.cell}>RUT</Text>
          <Text style={styles.cell}>Cargo</Text>
          <Text style={styles.cell}>Especialidad</Text>
          <Text style={styles.cell}>Estado</Text>
          <Text style={styles.cell}>Asignaciones</Text>
        </View>

        {workers.map((w) => (
          <View key={w.id} style={styles.tableRow}>
            <Text style={styles.cellWide}>{w.name}</Text>
            <Text style={styles.cell}>{w.rut}</Text>
            <Text style={styles.cell}>{w.position}</Text>
            <Text style={styles.cell}>{w.specialty ?? "-"}</Text>
            <Text style={styles.cell}>{w.status}</Text>
            <Text style={styles.cell}>{w.assignments.length}</Text>
          </View>
        ))}

        <Text style={styles.footer}>
          ForgeOps | {new Date().toLocaleDateString("es-CL")}
        </Text>
      </Page>
    </Document>
  );
}

/**
 * Genera un componente PDFDownloadLink para exportar trabajadores.
 * @param workers - Lista de trabajadores con asignaciones incluidas.
 * @returns Componente PDFDownloadLink configurado.
 */
export function exportWorkersToPDF(
  workers: WorkerWithRelations[]
): React.ReactElement {
  return (
    <PDFDownloadLink
      document={<WorkersPDFDocument workers={workers} />}
      fileName={`trabajadores-${new Date().toISOString().slice(0, 10)}.pdf`}
    >
      {({ loading }) => (loading ? "Generando PDF..." : "Descargar PDF")}
    </PDFDownloadLink>
  );
}

// ── Report PDF ──────────────────────────────────────────────────────
interface ReportData {
  orders: WorkOrderWithClient[];
  overdueCount: number;
  avgProgress: number;
  clients: Prisma.ClientGetPayload<{
    include: { _count: { select: { workOrders: true } } };
  }>[];
}

interface ReportPDFProps {
  data: ReportData;
}

function ReportPDFDocument({ data }: ReportPDFProps) {
  const { orders, overdueCount, avgProgress, clients } = data;
  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <Document>
      <Page style={styles.page}>
        <Text style={styles.title}>Reporte Operacional</Text>
        <Text style={styles.subtitle}>
          ForgeOps | {new Date().toLocaleDateString("es-CL")}
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
              <Text style={styles.metricValue}>{avgProgress}%</Text>
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
            <Text style={styles.cell}>{count}</Text>
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
            <Text style={styles.cell}>{c._count.workOrders}</Text>
          </View>
        ))}

        <Text style={styles.footer}>
          ForgeOps | {new Date().toLocaleDateString("es-CL")}
        </Text>
      </Page>
    </Document>
  );
}

/**
 * Genera un componente PDFDownloadLink para exportar el reporte operacional.
 * @param data - Datos del reporte incluyendo ordenes, conteo de atrasadas, progreso promedio y clientes.
 * @returns Componente PDFDownloadLink configurado.
 */
export function exportReportToPDF(data: ReportData): React.ReactElement {
  return (
    <PDFDownloadLink
      document={<ReportPDFDocument data={data} />}
      fileName={`reporte-operacional-${new Date().toISOString().slice(0, 10)}.pdf`}
    >
      {({ loading }) => (loading ? "Generando PDF..." : "Descargar PDF")}
    </PDFDownloadLink>
  );
}
