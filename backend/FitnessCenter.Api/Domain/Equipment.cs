namespace FitnessCenter.Api.Domain;

public class Equipment
{
    public int Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string SerialNumber { get; private set; } = string.Empty;
    public string Category { get; private set; } = "CARDIO";
    public string? Brand { get; private set; }
    public string? Location { get; private set; }
    public DateTime? PurchaseDate { get; private set; }
    public DateTime? LastServicedAt { get; private set; }
    public EquipmentStatus Status { get; private set; } = EquipmentStatus.AVAILABLE;
    public string? ImageUrl { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    public ICollection<MaintenanceRequest> MaintenanceRequests { get; private set; } = new List<MaintenanceRequest>();

    private Equipment() { }

    public Equipment(string name, string serialNumber, string category, string? brand, string? location, DateTime? purchaseDate, string? imageUrl)
    {
        Name = name;
        SerialNumber = serialNumber;
        Category = category;
        Brand = brand;
        Location = location;
        PurchaseDate = purchaseDate;
        ImageUrl = imageUrl;
    }

    public void Update(string name, string category, string? brand, string? location, DateTime? purchaseDate, string? imageUrl)
    {
        Name = name;
        Category = category;
        Brand = brand;
        Location = location;
        PurchaseDate = purchaseDate;
        ImageUrl = imageUrl;
    }

    public void SetStatus(EquipmentStatus status)
    {
        Status = status;
        if (status == EquipmentStatus.AVAILABLE) LastServicedAt = DateTime.UtcNow;
    }
}

public class MaintenanceRequest
{
    public int Id { get; private set; }

    public int EquipmentId { get; private set; }
    public Equipment Equipment { get; private set; } = null!;

    public int ReportedByUserId { get; private set; }
    public User ReportedBy { get; private set; } = null!;

    public int? AssignedToUserId { get; private set; }
    public User? AssignedTo { get; private set; }

    public string Title { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public MaintenancePriority Priority { get; private set; } = MaintenancePriority.MEDIUM;
    public MaintenanceStatus Status { get; private set; } = MaintenanceStatus.OPEN;
    public string? ResolutionNotes { get; private set; }
    public decimal? RepairCost { get; private set; }
    public DateTime ReportedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; private set; }

    private MaintenanceRequest() { }

    public MaintenanceRequest(Equipment equipment, User reportedBy, string title, string description, MaintenancePriority priority)
    {
        Equipment = equipment;
        EquipmentId = equipment.Id;
        ReportedBy = reportedBy;
        ReportedByUserId = reportedBy.Id;
        Title = title;
        Description = description;
        Priority = priority;
    }

    public void Assign(int userId)
    {
        AssignedToUserId = userId;
        if (Status == MaintenanceStatus.OPEN) Status = MaintenanceStatus.IN_PROGRESS;
    }

    public void Progress() => Status = MaintenanceStatus.IN_PROGRESS;

    public void Resolve(string? notes, decimal? cost)
    {
        Status = MaintenanceStatus.RESOLVED;
        ResolutionNotes = notes;
        RepairCost = cost;
        ResolvedAt = DateTime.UtcNow;
        Equipment.SetStatus(EquipmentStatus.AVAILABLE);
    }

    public void Reject(string? notes)
    {
        Status = MaintenanceStatus.REJECTED;
        ResolutionNotes = notes;
        ResolvedAt = DateTime.UtcNow;
    }
}
