import { LoadingState } from "@/components/ui/LoadingState";

export default function PortalLoading() {
  return (
    <LoadingState
      message="Actualizando órdenes y avances..."
      className="mx-auto min-h-48 max-w-4xl"
    />
  );
}
