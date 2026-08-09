using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Features.CitizenRequests.Commands;
using ArnavutkoyBelediyesi.Domain.CitizenRequests;
using FluentValidation.TestHelper;

namespace ArnavutkoyBelediyesi.Application.Tests.Features.CitizenRequests.Commands;

public sealed class CreateCitizenRequestCommandValidatorTests
{
    private readonly CreateCitizenRequestCommandValidator _validator = new();

    [Fact]
    public void Validate_WithValidCommand_ShouldNotHaveErrors()
    {
        var command = new CreateCitizenRequestCommand(Guid.NewGuid(), Guid.NewGuid(), "Yol arızası var.");

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Validate_WithEmptyCitizenUserId_ShouldHaveError()
    {
        var command = new CreateCitizenRequestCommand(Guid.Empty, Guid.NewGuid(), "Yol arızası var.");

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.CitizenUserId);
    }

    [Fact]
    public void Validate_WithMessageExceedingMaxLength_ShouldHaveError()
    {
        var command = new CreateCitizenRequestCommand(Guid.NewGuid(), Guid.NewGuid(), new string('a', 2001));

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.InitialMessage);
    }
}

public sealed class CreateCitizenRequestCommandHandlerTests
{
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly IRepository<RequestCategory> _categoryRepository = Substitute.For<IRepository<RequestCategory>>();
    private readonly IRepository<CitizenRequest> _requestRepository = Substitute.For<IRepository<CitizenRequest>>();

    private CreateCitizenRequestCommandHandler CreateHandler()
    {
        _unitOfWork.Repository<RequestCategory>().Returns(_categoryRepository);
        _unitOfWork.Repository<CitizenRequest>().Returns(_requestRepository);
        return new CreateCitizenRequestCommandHandler(_unitOfWork);
    }

    [Fact]
    public async Task Handle_WhenCategoryNotFound_ShouldReturnFailure()
    {
        var categoryId = Guid.NewGuid();
        _categoryRepository.GetByIdAsync(categoryId, Arg.Any<CancellationToken>()).Returns((RequestCategory?)null);
        var handler = CreateHandler();

        var result = await handler.Handle(
            new CreateCitizenRequestCommand(Guid.NewGuid(), categoryId, "Mesaj"),
            CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WhenCategoryIsInactive_ShouldReturnFailure()
    {
        var category = RequestCategory.Create("Temizlik");
        category.Deactivate();
        _categoryRepository.GetByIdAsync(category.Id, Arg.Any<CancellationToken>()).Returns(category);
        var handler = CreateHandler();

        var result = await handler.Handle(
            new CreateCitizenRequestCommand(Guid.NewGuid(), category.Id, "Mesaj"),
            CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WithActiveCategory_ShouldCreateRequestAndReturnItsId()
    {
        var category = RequestCategory.Create("Temizlik");
        _categoryRepository.GetByIdAsync(category.Id, Arg.Any<CancellationToken>()).Returns(category);
        var handler = CreateHandler();

        var result = await handler.Handle(
            new CreateCitizenRequestCommand(Guid.NewGuid(), category.Id, "Mesaj"),
            CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBe(Guid.Empty);
        await _requestRepository.Received(1).AddAsync(Arg.Any<CitizenRequest>(), Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
