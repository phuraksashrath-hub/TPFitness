namespace FitnessCenter.Api.Common;

/// <summary>
/// The card and PromptPay flows are a simulation: there is no payment gateway, so every checkout is
/// marked paid immediately. That is fine for a demo and dangerous for a real launch, so simulated
/// checkout is only allowed when explicitly enabled (default: Development only).
/// </summary>
public class PaymentOptions
{
    public bool AllowSimulated { get; set; }
}
