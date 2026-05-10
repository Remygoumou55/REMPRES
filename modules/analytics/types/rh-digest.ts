export type RhDeptKpisDigestV1 = {
  activeEmployees: number;
  pendingLeaves: number;
  rhUnreadAlerts: number;
  attendanceToday: number;
  recentHires: Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    created_at: string | null;
  }>;
  digestVersion?: number;
};
