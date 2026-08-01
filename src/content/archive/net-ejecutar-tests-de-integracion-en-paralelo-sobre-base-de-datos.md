---
title: '.NET: Ejecutar tests de integración en paralelo sobre base de datos'
description: 'En este artículo te explico cómo puedes conseguir que tus tests de integración se ejecuten en paralelo en .NET, aunque utilices una fixture para acceder a una o varias bases de datos.'
pubDate: 'Aug 28 2022'
---
### Los tests, a ser posible, siempre en paralelo

No cuento nada nuevo. Los tests, salvo fuerza mayor (que no he visto todavía), deben (poder) ejecutarse en paralelo. Cada test debe ser autosuficiente e independiente, y de ninguna forma debe interferir con el resto de tests. Esto no quiere decir que un test no pueda tener diferentes pasos, que pueda ser un proceso o algoritmo en sí mismo. De hecho, el realizar diferentes pasos se hace especialmente necesario en ciertos niveles más altos de testing (integración, end-to-end, etc.). Pero cada test, que en última instancia será un método (aunque pueda éste llamar a otros métodos), no debe cambiar, de manera potencial ni real, el resultado de otros tests.

Esto nos aporta **dos beneficios claros**:

-   **Cuando desarrollas un nuevo test, no tienes que preocuparte del resto.** No tienes que mirar paso a paso lo que hacen el resto de tests ya implementados con el miedo de que pueda que intefieran en el test que vas a desarrollar.
-   **Puedes ejecutarlos en paralelo** sin reparo. Esto agiliza el proceso de programación, integración y entrega de software. Debido a la popularización de [**los servicos de CI/CD**](https://es.wikipedia.org/wiki/CI/CD), y las famosas [**pipelines**](https://www.itdo.com/blog/implementas-algun-pipeline-ci-cd-en-tu-organizacion/), esto último ha adquirido especial importancia.

### Escenario inicial y reto

Hace un tiempo, heredé un proyecto de .NET en que había un proyecto de testing con varios tests unitarios y de integración. Los de integración hacían uso de una base de datos que se desplegaba bajo un contenedor Docker.

Si querías ejecutar los tests en local, tenías que desplegar primero el contenedor Docker que contenía un servidor SQL Server con varias bases de datos que a su vez contenían ciertos datos básicos.

De la misma forma, en la pipeline de CI/CD de este proyecto, para los casos que aplicaba (*merge* sobre la rama de *develop*, por ejemplo), se levantaba esta misma base de datos de forma automática y se ejecutaban estos tests.

Como he comentado, al principio había pocos tests debido a que se estaba empezando a ampliar la cobertura de tests sobre el proyecto de software principal. Hasta ese momento, esos tests se ejecutaban de forma secuencial. No por un requirimiento técnico o funcional, sino porque, de la forma en la que estaban configurados, se ejecutaban así. Porque nadie lo había mirado hasta ese momento, vaya.

Llegado cierto momento, los desarrolladores empezamos a que los tests empezaban a ser un "estorbo" por el tiempo que tardaban en ejecutarse tanto en local como, sobre todo, en la pipeline. Esto ralentizaba cada vez más los procesos de CI/CD, por lo que decidimos hacer algo al respecto.

El proyecto de tests (y ya no digamos el resto de proyectos de la aplicación) tenía margen de mejora en varios ámbitos, pero acordamos que lo primero a realizar era conseguir que los tests se ejecutaran en paralelo, lo que supondría una mejora considerable sobre el tiempo de ejecución de los mismos, y un paso importante para la escalabilidad de los procesos de CI/CD.

### Paralelización de los tests

Es importante comentar que **utilizábamos [xUnit](https://xunit.net/) como tecnología de testing**. Y la idea era continuar con la misma. Así, lo primero era intentar entender cómo maneja xUnit la paralelización. Para ello, nada como [**esta página de la documentación oficial**](https://xunit.net/docs/running-tests-in-parallel) (que me leí como 15 veces, no lo voy a negar 😄).

La primera sorpresa fue que... ¡En xUnit (desde la versión 2) la paralelización de tests está activada por defecto! Entonces... ¿Por qué nuestros tests no se estaban ejecutando el paralelo? Pues, porque al parecer, no es tan sencillo...

Para decidir qué tests se puede ejecutar en paralelo o no, xUnit introduce el concepto de Colecciones de Tests o *test collections*. Os resumo:

-   **Por defecto, xUnit considera cada clase como una test collection**. Es decir, **los tests de una misma clase se ejecutan secuencialmente**, pero los tests de diferentes clases pueden ejecutarse en paralelo. Esto es, los tests de cada clase pueden hacer uso de un core diferente, y por tanto aprovecharnos de la paralelización. Pero, nosotros teníamos obviamente varias clases diferentes... ¿Por qué no se ejecutaban los tests en paralelo? Veamos el siguiente punto.
-   El framework xUnit nos ofrece una opción para indicar que tests de diferentes clases NO deben ejecutarse en paralelo. O sea, nos ofrece una opción para restringir más si cabe la paralelización. ¿Cómo conseguimos esto? A través de decorar dos o más clases como el mismo atributo *Collection*, como en el siguiente ejemplo extraído de esa misma página.

```
[Collection("Our Test Collection #1")]
public class TestClass1
{
    [Fact]
    public void Test1()
    {
        Thread.Sleep(3000);
    }
}
[Collection("Our Test Collection #1")]
public class TestClass2
{
    [Fact]
    public void Test2()
    {
        Thread.Sleep(5000);
    }
}
```

En este caso, el total de tests tardaría sobre 8 segundos en ejecutarse, ya que se ejecutarían de forma secuencial. ¿Por qué? Porque **xUnit define que los tests que pertencen a una misma colección se ejecutan de la misma forma que aquellos que pertenecen a la misma clase. Es decir, de forma secuencial.**

Y aquí es donde podemos apreciar la razón por la que nuestros tests se ejecutaban de forma secuencial. Y es que, ¿cuál la recomendación principal que ves por Internet cuando buscas configurar tests que se ejecuten sobre una base de datos? Añade una [***Fixture***](https://xunit.net/docs/shared-context). ¿Y cómo agregas una *fixture* a tus tests? A través de una *Collection*. De esta manera, acabas con un proyecto de tests en las que todas las clases pertenecen a la misma colección. Con ficheros de clases parecidos a éste de aquí abajo, extraído de nuevo de la documentación oficial de xUnit:

```
[Collection("Database collection")]
public class DatabaseTestClass1
{
    DatabaseFixture fixture;
    public DatabaseTestClass1(DatabaseFixture fixture)
    {
        this.fixture = fixture;
    }
}
[Collection("Database collection")]
public class DatabaseTestClass2
{
    // ...
}
```

No es objeto de este artículo describir el funcionamiento fundamental de xUnit y de las fixtures, así que, si no sabes lo que son, te recomiendo [**esta página de docu oficial de xUnit**](https://xunit.net/docs/shared-context).

Continuando con el tema de la paralelización... Recapitulemos. Como nuestros tests hacían uso de una base de datos externa, utilizábamos una Fixture para poder hacer uso de ella. Pero, como eso al parecer nos obligaba a decorar todas las clases de los tests con la misma *collection*, nuestros tests no se ejecutaban en paralelo.

¿Existe alguna solución a este aparente *deadlock*? ¡Afortunadamente sí!

### Solución

Por suerte, además, esta solución no requiere grandes cambios en el proyecto de testing. Básicamente, el cambio consiste en **sustituir el decorador Collection que habíamos incluido en todas las clases de tests por la implementación, por parte de las clases de test, de la interfaz IAssemblyFixture**.

Nuestras clases de test, después del cambio, por tanto, quedaron así:

```
namespace Tests
{
    public class TestSample : IAssemblyFixture<DatabaseFixture>
    {
        readonly DatabaseFixture dbFixture;
        public TestSample(DatabaseFixture databaseFixture)
        {
            dbFixture = databaseFixture;
        }
        [Fact]
        public void ShouldDoSomething()
        {
            ...
        }
    }
}
```

Esta interfaz y su funcionalidad asociada pertenecen a la librería *xunit.assemblyfixture*. Para entender mejor su uso, te recomiendo leer [**este pequeño artículo**](https://tpodolak.com/blog/2017/02/19/xunit-sharing-test-data-across-assembly/) y, como no, el [**post de StackOverflow**](https://stackoverflow.com/questions/66607741/how-to-execute-xunit-class-tests-in-parallel-using-common-fixture)  correspondiente 😊.

Añadir también que, debido a que quitamos el decorador, podemos eliminar también la clase Collection de la fixture de la base de datos, que creo que es algo que tod@s deseamos hacer. Una clase vacía suele dar un poco de urticaria.

Y nada más. Happy testing!!
