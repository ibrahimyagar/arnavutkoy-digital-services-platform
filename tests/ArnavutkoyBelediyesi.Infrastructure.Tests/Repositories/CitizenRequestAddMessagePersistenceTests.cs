using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Domain.CitizenRequests;
using ArnavutkoyBelediyesi.Persistence;
using ArnavutkoyBelediyesi.Persistence.Interceptors;
using ArnavutkoyBelediyesi.Persistence.Repositories;
using NSubstitute;

namespace ArnavutkoyBelediyesi.Infrastructure.Tests.Repositories;

/// <summary>
/// Kalıcı hale getirilmiş bir talebe sonradan mesaj ekleme senaryosunun, EF Core'un
/// istemci tarafı Guid anahtarlarıyla ilgili "yeni çocuğu Modified sanma" tuzağına
/// düşmeden doğru çalıştığını doğrular.
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class CitizenRequestAddMessagePersistenceTests(PostgreSqlFixture fixture)
{
    [Fact]
    public async Task AddMessage_AfterMarkUnderReview_InSeparateContexts_ShouldPersistNewMessage()
    {
        var citizenId = Guid.NewGuid();
        var officerId = Guid.NewGuid();
        Guid requestId;

        await using (var seedContext = fixture.CreateContext())
        {
            var category = RequestCategory.Create($"Kategori {Guid.NewGuid()}");
            seedContext.RequestCategories.Add(category);
            await seedContext.SaveChangesAsync();

            var request = CitizenRequest.Create(citizenId, category.Id, "İlk mesaj");
            seedContext.CitizenRequests.Add(request);
            await seedContext.SaveChangesAsync();
            requestId = request.Id;
        }

        await using (var reviewContext = CreateContextWithAuditInterceptor())
        {
            var repository = new Repository<CitizenRequest>(reviewContext);
            var request = await repository.GetByIdAsync(requestId);
            request!.MarkUnderReview();
            repository.Update(request);
            await reviewContext.SaveChangesAsync();
        }

        await using (var messageContext = CreateContextWithAuditInterceptor())
        {
            var repository = new CitizenRequestRepository(messageContext);
            var request = await repository.GetByIdWithMessagesAsync(requestId);

            request.Should().NotBeNull();
            request!.Messages.Should().HaveCount(1);

            request.AddMessage(officerId, SenderType.Officer, "Ekibimiz yönlendirildi.");
            repository.Update(request);
            await messageContext.SaveChangesAsync();
        }

        await using var verifyContext = fixture.CreateContext();
        var verified = await new CitizenRequestRepository(verifyContext).GetByIdWithMessagesAsync(requestId);

        verified!.Status.Should().Be(RequestStatus.UnderReview);
        verified.Messages.Should().HaveCount(2);
        verified.Messages.Select(m => m.Message).Should().Contain("Ekibimiz yönlendirildi.");
    }

    private ApplicationDbContext CreateContextWithAuditInterceptor()
    {
        var currentUser = Substitute.For<ICurrentUserService>();
        currentUser.UserId.Returns(Guid.NewGuid());
        var dateTime = Substitute.For<IDateTimeProvider>();
        dateTime.UtcNow.Returns(DateTime.UtcNow);

        return fixture.CreateContext(new AuditableEntitySaveChangesInterceptor(currentUser, dateTime));
    }
}
