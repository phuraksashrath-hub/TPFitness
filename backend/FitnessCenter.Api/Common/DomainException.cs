namespace FitnessCenter.Api.Common;

/// <summary>Thrown when a business rule is violated. Surfaced as HTTP 400/409 by the middleware.</summary>
public class DomainException : Exception
{
    public int StatusCode { get; }

    public DomainException(string message, int statusCode = StatusCodes.Status400BadRequest) : base(message)
        => StatusCode = statusCode;

    public static DomainException NotFound(string what) =>
        new($"ไม่พบ{what}ที่ร้องขอ", StatusCodes.Status404NotFound);

    public static DomainException Conflict(string message) =>
        new(message, StatusCodes.Status409Conflict);

    public static DomainException Forbidden(string message) =>
        new(message, StatusCodes.Status403Forbidden);
}
