namespace ArnavutkoyBelediyesi.Application.Features.Auth;

/// <summary>
/// E-posta doğrulama akışında kullanılan sabit hata kodları / mesajları.
/// </summary>
public static class EmailVerificationMessages
{
    public const string NotConfirmedCode = "EMAIL_NOT_CONFIRMED";

    public const string NotConfirmedDetail =
        "EMAIL_NOT_CONFIRMED: E-posta adresiniz henüz doğrulanmamış. Lütfen gelen kutunuzdaki kodu girin.";

    public const string RegisterSuccess =
        "Kayıt başarılı. Lütfen e-posta adresinize gönderilen 6 haneli doğrulama kodunu girin.";

    public const string GenericCodeSent =
        "Doğrulama kodu gönderildiyse e-posta gelen kutunuzu kontrol edin.";

    public const string InvalidOrExpiredCode =
        "Doğrulama kodu geçersiz veya süresi dolmuş. Yeni kod isteyebilirsiniz.";

    public const string ResendTooSoon =
        "Yeni kod istemeden önce lütfen bir süre bekleyin.";

    public const string AlreadyConfirmed =
        "Bu e-posta adresi zaten doğrulanmış.";
}
