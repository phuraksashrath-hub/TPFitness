namespace FitnessCenter.Api.Domain;

public enum UserRole
{
    ADMIN = 0,
    TRAINER = 1,
    MEMBER = 2
}

public enum UserStatus
{
    ACTIVE = 0,
    INACTIVE = 1,
    SUSPENDED = 2
}

public enum SubscriptionStatus
{
    ACTIVE = 0,
    EXPIRED = 1,
    CANCELLED = 2,
    PENDING_PAYMENT = 3
}

public enum SessionStatus
{
    BOOKED = 0,
    COMPLETED = 1,
    CANCELLED = 2,
    NO_SHOW = 3
}

public enum PaymentStatus
{
    PENDING = 0,
    PAID = 1,
    FAILED = 2,
    REFUNDED = 3
}

public enum PaymentMethod
{
    CREDIT_CARD = 0,
    PROMPT_PAY = 1
}

public enum EquipmentStatus
{
    AVAILABLE = 0,
    IN_USE = 1,
    UNDER_MAINTENANCE = 2,
    RETIRED = 3
}

public enum MaintenanceStatus
{
    OPEN = 0,
    IN_PROGRESS = 1,
    RESOLVED = 2,
    REJECTED = 3
}

public enum MaintenancePriority
{
    LOW = 0,
    MEDIUM = 1,
    HIGH = 2,
    CRITICAL = 3
}
