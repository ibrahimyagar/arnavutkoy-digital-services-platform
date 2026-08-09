using ArnavutkoyBelediyesi.Application.Common.Models;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Common.Behaviors;

/// <summary>
/// Her komut/sorgu handler'ı çalışmadan önce ilgili <see cref="IValidator{T}"/>'ları otomatik
/// çalıştıran MediatR pipeline davranışı. Doğrulama başarısız olursa exception fırlatmak yerine
/// (Result Pattern ilkesine uygun olarak) <see cref="Result"/>/<see cref="Result{T}"/> tipinde
/// başarısız bir sonuç üretir; böylece akış kontrolü exception'lar üzerinden yapılmaz.
/// </summary>
public sealed class ValidationBehavior<TRequest, TResponse>(IEnumerable<IValidator<TRequest>> validators)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (!validators.Any())
        {
            return await next().ConfigureAwait(false);
        }

        var context = new ValidationContext<TRequest>(request);

        var validationResults = await Task.WhenAll(
            validators.Select(validator => validator.ValidateAsync(context, cancellationToken))).ConfigureAwait(false);

        var errors = validationResults
            .SelectMany(result => result.Errors)
            .Where(failure => failure is not null)
            .Select(failure => failure.ErrorMessage)
            .Distinct()
            .ToList();

        if (errors.Count == 0)
        {
            return await next().ConfigureAwait(false);
        }

        return BuildFailureResponse(errors);
    }

    private static TResponse BuildFailureResponse(IReadOnlyCollection<string> errors)
    {
        var responseType = typeof(TResponse);

        if (responseType == typeof(Result))
        {
            return (TResponse)(object)Result.Failure(errors);
        }

        if (responseType.IsGenericType && responseType.GetGenericTypeDefinition() == typeof(Result<>))
        {
            var failureMethod = responseType.GetMethod(
                nameof(Result.Failure),
                [typeof(IReadOnlyCollection<string>)]);

            return (TResponse)failureMethod!.Invoke(null, [errors])!;
        }

        throw new ValidationException(string.Join(" | ", errors));
    }
}
