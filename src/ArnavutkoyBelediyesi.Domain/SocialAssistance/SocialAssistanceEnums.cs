namespace ArnavutkoyBelediyesi.Domain.SocialAssistance;

/// <summary>
/// Sosyal yardım başvurusunun değerlendirme durumu.
/// </summary>
public enum SocialAssistanceApplicationStatus
{
    Submitted = 0,
    UnderReview = 1,
    Approved = 2,
    Rejected = 3,
    Withdrawn = 4
}

/// <summary>
/// Yardım türü (sabit set; dinamik form şeması yerine).
/// </summary>
public enum AssistanceType
{
    Food = 0,
    Heating = 1,
    Education = 2,
    Healthcare = 3,
    Other = 4
}
