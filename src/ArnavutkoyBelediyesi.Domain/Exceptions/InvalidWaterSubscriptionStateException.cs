namespace ArnavutkoyBelediyesi.Domain.Exceptions;

/// <summary>
/// Su aboneliği üzerinde geçersiz durum geçişi denendiğinde fırlatılır.
/// </summary>
public sealed class InvalidWaterSubscriptionStateException : DomainException
{
    public InvalidWaterSubscriptionStateException(string message) : base(message)
    {
    }
}
