using ArnavutkoyBelediyesi.Application;
using ArnavutkoyBelediyesi.Infrastructure;
using ArnavutkoyBelediyesi.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddApplication(builder.Configuration);
builder.Services.AddPersistence(builder.Configuration);
builder.Services.AddInfrastructure();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();

/// <summary>
/// WebApplicationFactory tabanlı entegrasyon testlerinin uygulamayı başlatabilmesi için
/// üst düzey (top-level) Program sınıfını dışa açan kısmi bildirim.
/// </summary>
public partial class Program;

