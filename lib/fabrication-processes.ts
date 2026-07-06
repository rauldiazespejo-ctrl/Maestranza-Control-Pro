export type FabricationProcessDefinition = {
  code: string;
  group: string;
  name: string;
  defaultDays: number;
  responsibleRole: string;
};

export const fabricationProcessGroups = [
  "Detallamiento tecnico",
  "Ingenieria de diseno y fabricacion",
  "Preparacion de material",
  "Ensamble",
  "Soldadura",
  "Acabado superficial",
  "QA/QC",
  "Preparacion para despacho",
] as const;

export const fabricationProcessDefinitions: FabricationProcessDefinition[] = [
  { code: "DET-01", group: "Detallamiento tecnico", name: "Solicitud de material", defaultDays: 1, responsibleRole: "Planificacion" },
  { code: "DET-02", group: "Detallamiento tecnico", name: "Nesting de corte", defaultDays: 1, responsibleRole: "Ingenieria" },
  { code: "ING-01", group: "Ingenieria de diseno y fabricacion", name: "Visita a terreno / levantamiento", defaultDays: 1, responsibleRole: "Ingenieria" },
  { code: "ING-02", group: "Ingenieria de diseno y fabricacion", name: "Ingenieria inversa y modelamiento 3D", defaultDays: 2, responsibleRole: "Ingenieria" },
  { code: "ING-03", group: "Ingenieria de diseno y fabricacion", name: "Memoria de calculo y planimetria", defaultDays: 2, responsibleRole: "Ingenieria" },
  { code: "MAT-01", group: "Preparacion de material", name: "Corte CNC / corte manual", defaultDays: 2, responsibleRole: "Produccion" },
  { code: "MAT-02", group: "Preparacion de material", name: "Plegado, cilindrado, punzonado o curvado", defaultDays: 2, responsibleRole: "Produccion" },
  { code: "MAT-03", group: "Preparacion de material", name: "Mecanizado", defaultDays: 1, responsibleRole: "Produccion" },
  { code: "ENS-01", group: "Ensamble", name: "Armado de pieza", defaultDays: 2, responsibleRole: "Produccion" },
  { code: "ENS-02", group: "Ensamble", name: "Armado de subconjunto", defaultDays: 2, responsibleRole: "Produccion" },
  { code: "SOL-01", group: "Soldadura", name: "Aplicacion WPS", defaultDays: 2, responsibleRole: "Soldadura" },
  { code: "SOL-02", group: "Soldadura", name: "Remate de soldadura", defaultDays: 1, responsibleRole: "Soldadura" },
  { code: "SUP-01", group: "Acabado superficial", name: "Granallado y limpieza", defaultDays: 1, responsibleRole: "Produccion" },
  { code: "SUP-02", group: "Acabado superficial", name: "Pintura, esquema y RAL", defaultDays: 2, responsibleRole: "Produccion" },
  { code: "QA-01", group: "QA/QC", name: "Control dimensional", defaultDays: 1, responsibleRole: "Calidad" },
  { code: "QA-02", group: "QA/QC", name: "Control de soldadura", defaultDays: 1, responsibleRole: "Calidad" },
  { code: "QA-03", group: "QA/QC", name: "END: tintas, ultrasonido, RX o PH", defaultDays: 1, responsibleRole: "Calidad" },
  { code: "QA-04", group: "QA/QC", name: "Control de granallado y pintura", defaultDays: 1, responsibleRole: "Calidad" },
  { code: "DES-01", group: "Preparacion para despacho", name: "Armado de conjunto", defaultDays: 1, responsibleRole: "Produccion" },
  { code: "DES-02", group: "Preparacion para despacho", name: "Embalaje y packing list", defaultDays: 1, responsibleRole: "Logistica" },
  { code: "DES-03", group: "Preparacion para despacho", name: "Liberacion de despacho", defaultDays: 1, responsibleRole: "Calidad" },
];

export const totalFabricationProcessDays = fabricationProcessDefinitions.reduce(
  (total, process) => total + process.defaultDays,
  0
);
