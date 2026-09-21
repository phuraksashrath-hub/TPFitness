import { api } from "./api";
import type {
  AdminDashboard,
  AuthResponse,
  CheckoutResponse,
  DiscountQuote,
  Equipment,
  EquipmentStatus,
  MaintenancePriority,
  MaintenanceRequest,
  MaintenanceStatus,
  MemberDashboard,
  MembershipPlan,
  Payment,
  PaymentMethod,
  Subscription,
  Trainer,
  TrainerAvailability,
  TrainerDashboard,
  UserProfile,
  TrainerBlock,
  AuditLogEntry,
  TrialLead,
  Branch,
  GroupClass,
  ClassAttendee,
  MemberMetrics,
  WorkoutProgram,
  WorkoutSession,
} from "./types";

const unwrap = <T,>(promise: Promise<{ data: T }>) => promise.then((r) => r.data);

export const authApi = {
  login: (email: string, password: string) =>
    unwrap<AuthResponse>(api.post("/auth/login", { email, password })),
  register: (payload: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber?: string;
    role?: "MEMBER" | "TRAINER" | "ADMIN";
    specialization?: string;
  }) => unwrap<AuthResponse>(api.post("/auth/register", payload)),
  me: () => unwrap<UserProfile>(api.get("/auth/me")),
  updateProfile: (payload: { fullName: string; phoneNumber?: string | null; avatarUrl?: string | null }) =>
    unwrap<UserProfile>(api.put("/auth/me", payload)),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post("/auth/change-password", { currentPassword, newPassword }),
};

export const planApi = {
  list: (includeInactive = false) =>
    unwrap<MembershipPlan[]>(api.get("/plans", { params: { includeInactive } })),
  create: (payload: Partial<MembershipPlan>) => unwrap<MembershipPlan>(api.post("/plans", payload)),
  update: (id: number, payload: Partial<MembershipPlan>) =>
    unwrap<MembershipPlan>(api.put(`/plans/${id}`, payload)),
  deactivate: (id: number) => api.delete(`/plans/${id}`),
};

export interface CheckoutPayload {
  promoCode?: string;
  paymentMethod: PaymentMethod;
  cardHolderName?: string;
  cardNumber?: string;
  cardExpiry?: string;
  promptPayId?: string;
}

export const subscriptionApi = {
  mine: () => unwrap<Subscription[]>(api.get("/subscriptions/me")),
  active: () =>
    api.get("/subscriptions/me/active").then((r) => (r.status === 204 ? null : (r.data as Subscription))),
  quote: (membershipPlanId: number, promoCode?: string) =>
    unwrap<DiscountQuote>(api.post("/subscriptions/quote", { membershipPlanId, promoCode })),
  subscribe: (membershipPlanId: number, payload: CheckoutPayload & { autoRenew?: boolean }) =>
    unwrap<CheckoutResponse>(api.post("/subscriptions", { membershipPlanId, ...payload })),
  renew: (id: number, payload: CheckoutPayload) =>
    unwrap<CheckoutResponse>(api.post(`/subscriptions/${id}/renew`, payload)),
  cancel: (id: number) => unwrap<Subscription>(api.post(`/subscriptions/${id}/cancel`)),
};

export const paymentApi = {
  mine: (take = 20) => unwrap<Payment[]>(api.get("/payments/me", { params: { take } })),
  all: (take = 50, memberId?: number) =>
    unwrap<Payment[]>(api.get("/payments", { params: { take, memberId } })),
};

export const trainerApi = {
  list: (specialization?: string) =>
    unwrap<Trainer[]>(api.get("/trainers", { params: { specialization } })),
  byId: (id: number) => unwrap<Trainer>(api.get(`/trainers/${id}`)),
  updateExpertise: (payload: {
    specialization?: string | null;
    bio?: string | null;
    certifications?: string | null;
    yearsOfExperience: number;
    hourlyRate: number;
  }) => unwrap<Trainer>(api.put("/trainers/me/expertise", payload)),
  blocks: (from?: string, to?: string) =>
    unwrap<TrainerBlock[]>(api.get("/trainers/me/blocks", { params: { from, to } })),
  createBlock: (payload: { startTime: string; endTime: string; reason?: string | null }) =>
    unwrap<TrainerBlock>(api.post("/trainers/me/blocks", payload)),
  deleteBlock: (id: number) => api.delete(`/trainers/me/blocks/${id}`).then(() => undefined),
};

