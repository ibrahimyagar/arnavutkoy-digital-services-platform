using ArnavutkoyBelediyesi.Domain.SocialAssistance;

namespace ArnavutkoyBelediyesi.Api.Controllers.V1.Requests;

public sealed record SubmitSocialAssistanceRequest(
    AssistanceType Type,
    int HouseholdSize,
    decimal MonthlyIncome,
    string HouseholdSummary,
    string? ExtraFieldsJson);

public sealed record DecideSocialAssistanceRequest(bool Approve, string? Note);
