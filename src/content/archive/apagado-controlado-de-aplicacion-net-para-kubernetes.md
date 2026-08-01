---
title: 'Encendido y apagado controlado de aplicación ASP .NET en Kubernetes'
description: 'Al desplegar tu aplicación ASP .NET en Kubernetes, necesitas controlar el encendido y apagado de cada pod para no que no se pierda ninguna petición.'
pubDate: 'Mar 13 2022'
---
### Encendido y apagado controlado de los pods en Kubernetes

Si necesitas desplegar una aplicación [**ASP .NET**](https://docs.microsoft.com/es-es/aspnet/overview) (o [**ASP .NET Core**](https://docs.microsoft.com/es-es/aspnet/core/?view=aspnetcore-6.0)) en [**Kubernetes**](https://kubernetes.io/es/docs/concepts/overview/what-is-kubernetes/), ya sea por migración de una existente o por el desarrollo de una nueva aplicación, necesitas controlar tanto el encendido como el apagado de los pods de tu aplicación. En este post te explico cómo hacerlo de forma muy sencilla, a través de un endpoint y un script de [**Powershell**](https://docs.microsoft.com/es-es/powershell/) muy simples. Este último punto es importante, ya que si tu aplicación es .NET Core, puede que el contenedor que utilices sea Linux, y por tanto no puedas hacer uno del script de Powershell para gestionar el apagado. Este post lo he creado a raíz de la necesidad de migrar a Kubernetes una aplicación ASP .NET estándar, que utiliza una imagen/contenedor Windows, y de ahí que haya escogido esa solución por su simplicidad (como verás más adelante).

### La importancia de la gestión de los pods en Kubernetes

Puede que ya sepas qué es un [**pod**](https://kubernetes.io/es/docs/concepts/workloads/pods/) de Kubernetes, pero, por si acaso, vamos a verlo muy brevemente. Como sabes, una de las ventajas de Kubernetes es su gran rapidez a la hora de ofrecer unos recursos adecuados a la demanda de un momento concreto. Uno de los elementos clave para conseguir esa escalabilidad inmediata es la creación y destrucción de pods. Puedes informarte mejor sobre qué son estos elementos pero, para que nos entendamos, **un pod es algo así como un pseudoservidor de los antiguos (físico o digital), que sirve peticiones que se realizan sobre tu aplicación .NET**. Entonces, y esto es lo que realmente nos interesa, cuando más pods, más recursos de servidor para tu aplicación web. El aspecto interesante es que, esta escalabilidad tan rápida, supone un reto, pues **a lo largo de la vida de la aplicación los pods van "naciendo" y "muriendo"**. Esto puede parecer algo inocuo, pero no es así. ¿Era inocuo antes cuando encendíamos o apagábamos uno de nuestros [**servidores IIS**](https://www.iis.net/)? No, ¿verdad? Pues aquí ocurre algo parecido ?. Afortunadamente, Kubernetes nos poporciona recursos muy útiles para gestionar estas dos problemáticas que, aunque relacionadas, se solucionan de forma diferente.

### Gestión del encendido de un pod

**Esta parte de la solución**, como he comentado anteriormente, **es válida para contenedores Linux o Windows**. Vamos allá 😉. Como también he puesto un poco más arriba, Kubernetes mola mucho y nos pone muy fácil gestionar este aspecto. Lo que tenemos que hacer es proveer a Kubernetes de un recurso para que pueda comprobar si un pod está listo para recibir peticiones o no. Y para ello **tenemos un parámetro de configuración donde indicamos un endpoint (o script) que indique a Kubernetes si el pod está preparado o no para servir requests**. Estos parámetros se llaman [**livenessProbe y readinessProbe**](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/). El hecho de que sean dos, y no uno, tiene su sentido, y es que gestionan aspectos diferentes, pero para este caso sencillo vamos a suponer que nos vale la misma comprobación para ambos. En un escenario simple (y el más común) lo que necesitamos es que la aplicación ASP .NET esté desplegada, y ésta tenga acceso a la base de datos de la aplicación. Si a Kubernetes le proporcionamos un endpoint que devuelva código 200 (OK) cuando estos dos elementos estén listos y un código de error (503, por ejemplo) mientras estos elementos no estén disponibles, tenemos ya este trabajo hecho. Notese que si la aplicación web todavía no está disponible, Kubernetes recibirá un error como respuesta ya que no podrá ni siquiera llegar a contactar con el endpoint de testeo, normalmente llamado *healthcheck*. Sería tan sencillo como crear un endpoint como el siguiente dentro de nuestra aplicación web:

```
 public class HealthCheckController : ApiController
    {
        [HttpGet]
        public async Task<IHttpActionResult> Index()
        {
            bool isDatabaseOK = ... // código que comprueba que el acceso a la BBDD
            if (isDatabaseOK)
            {
                return Ok();
            }
            else
            {
                return StatusCode(System.Net.HttpStatusCode.ServiceUnavailable);
            }
        }
    }
```

Y ya sólo nos quedaría configurar los parámetros livenessProbe y readinessProbe de forma adecuada para que hagan uso de ese endpoint con los tiempos que estipulemos convenientes.

### Gestión del apagado de un pod

Como he comentado anteriormente, **esta parte de la solución es válida únicamente si tu imagen corre sobre un contenedor Windows**, ya que consiste en utilizar un script de Powershell. Antes de nada, es preciso decirte que, si Kubernetes tiene una solución para el encedido controlado de los pods, también lo tiene para el apagado, lo que facilita mucho la gestión de esta problemática. En nuestro caso, **nos interesa que nuestros pods "mueran" sólo cuando hayan respondido todas las peticiones pendientes y no vayan a recibir más**. De lo segundo se encarga Kubernetes de forma prácticamente automática, enviando [**una señal TERM**](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/) al pod en cuestión, lo cual inicia el apagado del pod de forma similar a lo que sería el apagado de un servidor físico/virtual de Windows. [**Los pods tienen configurado un periodo de gracia**](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination) para poder morir sin ser forzados. Este periodo es de 30 segundos por defecto. Mi recomendación es que, si lo ves necesario, aumentes ese periodo de gracia porque realmente lo que queremos es que el pod sea destruido cuando lo diga nuestro script personalizado, que se asegurará de que todas las peticiones han sido servidas. **Una vez termine el script, comenzará la destrucción del pod**. El script a utilizar sería éste y lo conseguí a través de [**este artículo de @lawrencegripper.**](https://blog.gripdev.xyz/2015/01/08/gracefully-drain-session-from-iis-before-restartingstopping/)

```
#Get the open requests being handled by IIS
$req = Get-WebRequest
while ($req.Count -gt 0)
{
    #Wait if there are some
    Write-Host "Waiting for request, current inflight: " $req.Count
    Start-Sleep –Seconds 2
    #Check again for sessions
    $req = Get-WebRequest
}
Write-Host "No Sessions on Box, lets update!"
```

Creo que se entiende bastante bien, pero lo que hace básicamente es comprobar si quedan peticiones pendientes en IIS en intervalos de 2 segundos y finalizar cuando no haya ninguna. Afortunadamente, **la configuración de Kubernetes nos ofrece otro parámetro donde podemos indicar un script a ejecutar antes de dar el OK a la destrucción del pod**. En este caso de trata d[**el hook preStop**](https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/). En nuestro caso, este hook ejecutará nuestro script y de esa forma nos aseguraremos de que todas las peticiones que llegen a nuestra aplicación obtengan respuesta, ya que el pod no morirá hasta que el script no termine (o el periodo de gracia). **Nota**: Si es posible que tu pod tenga periodos ociosos, quizás te convenga incluir unos segundos de espera al inicio del script para asegurar que no llegue alguna petición de última hora que Kubernetes asigne a ese pod y se pierda porque llegue justo después de ejecutarse el script.

### Bonus track: Servidor con más de un proyecto web

Esto no es una buena práctica, lo sé. Cualquier expert@ (y no tan expert@) en Kubernetes te dirá que, si tienes más de un proyecto web, cada uno debe ir en su contenedor correspondiente. Y estoy muy de acuerdo en que es sin duda la mejor práctica. Pero, a veces, en lugar de la mejor práctica, tienes que tirar por lo más práctico ?, y a nosotr@s nos tocó tener que desplegar dos proyectos web en el mismo contenedor. En realidad era el mismo y sólo se iba a mantener así de forma temporal, pero vaya, que si lo tuvimos que hacer nosotr@s probablemente les toque a otr@s también. Para este caso implementé un script de Powershell que llamara a los healthchecks de ambos proyectos. Sencillo, ¿verdad? Éste es el script:

```
$isReady = $false
$req = Invoke-WebRequest -Uri "url_endpoint_1/api/HealthCheck"
if ($req.StatusCode -eq 200)
{
	$req = Invoke-WebRequest -Uri "url_endpoint_1/api/HealthCheck"
	if ($req.StatusCode -eq 200)
	{
		$isReady = $true
	}
}
if (-not $isReady)
{
	throw "Error health"
}
```

Los parámetros livenessProbe y readinessProbe pueden llamar a un endpoint como el que habíamos creado anteriormente, o ejecutar un script como el de arriba. Si es el script se ejecuta sin problemas, Kubernetes entiende que el pod está listo para recibir peticiones. Si devuelve un error, no lo considera preparado y evita asignarle peticiones. De nuevo, ten en cuenta que este script es de Powershell y sólo puede ejecutarse en un contenedor Windows.
