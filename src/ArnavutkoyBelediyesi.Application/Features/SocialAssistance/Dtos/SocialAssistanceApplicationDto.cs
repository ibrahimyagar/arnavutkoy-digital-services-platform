using ArnavutkoyBelediyesi.Domain.SocialAssistance;

namespace ArnavutkoyBelediyesi.Application.Features.SocialAssistance.Dtos;

public sealed record SocialAssistanceApplicationDto(
    Guid Id,
    Guid ApplicantUserId,
    AssistanceType Type,
    int HouseholdSize,
    decimal MonthlyIncome,
    string HouseholdSummary,
    string ExtraFieldsJson,
    SocialAssistanceApplicationStatus Status,
    DateTime SubmittedAtUtc,
    DateTime? ReviewedAtUtc,
    Guid? ReviewedByUserId,
    string ReviewNote);
