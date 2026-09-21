namespace FitnessCenter.Api.Domain;

/// <summary>A physical club members can visit and where group classes are held.</summary>
public class Branch
{
    private static readonly char[] FacilitySeparators = { '|' };

    public int Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Address { get; private set; } = string.Empty;
    public string District { get; private set; } = string.Empty;
    public string Province { get; private set; } = string.Empty;
    public string? Phone { get; private set; }
    public double? Latitude { get; private set; }
    public double? Longitude { get; private set; }
    public string OpeningHours { get; private set; } = "เปิดให้บริการ 24 ชั่วโมง";
    /// <summary>Pipe-separated facility tags, e.g. "Free Weights|Cardio|Sauna".</summary>
    public string? Facilities { get; private set; }
    public bool IsActive { get; private set; } = true;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    private Branch() { }

    public Branch(string name, string address, string district, string province, string? phone,
        double? latitude, double? longitude, string? openingHours, IEnumerable<string>? facilities)
    {
        Apply(name, address, district, province, phone, latitude, longitude, openingHours, facilities);
    }

    public void Update(string name, string address, string district, string province, string? phone,
        double? latitude, double? longitude, string? openingHours, IEnumerable<string>? facilities, bool isActive)
    {
        Apply(name, address, district, province, phone, latitude, longitude, openingHours, facilities);
        IsActive = isActive;
    }

    public IReadOnlyList<string> FacilityList() =>
        string.IsNullOrWhiteSpace(Facilities)
            ? Array.Empty<string>()
            : Facilities.Split(FacilitySeparators, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    private void Apply(string name, string address, string district, string province, string? phone,
        double? latitude, double? longitude, string? openingHours, IEnumerable<string>? facilities)
    {
        if (latitude is < -90 or > 90 || longitude is < -180 or > 180)
            throw new ArgumentException("พิกัดของสาขาไม่ถูกต้อง");

        Name = name.Trim();
        Address = address.Trim();
        District = district.Trim();
        Province = province.Trim();
        Phone = string.IsNullOrWhiteSpace(phone) ? null : phone.Trim();
        Latitude = latitude;
        Longitude = longitude;
        OpeningHours = string.IsNullOrWhiteSpace(openingHours) ? "เปิดให้บริการ 24 ชั่วโมง" : openingHours.Trim();
        var tags = facilities?.Select(f => f.Trim()).Where(f => f.Length > 0).Distinct().ToList();
        Facilities = tags is { Count: > 0 } ? string.Join('|', tags) : null;
    }
}

public enum ClassStatus
{
    SCHEDULED = 0,
    CANCELLED = 1
}

public enum ClassBookingStatus
{
    BOOKED = 0,
    CANCELLED = 1
}

/// <summary>A scheduled group class with a seat limit (HIIT, Yoga, BodyPump, …).</summary>
public class GroupClass
{
    public int Id { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Category { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public string? Room { get; private set; }

    public int InstructorId { get; private set; }
    public Trainer Instructor { get; private set; } = null!;

    public int? BranchId { get; private set; }
    public Branch? Branch { get; private set; }

    public DateTime StartTime { get; private set; }
    public DateTime EndTime { get; private set; }
    public int Capacity { get; private set; }
    public ClassStatus Status { get; private set; } = ClassStatus.SCHEDULED;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    public ICollection<ClassBooking> Bookings { get; private set; } = new List<ClassBooking>();

    private GroupClass() { }

    public GroupClass(string title, string category, string? description, string? room, int instructorId,
        int? branchId, DateTime startTime, DateTime endTime, int capacity)
    {
        Apply(title, category, description, room, instructorId, branchId, startTime, endTime, capacity);
    }

    public void Update(string title, string category, string? description, string? room, int instructorId,
        int? branchId, DateTime startTime, DateTime endTime, int capacity)
    {
        if (Status == ClassStatus.CANCELLED)
            throw new InvalidOperationException("คลาสที่ยกเลิกแล้วแก้ไขไม่ได้");

        Apply(title, category, description, room, instructorId, branchId, startTime, endTime, capacity);
    }

    public void Cancel()
    {
        if (Status == ClassStatus.CANCELLED)
            throw new InvalidOperationException("คลาสนี้ถูกยกเลิกไปแล้ว");
        Status = ClassStatus.CANCELLED;
    }

    public bool Overlaps(DateTime start, DateTime end) => StartTime < end && start < EndTime;

    private void Apply(string title, string category, string? description, string? room, int instructorId,
        int? branchId, DateTime startTime, DateTime endTime, int capacity)
    {
        if (endTime <= startTime)
            throw new ArgumentException("เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม");
        if (capacity < 1)
            throw new ArgumentException("จำนวนที่นั่งต้องมากกว่าศูนย์");

        Title = title.Trim();
        Category = category.Trim().ToUpperInvariant();
        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        Room = string.IsNullOrWhiteSpace(room) ? null : room.Trim();
        InstructorId = instructorId;
        BranchId = branchId;
        StartTime = startTime;
        EndTime = endTime;
        Capacity = capacity;
    }
}

/// <summary>One member's seat in a class. A cancelled seat stays as history and frees the slot.</summary>
public class ClassBooking
{
    public int Id { get; private set; }

    public int GroupClassId { get; private set; }
    public GroupClass GroupClass { get; private set; } = null!;

    public int MemberId { get; private set; }
    public Member Member { get; private set; } = null!;

    public ClassBookingStatus Status { get; private set; } = ClassBookingStatus.BOOKED;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? CancelledAt { get; private set; }

    private ClassBooking() { }

    public ClassBooking(int groupClassId, int memberId)
    {
        GroupClassId = groupClassId;
        MemberId = memberId;
    }

    public void Cancel()
    {
        if (Status != ClassBookingStatus.BOOKED) return;
        Status = ClassBookingStatus.CANCELLED;
        CancelledAt = DateTime.UtcNow;
    }
}
