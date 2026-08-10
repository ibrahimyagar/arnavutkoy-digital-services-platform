using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.Auth.Dtos;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.Auth.Queries;

public sealed record GetCurrentUserProfileQuery(Guid UserId) : IRequest<Result<UserProfileDto>>;

public sealed class GetCurrentUserProfileQueryValidator : AbstractValidator<GetCurrentUserProfileQuery>
{
    public GetCurrentUserProfileQueryValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
    }
}

public sealed class GetCurrentUserProfileQueryHandler(IIdentityService identityService)
    : IRequestHandler<GetCurrentUserProfileQuery, Result<UserProfileDto>>
{
    public Task<Result<UserProfileDto>> Handle(GetCurrentUserProfileQuery request, CancellationToken cancellationToken) =>
        identityService.GetUserProfileAsync(request.UserId, cancellationToken);
}
