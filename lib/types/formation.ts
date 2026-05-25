export type TrainingStatus = "draft" | "active" | "completed" | "cancelled";
export type EnrollmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
export type PaymentMethod = "especes" | "orange_money" | "virement" | "gratuit";

export type Training = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  duration_hours: number;
  price_gnf: number;
  max_participants: number;
  status: TrainingStatus;
  instructor_name: string | null;
  location: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type TrainingSession = {
  id: string;
  training_id: string;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  status: string;
  notes: string | null;
};

export type Trainee = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  function: string | null;
  notes: string | null;
  created_at: string;
};

export type EnrollmentRow = {
  id: string;
  training_id: string;
  trainee_id: string;
  session_id: string | null;
  status: EnrollmentStatus;
  amount_paid_gnf: number;
  payment_method: PaymentMethod | null;
  paid_at: string | null;
  enrolled_at: string;
  trainee?: { first_name: string; last_name: string };
  training?: { title: string };
};

export type CertificateRow = {
  id: string;
  certificate_number: string;
  training_id: string;
  trainee_id: string;
  issued_at: string;
  training?: { title: string };
  trainee?: { first_name: string; last_name: string };
};

export type CreateTrainingInput = {
  title: string;
  description?: string;
  category?: string;
  duration_hours?: number;
  price_gnf?: number;
  max_participants?: number;
  instructor_name?: string;
  location?: string;
  status?: TrainingStatus;
  created_by?: string;
};

export type CreateTraineeInput = {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company?: string;
  function?: string;
  notes?: string;
  created_by?: string;
};

export type CreateEnrollmentInput = {
  training_id: string;
  trainee_id: string;
  session_id?: string;
  status?: EnrollmentStatus;
  amount_paid_gnf?: number;
  payment_method?: PaymentMethod;
};

export type IssueCertificateInput = {
  training_id: string;
  trainee_id: string;
  enrollment_id?: string;
  score?: number;
  grade?: string;
  valid_until?: string;
  notes?: string;
};
