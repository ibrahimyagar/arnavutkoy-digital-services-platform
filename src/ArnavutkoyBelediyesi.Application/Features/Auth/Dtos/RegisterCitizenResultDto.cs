namespace ArnavutkoyBelediyesi.Application.Features.Auth.Dtos;

/// <summary>
/// Vatandaş kaydı sonucu. <see cref="Id"/> geriye dönük uyumluluk için korunur;
/// <see cref="Message"/> e-posta doğrulama bilgisini taşır.
/// </summary>
public sealed record RegisterCitizenResultDto(Guid Id, string Message);
