namespace ArnavutkoyBelediyesi.Domain.Exceptions;

public sealed class InsufficientTransportBalanceException : DomainException
{
    public InsufficientTransportBalanceException(Guid cardId, decimal balance, decimal fare)
        : base($"Kart '{cardId}' bakiyesi yetersiz. Bakiye: {balance:0.00}, ücret: {fare:0.00}.")
    {
    }
}

public sealed class InvalidTransportCardStateException : DomainException
{
    public InvalidTransportCardStateException(string message) : base(message)
    {
    }
}
