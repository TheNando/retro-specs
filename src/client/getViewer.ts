import { githubGraphql } from "./githubGraphql";

export type Viewer = {
  login: string;
  name: string | null;
  avatarUrl: string;
};

const viewerQuery = `query Viewer { viewer { login name avatarUrl } }`;

export const getViewer = async (): Promise<Viewer> => {
  const data = await githubGraphql<{ data: { viewer: Viewer } }>(viewerQuery);
  return data.data.viewer;
};
