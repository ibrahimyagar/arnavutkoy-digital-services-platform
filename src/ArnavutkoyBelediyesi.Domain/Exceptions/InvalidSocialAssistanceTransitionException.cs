namespace ArnavutkoyBelediyesi.Domain.Exceptions;

/// <summary>
/// Sosyal yardım başvurusunda geçersiz durum geçişi.
/// </summary>
public sealed class InvalidSocialAssistanceTransitionException : DomainException
{
    public InvalidSocialAssistanceTransitionException(
        SocialAssistance.SocialAssistanceApplicationStatus currentStatus,
        string attemptedAction)
        : base($"'{currentStatus}' durumundaki başvuru için '{attemptedAction}' işlemi yapılamaz.")
    {
    }
}
