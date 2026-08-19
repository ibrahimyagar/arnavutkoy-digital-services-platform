namespace ArnavutkoyBelediyesi.Api.Configuration;

/// <summary>
/// Arka planda çalışan seed işleminin durumunu health check'ler için paylaşır.
/// </summary>
public sealed class DatabaseStartupState
{
    private volatile bool _seedCompleted;
    private volatile bool _seedFailed;
    private string? _seedError;

    public bool SeedCompleted => _seedCompleted;

    public bool SeedFailed => _seedFailed;

    public string? SeedError => _seedError;

    public void MarkSeedCompleted() => _seedCompleted = true;

    public void MarkSeedFailed(string message)
    {
        _seedFailed = true;
        _seedError = message;
    }
}
