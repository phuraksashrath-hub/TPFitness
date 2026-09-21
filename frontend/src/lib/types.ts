export type UserRole = "ADMIN" | "TRAINER" | "MEMBER";
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "CANCELLED" | "PENDING_PAYMENT";
export type SessionStatus = "BOOKED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type PaymentMethod = "CREDIT_CARD" | "PROMPT_PAY";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type EquipmentStatus = "AVAILABLE" | "IN_USE" | "UNDER_MAINTENANCE" | "RETIRED";
export type MaintenanceStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
export type MaintenancePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  displayTitle: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresAt: string;
  user: UserProfile;
}

export interface Trainer {
  id: number;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  specialization: string | null;
  bio: string | null;
  certifications: string | null;
  yearsOfExperience: number;
  hourlyRate: number;
  ratingAverage: number;
  ratingCount: number;
}

export interface MembershipPlan {
  id: number;
  name: string;
  description: string | null;
  price: number;
  durationDays: number;
  sessionsPerMonth: number;
  tier: string;
  perks: string[];
  isActive: boolean;
}

export interface Subscription {
  id: number;
  memberId: number;
  memberName: string;
  plan: MembershipPlan;
  startDate: string;
  endDate: string;
  remainingSessions: number;
  daysRemaining: number;
  status: SubscriptionStatus;
  autoRenew: boolean;
  isUsable: boolean;
}

export interface Payment {
  id: number;
  transactionReference: string;
  method: PaymentMethod;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  discountLabel: string | null;
  status: PaymentStatus;
  createdAt: string;
  paidAt: string | null;
  memberName: string | null;
  planName: string | null;
  qrPayload: string | null;
  cardLast4: string | null;
  cardBrand: string | null;
}

export interface CheckoutResponse {
  subscription: Subscription;
  payment: Payment;
  gatewayMessage: string;
}

export interface DiscountOption {
  label: string;
  amount: number;
}

export interface DiscountQuote {
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  label: string;
  allOffers: DiscountOption[];
}

export interface WorkoutSession {
  id: number;
  memberId: number;
  memberName: string;
  memberAvatarUrl: string | null;
  trainerId: number;
  trainerName: string;
  trainerSpecialization: string | null;
  startTime: string;
  endTime: string;
  status: SessionStatus;
  notes: string | null;
  cancellationReason: string | null;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface TrainerAvailability {
  trainerId: number;
  date: string;
  slots: TimeSlot[];
}

export interface WorkoutExercise {
  id: number;
  name: string;
  dayOfWeek: number;
  sets: number;
  reps: number;
  weightKg: number | null;
  restSeconds: number;
  notes: string | null;
}

export interface WorkoutProgram {
  id: number;
  memberId: number;
  memberName: string;
  trainerId: number;
  trainerName: string;
  title: string;
  goal: string | null;
  description: string | null;
  durationWeeks: number;
  difficulty: string;
  isActive: boolean;
  createdAt: string;
  exercises: WorkoutExercise[];
}

export interface Equipment {
  id: number;
  name: string;
  serialNumber: string;
  category: string;
  brand: string | null;
  location: string | null;
  purchaseDate: string | null;
  lastServicedAt: string | null;
  status: EquipmentStatus;
  imageUrl: string | null;
  openIssues: number;
}

export interface MaintenanceRequest {
  id: number;
  equipmentId: number;
  equipmentName: string;
  equipmentLocation: string | null;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  reportedByName: string;
  assignedToName: string | null;
  resolutionNotes: string | null;
  repairCost: number | null;
  reportedAt: string;
  resolvedAt: string | null;
}

export interface RevenuePoint {
  label: string;
  amount: number;
}

export interface AdminDashboard {
  totalMembers: number;
  activeSubscriptions: number;
  trainersOnDuty: number;
  sessionsToday: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  equipmentTotal: number;
  equipmentUnderMaintenance: number;
  openMaintenanceRequests: number;
  revenueTrend: RevenuePoint[];
  latestMaintenance: MaintenanceRequest[];
  latestPayments: Payment[];
  paymentMix: { creditCardPercent: number; promptPayPercent: number; totalTransactions: number };
  trainerCapacity: { percent: number; bookedSlots: number; totalSlots: number };
  zones: ZoneStatus[];
  /** PT sessions per hour of day (index 0–23). */
  hourlyLoad: number[];
}

export interface ZoneStatus {
  zone: string;
  total: number;
  available: number;
}

export interface MemberMetrics {
  dateOfBirth: string | null;
  gender: string | null;
  heightCm: number | null;
  weightKg: number | null;
  bodyFatPercent: number | null;
  muscleMassKg: number | null;
  fitnessGoal: string | null;
  emergencyContact: string | null;
}

export interface MemberDashboard {
  profile: UserProfile;
  activeSubscription: Subscription | null;
  sessionsCompleted: number;
  sessionsUpcoming: number;
  upcomingSessions: WorkoutSession[];
  programs: WorkoutProgram[];
  recentPayments: Payment[];
  metrics: MemberMetrics;
}

export interface ClientSummary {
  memberId: number;
  fullName: string;
  avatarUrl: string | null;
  fitnessGoal: string | null;
  totalSessions: number;
  nextSessionAt: string | null;
  activePrograms: number;
}

export interface TrainerDashboard {
  profile: UserProfile;
  sessionsToday: number;
  sessionsThisWeek: number;
  activeClients: number;
  ratingAverage: number;
  todaySchedule: WorkoutSession[];
  upcomingSessions: WorkoutSession[];
  clients: ClientSummary[];
  sessionsCompletedThisMonth: number;
  monthlySessionTarget: number;
  earningsThisMonth: number;
}

export interface TrainerBlock {
  id: number;
  startTime: string;
  endTime: string;
  reason: string | null;
}

export interface AuditLogEntry {
  id: number;
  occurredAt: string;
  actorName: string;
  actorRole: UserRole | "ANONYMOUS";
  category: "ACCESS" | "BILLING" | "BOOKING" | "CLASS" | "BRANCH" | "PEOPLE" | "FACILITY" | "PROGRAM" | "CATALOG" | "SCHEDULE" | "LEAD";
  action: string;
  detail: string | null;
  outcome: "SUCCESS" | "DENIED";
}

export type LeadStatus = "NEW" | "CONTACTED";

export interface TrialLead {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
  preferredTime: string | null;
  status: LeadStatus;
  createdAt: string;
}

export interface Branch {
  id: number;
  name: string;
  address: string;
  district: string;
  province: string;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  openingHours: string;
  facilities: string[];
  isActive: boolean;
}

export interface GroupClass {
  id: number;
  title: string;
  category: string;
  description: string | null;
  room: string | null;
  instructorId: number;
  instructorName: string;
  instructorAvatarUrl: string | null;
  branchId: number | null;
  branchName: string | null;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  seatsLeft: number;
  status: "SCHEDULED" | "CANCELLED";
  isBookedByMe: boolean;
}

export interface ClassAttendee {
  memberId: number;
  fullName: string;
  avatarUrl: string | null;
  bookedAt: string;
}
