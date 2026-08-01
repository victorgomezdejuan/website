---
title: 'Cómo configurar una aplicación ASP.NET Core para autenticarse contra diferentes realms de Keycloak'
description: 'Si necesitas autenticar tu aplicación ASP.NET Core contra diferentes realms de tu servidor Keycloak porque es así cómo has configurado el multitenancy, aquí te explico cómo hacerlo.'
pubDate: 'Feb 1 2025'
---
### Problema: Tu organización decide utilizar un realm diferente de Keycloak para cada cliente

Esto es justo lo que ocurrió en nuestro equipo y, por lo que me encontré por Internet, no sólo nos sucedió a nosotros. Así que, si todavía estáis a tiempo, aquí va **mi primera recomendación: no hagais esto**. [Keycloak ya ofrece soporte para configuraciones multitenancy sobre un mismo realm](https://www.keycloak.org/2024/06/announcement-keycloak-organizations), pero es que además, esta aplicación no está pensada para esto, y esa es la razón fundamental de que no haya habilitado esta configuración hasta hace poco.

Keycloak funciona más bien en el sentido contrario: te permite agregar diferentes proveedores de identidad sobre un mismo realm de manera que usuarios por ejemplo de Google, Facebook y Microsoft pueden autenticarse en tu sitio web con sus crendenciales de estas plataformas. Es decir, Keycloak está pensado para agregar diferentes proveedores de identidad, no para crear un realm por cliente, ya que en este segundo caso su configuración y puesta en marcha se complica de manera importante. Si necesitas implementar una solución multitenancy, tienes mejores herramientas ([Microsoft Entra ID](https://www.microsoft.com/es-es/security/business/identity-access/microsoft-entra-id), por ejemplo).

Dicho esto, **si**, como nos ocurrió a nosotros, **te encuentras en la situación de no poder elegir esto y necesitas que tu aplicación ASP.NET Core sea capaz de autenticarse contra diferentes realms en función del bearer token que le llega en la petición, te invito a seguir leyendo.**

### Escoger el realm contra el que autenticarse de forma dinámica

ASP.NET Core te permite añadir diferentes formas de autenticarte contra diferentes proveedores de identidad. En este sentido, nosotros podemos añadir todos los posibles realms de Keycloak contra los que se puede autenticar nuestra aplicación directamente en nuestra configuración (appsettings.json y Program.cs).

El problema de esto es que entonces nuestra aplicación va a carecer de la flexibilidad necesaria para agregar un nuevo cliente en Keycloak sin necesidad de hacer cambios como mínimo en la configuración de nuestra aplicación para que acepte el nuevo realm/cliente.

Para poder solventar esto, **necesitamos utilizar algún dato de la petición HTTP para poder identificar el realm contra el que validar el token**. Es nuestro caso, utilizamos un dato del propio token al que pasamos un expresión regular para asegurarnos de que nadie pueda aprovechar esto con intenciones maliciosas.

### Implementando la solución

Después de la chapa para meternos en contexto, ahora sí, vamos a lo que realmente importa. ¿Cómo implementamos esta solución? Para ello, como veremos, **necesitamos crear varias clases que actúan de middleware sobre nuestra pipeline de autenticación para las peticiones HTTP que llegan a nuestra aplicación.**

##### ClientDataMiddleware.cs

```
public class ClientDataMiddleware
{
    private readonly RequestDelegate next;
    public ClientDataMiddleware(RequestDelegate next) => this.next = next;
    public async Task InvokeAsync(HttpContext httpContext)
    {
        var authenticationScheme = httpContext.User.Identities.FirstOrDefault(i => i.IsAuthenticated)?.AuthenticationType;
        if (authenticationScheme is not "AuthenticationTypes.Federation")
        {
            await next(httpContext);
            return;
        }
        var authorizationHeaderValue = httpContext.Request.Headers.Authorization[0]!;
        var clientData1 = httpContext.User.Claims.FirstOrDefault(c => c.Type == "client_data_1")?.Value;
        var clientData2 = httpContext.User.Claims.FirstOrDefault(c => c.Type == "client_data_2")?.Value;
        if (clientData1 is null || clientData2 is null)
        {
            throw new InvalidOperationException("Invalid access token.");
        }
        await next(httpContext);
    }
}
```

Esta clase no forma parte de la autenticación como tal, si no que en nuestro caso simplemente certifica que el bearer token que nos ha llegado contiene ciertos claims que son necesarios en nuestro caso para poder identificar el cliente que hace la petición. En vuestro caso esto puede ser relevante o no pero, en caso de que lo sea, aquí os aporto una forma de conseguirlo.

Para registrar este middleware simplemente necesitas añadir una instrucción en tu Program.cs. Nosotros creamos un extension method para ello. Se trataría, por tanto, de llamar a este extension method desde tu Program.cs.

##### ServicesExtensions.cs

```
public static void UseClientDataMiddleware(this IApplicationBuilder app)
{
    app.UseMiddleware<ClientDataMiddleware>();
}
```

Lo segundo que vamos a hacer (o lo primero, si lo anterior no aplicaba en tu caso), es crear una abstracción para conseguir el dato del realm contra el cual tenemos que validar el bearer token que nos llega en la petición HTTP. Algo así:

##### IRealmProvider.cs

```
internal interface IRealmProvider
{
    string GetCurrentRealm();
}
```

Y, por supuesto, también creamos su implementación:

##### RealmProvider.cs

```
internal class RealmProvider : IRealmProvider
{
    private const string DefaultRealm = "";
    private readonly IHttpContextAccessor httpContextAccessor;
    public RealmProvider(IHttpContextAccessor httpContextAccessor) => this.httpContextAccessor = httpContextAccessor;
    public string GetCurrentRealm()
    {
        var authorizationHeader = httpContextAccessor.HttpContext!.Request.Headers.Authorization;
        if (authorizationHeader.Count == 0 || authorizationHeader[0]!.StartsWith("Bearer") is false)
        {
            return DefaultRealm;
        }
        var bearerToken = authorizationHeader[0]!["Bearer ".Length..];
        if (string.IsNullOrWhiteSpace(bearerToken))
        {
            return DefaultRealm;
        }
        string? realm;
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var jwtSecurityToken = handler.ReadJwtToken(bearerToken);
            realm = jwtSecurityToken.Claims.FirstOrDefault(c => c.Type == "realm")?.Value;
        }
        catch
        {
            return DefaultRealm;
        }
        if (realm is null || RegularExpressions.RealmName().IsMatch(realm) is false)
        {
            return DefaultRealm;
        }
        return realm;
    }
}
```

Aquí parece que hay mucha historia pero en realidad lo que hace es bien simple. Si todo está ok, obtiene el realm del claim "realm" del bearer token que llega en la petición. Vosotros puede que queráis utilizar otro claim. Es cuestión de cambiar este literal y listo. Otra opción sería utilizar otro dato de la petición HTTP.

Un punto importante es la instrucción *RegularExpressions.RealmName().IsMatch(realm) is false.* Aquí nos cercioramos de que no llega nada raro en ese claim. Básicamente, comprobamos que se trata de un nombre sin cosas raras.

Esta interfaz y clase, por supuesto, necesitamos registrarlas en nuestro contenedor de dependencias.

##### Program.cs

```
services.AddSingleton<IRealmProvider, RealmProvider>();
```

##### RegularExpressions.cs

```
internal partial class RegularExpressions
{
    [GeneratedRegex("^[a-zA-Z][a-zA-Z0-9_]{0,49}$")]
    internal static partial Regex RealmName();
}
```

Y ahora vamos con las dos clases importantes. Son las clases que nos permiten personalizar lo justo y necesario la librería de autenticación de .NET para hacer uso del realm que nos ha llegado en el bearer token.

##### JwtBearerOptionsProvider.cs

```
internal class JwtBearerOptionsProvider : IOptionsMonitor<JwtBearerOptions>
{
    private readonly IOptionsFactory<JwtBearerOptions> optionsFactory;
    private readonly IRealmProvider tenantProvider;
    private readonly ConcurrentDictionary<(string Name, string Tenant), Lazy<JwtBearerOptions>> cache;
    public JwtBearerOptionsProvider(IOptionsFactory<JwtBearerOptions> optionsFactory, IRealmProvider tenantProvider)
    {
        this.optionsFactory = optionsFactory;
        this.tenantProvider = tenantProvider;
        cache = new ConcurrentDictionary<(string, string), Lazy<JwtBearerOptions>>();
    }
    public JwtBearerOptions CurrentValue => Get(Options.DefaultName);
    public JwtBearerOptions Get(string? name)
    {
        var realm = tenantProvider.GetCurrentRealm();
        return cache.GetOrAdd((name!, realm), _ => Create()).Value;
        Lazy<JwtBearerOptions> Create() => new (() => optionsFactory.Create(name!));
    }
    public IDisposable OnChange(Action<JwtBearerOptions, string> listener) => null!;
}
```

No me voy a extender mucho en la explicación de lo que hace esta clase porque no es nada sencillo. Como su propio nombre indica, se encarga de proporcionar el objeto JwtBearerOptions para la petición actual. No hace nada especial a parte de crear un nuevo objeto con un objeto de tipo *IOptionsFactory<JwtBearerOptions>* y cachearlo para mejorar un poco el rendimiento.

##### JwtBearerOptionsInitializer.cs

```
internal class JwtBearerOptionsInitializer : IConfigureNamedOptions<JwtBearerOptions>
{
    private readonly IRealmProvider tenantProvider;
    public JwtBearerOptionsInitializer(IRealmProvider tenantProvider)
    {
        this.tenantProvider = tenantProvider;
    }
    public void Configure(string? name, JwtBearerOptions options)
    {
        if (string.Equals(name, JwtBearerDefaults.AuthenticationScheme, StringComparison.Ordinal) is false)
        {
            return;
        }
        var realm = tenantProvider.GetCurrentRealm();
        options.Authority = $"{options.Authority}/{realm}";
    }
    public void Configure(JwtBearerOptions options) => Debug.Fail("This infrastructure method shouldn't be called.");
}
```

Esta última clase es seguramente la más importante de todas. Es aquí donde modificamos el objeto JwtBearerOptions para indicarle exactamente la url (servidor de Keycloak + nombre del realm) contra la que tiene que validar el bearer token que llega en la petición HTTP. Como veis, el servidor de Keycloak al que tiene que enviar la petición es el que hemos indicado en la configuración de nuestra aplicación, y a este valor se le añade el realm que nos ha llegado en el token y que previamente hemos verificado que no tiene nada raro.

##### appsettings.json

```
  "Authentication": {
    "KeyCloak": {
      "Authority": "https://keycloak-server/realms",
      "Audience": "our_audience"
    }
  },
```

¡Y finito! Con esto ya tenemos todo lo necesario para que nuestra aplicación se autentique contra diferentes realms de nuestro servidor de Keycloak de manera dinámica 🙂.