export const memberApi = {
  list: (search?: string) => unwrap<UserProfile[]>(api.get("/members", { params: { search } })),
  updateMetrics: (payload: {
    dateOfBirth?: string | null;
    gender?: string | null;
    heightCm?: number | null;
    weightKg?: number | null;
    bodyFatPercent?: number | null;
    muscleMassKg?: number | null;
    fitnessGoal?: string | null;
    emergencyContact?: string | null;
  }) => unwrap<UserProfile>(api.put("/members/me/metrics", payload)),
  metrics: () => unwrap<MemberMetrics>(api.get("/members/me/metrics")),
  setStatus: (id: number, status: "ACTIVE" | "INACTIVE" | "SUSPENDED") =>
    unwrap<UserProfile>(api.post(`/members/${id}/status`, null, { params: { status } })),
};

export const sessionApi = {
  mine: () => unwrap<WorkoutSession[]>(api.get("/sessions/me")),
  byTrainer: (trainerId: number, from?: string, to?: string) =>
    unwrap<WorkoutSession[]>(api.get(`/sessions/trainer/${trainerId}`, { params: { from, to } })),
  availability: (trainerId: number, date: string, durationMinutes = 60) =>
    unwrap<TrainerAvailability>(
      api.get("/sessions/availability", { params: { trainerId, date, durationMinutes } }),
    ),
  book: (payload: { trainerId: number; startTime: string; durationMinutes?: number; notes?: string }) =>
    unwrap<WorkoutSession>(api.post("/sessions/book", payload)),
  reschedule: (id: number, startTime: string, durationMinutes = 60) =>
    unwrap<WorkoutSession>(api.put(`/sessions/${id}/reschedule`, { startTime, durationMinutes })),
  cancel: (id: number, reason?: string) =>
    unwrap<WorkoutSession>(api.post(`/sessions/${id}/cancel`, { reason })),
  complete: (id: number, notes?: string) =>
    unwrap<WorkoutSession>(api.post(`/sessions/${id}/complete`, { notes })),
};

export interface SaveProgramPayload {
  memberId: number;
  title: string;
  goal?: string;
  description?: string;
  durationWeeks: number;
  difficulty: string;
  exercises: {
    name: string;
    dayOfWeek: number;
    sets: number;
    reps: number;
    weightKg?: number | null;
    restSeconds: number;
    notes?: string | null;
  }[];
}

export const programApi = {
  mine: () => unwrap<WorkoutProgram[]>(api.get("/programs/me")),
  forMember: (memberId: number) => unwrap<WorkoutProgram[]>(api.get(`/programs/member/${memberId}`)),
  create: (payload: SaveProgramPayload) => unwrap<WorkoutProgram>(api.post("/programs", payload)),
  update: (id: number, payload: SaveProgramPayload) =>
    unwrap<WorkoutProgram>(api.put(`/programs/${id}`, payload)),
  remove: (id: number) => api.delete(`/programs/${id}`),
};

export interface SaveEquipmentPayload {
  name: string;
  serialNumber: string;
  category: string;
  brand?: string;
  location?: string;
  purchaseDate?: string | null;
  imageUrl?: string | null;
}

export const equipmentApi = {
  list: (search?: string, status?: EquipmentStatus) =>
    unwrap<Equipment[]>(api.get("/equipment", { params: { search, status } })),
  create: (payload: SaveEquipmentPayload) => unwrap<Equipment>(api.post("/equipment", payload)),
  update: (id: number, payload: SaveEquipmentPayload) =>
    unwrap<Equipment>(api.put(`/equipment/${id}`, payload)),
  setStatus: (id: number, status: EquipmentStatus) =>
    unwrap<Equipment>(api.patch(`/equipment/${id}/status`, { status })),
  remove: (id: number) => api.delete(`/equipment/${id}`),
};

