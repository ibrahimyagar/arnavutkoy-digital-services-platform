using ArnavutkoyBelediyesi.Domain.CitizenRequests;

namespace ArnavutkoyBelediyesi.Domain.Exceptions;

/// <summary>
/// Bir vatandaş talebi geçersiz bir durum geçişine zorlandığında fırlatılır
/// (örn. kapatılmış bir talebe mesaj eklenmeye çalışılması).
/// </summary>
public sealed class InvalidRequestStatusTransitionException : DomainException
{
    public InvalidRequestStatusTransitionException(RequestStatus currentStatus, string attemptedAction)
        : base($"Talep '{currentStatus}' durumundayken '{attemptedAction}' işlemi yapılamaz.")
    {
        CurrentStatus = currentStatus;
    }

    /// <summary>
    /// İşlem denendiği andaki talep durumu.
    /// </summary>
    public RequestStatus CurrentStatus { get; }
}
