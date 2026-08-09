using ArnavutkoyBelediyesi.Domain.CitizenRequests.Events;
using ArnavutkoyBelediyesi.Domain.Common;
using ArnavutkoyBelediyesi.Domain.Exceptions;

namespace ArnavutkoyBelediyesi.Domain.CitizenRequests;

/// <summary>
/// Bir vatandaşın belediyeye ilettiği talebi ve ona bağlı mesajlaşma geçmişini temsil eden
/// aggregate root. Durum geçişleri (<see cref="RequestStatus"/>) yalnızca bu sınıfın metotları
/// aracılığıyla, iş kurallarına uygun şekilde gerçekleştirilebilir.
/// </summary>
public sealed class CitizenRequest : AuditableEntity
{
    private readonly List<RequestMessage> _messages = [];

    private CitizenRequest()
    {
    }

    private CitizenRequest(Guid citizenUserId, Guid categoryId, string initialMessage) : this()
    {
        CitizenUserId = citizenUserId;
        CategoryId = categoryId;
        Status = RequestStatus.Pending;
        _messages.Add(new RequestMessage(Id, citizenUserId, SenderType.Citizen, initialMessage));

        RaiseDomainEvent(new CitizenRequestCreatedDomainEvent(Id, citizenUserId));
    }

    /// <summary>
    /// Talebi oluşturan vatandaşın kullanıcı kimliği.
    /// </summary>
    public Guid CitizenUserId { get; private set; }

    /// <summary>
    /// Talebin kategorisi.
    /// </summary>
    public Guid CategoryId { get; private set; }

    /// <summary>
    /// Talebin güncel durumu.
    /// </summary>
    public RequestStatus Status { get; private set; }

    /// <summary>
    /// Talebin çözüme kavuştuğu UTC zaman (henüz çözülmediyse null).
    /// </summary>
    public DateTime? ResolvedAtUtc { get; private set; }

    /// <summary>
    /// Talebe ait mesajların, en eskiden en yeniye sıralı salt okunur listesi.
    /// </summary>
    public IReadOnlyCollection<RequestMessage> Messages => _messages.AsReadOnly();

    /// <summary>
    /// Yeni bir vatandaş talebi oluşturur; ilk mesaj talebin açıklamasını içerir.
    /// </summary>
    /// <param name="citizenUserId">Talebi oluşturan vatandaşın kimliği.</param>
    /// <param name="categoryId">Talebin ait olduğu kategori kimliği.</param>
    /// <param name="initialMessage">Talebin açıklama mesajı, boş olamaz.</param>
    public static CitizenRequest Create(Guid citizenUserId, Guid categoryId, string initialMessage)
    {
        if (string.IsNullOrWhiteSpace(initialMessage))
        {
            throw new ArgumentException("Talep mesajı boş olamaz.", nameof(initialMessage));
        }

        return new CitizenRequest(citizenUserId, categoryId, initialMessage.Trim());
    }

    /// <summary>
    /// Talebe yeni bir mesaj ekler. Kapatılmış bir talebe mesaj eklenemez.
    /// </summary>
    /// <param name="senderUserId">Mesajı gönderen kullanıcının kimliği.</param>
    /// <param name="senderType">Gönderenin tarafı.</param>
    /// <param name="message">Mesaj içeriği, boş olamaz.</param>
    public void AddMessage(Guid senderUserId, SenderType senderType, string message)
    {
        if (Status == RequestStatus.Closed)
        {
            throw new InvalidRequestStatusTransitionException(Status, "mesaj ekleme");
        }

        if (string.IsNullOrWhiteSpace(message))
        {
            throw new ArgumentException("Mesaj içeriği boş olamaz.", nameof(message));
        }

        _messages.Add(new RequestMessage(Id, senderUserId, senderType, message.Trim()));
    }

    /// <summary>
    /// Talebi inceleme sürecine alır. Yalnızca <see cref="RequestStatus.Pending"/> durumundan yapılabilir.
    /// </summary>
    public void MarkUnderReview()
    {
        if (Status != RequestStatus.Pending)
        {
            throw new InvalidRequestStatusTransitionException(Status, "incelemeye alma");
        }

        Status = RequestStatus.UnderReview;
    }

    /// <summary>
    /// Talebi çözüme kavuşturur. Kapatılmış bir talep tekrar çözülemez.
    /// </summary>
    public void Resolve(DateTime resolvedAtUtc)
    {
        if (Status is RequestStatus.Resolved or RequestStatus.Closed)
        {
            throw new InvalidRequestStatusTransitionException(Status, "çözüme kavuşturma");
        }

        Status = RequestStatus.Resolved;
        ResolvedAtUtc = resolvedAtUtc;
    }

    /// <summary>
    /// Talebi kapatır; kapatıldıktan sonra herhangi bir durum değişikliği veya mesaj eklenemez.
    /// </summary>
    public void Close()
    {
        if (Status == RequestStatus.Closed)
        {
            throw new InvalidRequestStatusTransitionException(Status, "kapatma");
        }

        Status = RequestStatus.Closed;
    }
}
