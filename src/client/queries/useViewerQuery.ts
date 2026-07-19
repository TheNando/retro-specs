import { useQuery } from "@tanstack/react-query";
import { getViewer } from "../getViewer";

export const useViewerQuery = () =>
  useQuery({
    queryKey: ["github", "viewer"],
    queryFn: getViewer,
  });
