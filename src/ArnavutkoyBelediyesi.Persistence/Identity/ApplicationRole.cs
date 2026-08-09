using Microsoft.AspNetCore.Identity;

namespace ArnavutkoyBelediyesi.Persistence.Identity;

/// <summary>
/// ASP.NET Core Identity rol kaydı. Şimdilik ek alan gerektirmediğinden varsayılan davranışı kullanır.
/// </summary>
public sealed class ApplicationRole : IdentityRole<Guid>
{
    public ApplicationRole()
    {
    }

    public ApplicationRole(string roleName) : base(roleName)
    {
    }
}
