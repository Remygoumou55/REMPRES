export type MissionStatus = "draft" | "active" | "on_hold" | "completed" | "cancelled";
export type PhaseStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type DeliverableStatus = "pending" | "in_progress" | "submitted" | "approved" | "rejected";
export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "rescheduled";

export type Mission = {
  id: string;
  reference: string;
  title: string;
  description: string | null;
  client_id: string | null;
  client_name: string | null;
  status: MissionStatus;
  start_date: string | null;
  end_date: string | null;
  budget_gnf: number;
  amount_invoiced_gnf: number;
  amount_paid_gnf: number;
  lead_consultant: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type MissionPhase = {
  id: string;
  mission_id: string;
  title: string;
  description: string | null;
  status: PhaseStatus;
  start_date: string | null;
  end_date: string | null;
  order_index: number;
};

export type Deliverable = {
  id: string;
  mission_id: string;
  phase_id: string | null;
  title: string;
  description: string | null;
  status: DeliverableStatus;
  due_date: string | null;
  submitted_at: string | null;
  approved_at: string | null;
};

export type Appointment = {
  id: string;
  mission_id: string | null;
  title: string;
  description: string | null;
  appointment_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  client_name: string | null;
  status: AppointmentStatus;
  notes: string | null;
};

export type CreateMissionInput = {
  title: string;
  description?: string;
  client_name?: string;
  client_id?: string;
  start_date?: string;
  end_date?: string;
  budget_gnf?: number;
  lead_consultant?: string;
  status?: MissionStatus;
  notes?: string;
  created_by?: string;
};

export type CreateAppointmentInput = {
  title: string;
  appointment_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  client_name?: string;
  mission_id?: string;
  description?: string;
  notes?: string;
  created_by?: string;
};

export type CreateDeliverableInput = {
  mission_id: string;
  phase_id?: string;
  title: string;
  description?: string;
  due_date?: string;
  status?: DeliverableStatus;
};

export type CreatePhaseInput = {
  mission_id: string;
  title: string;
  description?: string;
  status?: PhaseStatus;
  start_date?: string;
  end_date?: string;
  order_index?: number;
};
