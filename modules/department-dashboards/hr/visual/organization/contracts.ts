export type WorkforceOrgNode = {
  id: string;
  label: string;
  role?: string;
  children?: WorkforceOrgNode[];
};