export const maintenanceApi = {
  list: (status?: MaintenanceStatus) =>
    unwrap<MaintenanceRequest[]>(api.get("/maintenance", { params: { status } })),
  report: (payload: {
    equipmentId: number;
    title: string;
    description: string;
    priority: MaintenancePriority;
  }) => unwrap<MaintenanceRequest>(api.post("/maintenance", payload)),
  assign: (id: number, assigneeUserId: number) =>
    unwrap<MaintenanceRequest>(api.post(`/maintenance/${id}/assign`, null, { params: { assigneeUserId } })),
  resolve: (id: number, resolutionNotes?: string, repairCost?: number) =>
    unwrap<MaintenanceRequest>(api.post(`/maintenance/${id}/resolve`, { resolutionNotes, repairCost })),
  reject: (id: number, resolutionNotes?: string) =>
    unwrap<MaintenanceRequest>(api.post(`/maintenance/${id}/reject`, { resolutionNotes })),
};

export const dashboardApi = {
  admin: () => unwrap<AdminDashboard>(api.get("/dashboard/admin")),
  member: () => unwrap<MemberDashboard>(api.get("/dashboard/member")),
  trainer: () => unwrap<TrainerDashboard>(api.get("/dashboard/trainer")),
};

export const auditApi = {
  latest: (take = 20) => unwrap<AuditLogEntry[]>(api.get("/audit", { params: { take } })),
};

export const leadApi = {
  create: (payload: {
    fullName: string;
    phone: string;
    email?: string | null;
    preferredTime?: string | null;
    website?: string | null;
  }) => api.post("/leads", payload).then(() => undefined),
  list: (status?: TrialLead["status"]) => unwrap<TrialLead[]>(api.get("/leads", { params: { status } })),
  setStatus: (id: number, status: TrialLead["status"]) =>
    unwrap<TrialLead>(api.post(`/leads/${id}/status`, null, { params: { status } })),
};

export interface SaveBranchPayload {
  name: string;
  address: string;
  district: string;
  province: string;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  openingHours?: string | null;
  facilities?: string[];
  isActive?: boolean;
}

export const branchApi = {
  list: (search?: string) => unwrap<Branch[]>(api.get("/branches", { params: { search } })),
  all: () => unwrap<Branch[]>(api.get("/branches/all")),
  create: (payload: SaveBranchPayload) => unwrap<Branch>(api.post("/branches", payload)),
  update: (id: number, payload: SaveBranchPayload) => unwrap<Branch>(api.put(`/branches/${id}`, payload)),
};

export interface SaveClassPayload {
  title: string;
  category: string;
  description?: string | null;
  room?: string | null;
  instructorId: number;
  branchId?: number | null;
  startTime: string;
  durationMinutes: number;
  capacity: number;
}

export const classApi = {
  list: (from?: string, to?: string) => unwrap<GroupClass[]>(api.get("/classes", { params: { from, to } })),
  manage: (from?: string, to?: string) => unwrap<GroupClass[]>(api.get("/classes/manage", { params: { from, to } })),
  mine: () => unwrap<GroupClass[]>(api.get("/classes/mine")),
  book: (id: number) => unwrap<GroupClass>(api.post(`/classes/${id}/book`)),
  cancelSeat: (id: number) => unwrap<GroupClass>(api.post(`/classes/${id}/cancel`)),
  roster: (id: number) => unwrap<ClassAttendee[]>(api.get(`/classes/${id}/roster`)),
  create: (payload: SaveClassPayload) => unwrap<GroupClass>(api.post("/classes", payload)),
  update: (id: number, payload: SaveClassPayload) => unwrap<GroupClass>(api.put(`/classes/${id}`, payload)),
  cancelClass: (id: number) => unwrap<GroupClass>(api.post(`/classes/${id}/cancel-class`)),
};
