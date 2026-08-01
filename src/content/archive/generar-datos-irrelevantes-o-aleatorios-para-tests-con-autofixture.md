---
title: 'Generar datos irrelevantes o aleatorios para tests con AutoFixture'
description: 'En muchas ocasiones necesitamos generar datos primitivos u objetos cuyo valor nos es indiferente para el test que vamos a ejecutar. AutoFixture nos ayuda a generar estos valores de forma sencilla.'
pubDate: 'Sep 29 2024'
---
### Fake data o datos irrelevantes en los tests

Como seguramente ya sepas, los tests se suelen dividir en 3 partes:

-   **Arrange**: Preparación de los datos y objetos necesarios para poder realizar la acción que queremos testear.
-   **Act**: La acción que queremos testear.
-   **Assert**: Comprobación de que la acción ha efectuado los cambios y efectos esperados.

En un mundo ideal, todas las acciones que hacemos en la fase de Arrange son relevantes para el test que queremos ejecutar. En la vida real, sin embargo, **muchas veces nos toca crear variables y generar datos primitivos que en realidad no tienen ninguna relevancia ni efecto sobre la lógica que vamos a testear**. Esto resulta especialmente frecuente cuando introducimos tests en código legacy, donde muchas veces nuestros tests son un híbrido entre integration y unit tests. Sin embargo, no solamente ocurre en estos casos.

Como ejemplo de esto último, voy a coger como referencia uno de los unit tests que creé en un proyecto de práctica de TDD que puedes encontrar en [**este repositorio**](https://github.com/victorgomezdejuan/corporate-hotel-booking).

```
[Theory, AutoData]
public void AddEmployee(int employeeId, int companyId)
{
    // Arrange
    var addEmployeeCommand = new AddEmployeeCommand(employeeId, companyId);
    // Act
    var result = _addEmployeeCommandHandler.Handle(addEmployeeCommand);
    // Assert
    result.IsFailure.Should().BeFalse();
    _employeeRepository.Verify(r => r.Add(new Employee(employeeId, companyId)));
}
```

El proyecto consiste en crear una aplicación de reserva de hoteles. En este test, como puedes ver, se está testeando la lógica de añadir un nuevo empleado en el sistema.

Es posible que el código productivo sea mejorable o que se te ocurra otra forma de hacerlo, pero aún así yo no lo considero un código extracomplejo o con muchos fallos de diseño. Y, aún así, a la hora de añadir un empleado el sistema nos pide un par de datos que en realidad nos da igual cuáles sean (mientras sean válidos).

En este caso, estos datos son el ID del empleado y el ID de la empresa a la que pertence ese empleado. En una aplicación real, los datos requeridos serían muchos más, obviamente, pero la idea seguiría siendo la misma.

### Diferencias entre AutoFixture, Bogus y no utilizar librerías externas.

Puede que os haya extrañado alguna cosa del código de arriba como... ¿Dé dónde salen los valores de *employeeId* y *companyId*? No os preocupéis porque lo vamos a ver enseguida, pero de momento veamos como podríamos crear este mismo test de 3 formas diferentes:

-   Sin hacer uso de ninguna librería externa.
-   Usando [**Bogus**](https://github.com/bchavez/Bogus).
-   Usando [**AutoFixture**](https://github.com/AutoFixture/AutoFixture).

#### Sin utilizar librerías externas

Si no utilizáramos librerías externas, podríamos crear el test anterior de la siguiente manera:

```
[Fact]
public void AddEmployee()
{
    // Arrange
    int employeeId = 1;
    int companyId = 1;
    var addEmployeeCommand = new AddEmployeeCommand(employeeId, companyId);
    // Act
    var result = _addEmployeeCommandHandler.Handle(addEmployeeCommand);
    // Assert
    result.IsFailure.Should().BeFalse();
    _employeeRepository.Verify(r => r.Add(new Employee(employeeId, companyId)));
}
```

Aparentemente no hay muchas diferencias, pero analicémoslas porque para mí son más relevantes de lo que pueden parecer en un principio:

-   **Hemos cambiado los parámetros por variables**. En este caso, esto no tiene mucho impacto, pero en muchos tests reales con muchos más valores y objetos en juego, os aseguro que la diferencia puede ser encontraros con una sección *Arrange* muy grande en la que gran parte de las líneas están dedicadas a generar valores y objetos e irrelevantes para el test en cuestión.
-   **Hemos tenido que asignar valores concretos a esas variables**. Éste es sin duda el cambio más importante. En esta nueva versión del test, hemos tenido que aportar valores concretos a los valores de entrada que necesitamos para ejecutar el test. En concreto, hemos asignado el valor "1" tanto a employeeId como a companyId. Y esto, algo que parece inocuo, puede ser muy problemático para una persona que lee por primera vez el test y no está familiarizado con la base de código. En concreto, le pueden surgir las siguientes dudas: ¿Tiene que tener el *employeeId* el valor "1" para que el test sea válido? ¿Tiene que tener el *companyId*  el valor "1" para que el test sea válido? ¿Tienen que tener ambos el mismo valor? Al ser este caso muy sencillo, casi cualquier persona va a dar por hecho que estos valores son irrelevantes para el test en cuestión, pero os puedo asegurar que en casos más complejos (la mayoría de casos reales), no es tan sencillo para el lector/a discenir fácilmente qué valores u objetos son irrelevantes o no para el test.

Entonces, para intentar solucionar este problema, podemos reescribir el test de la siguiente forma:

```
[Fact]
public void AddEmployee()
{
    // Arrange
    int irrelevantEmployeeId = 1;
    int irrelevantCompanyId = 2;
    var addEmployeeCommand = new AddEmployeeCommand(irrelevantEmployeeId, irrelevantCompanyId);
    // Act
    var result = _addEmployeeCommandHandler.Handle(addEmployeeCommand);
    // Assert
    result.IsFailure.Should().BeFalse();
    _employeeRepository.Verify(r => r.Add(new Employee(irrelevantEmployeeId, irrelevantCompanyId)));
}
```

Los cambios que he realizado son:

-   Cambiar el nombre de la variable *employeeId* por *irrelevantEmployeeId* para dejar claro que el valor del ID del empleado es irrelevante para este test. No el valor en sí, ya que luego tenemos que comprobar que el empleado es creado con ese valor, si no que ese valor podría ser cualquiera: 1, 2, 3, etc.
-   Lo mismo con la variable *companyId*.
-   He asignado en este caso el valor "2" a *companyId* para que quede claro que *employeeId* y *companyId* no tienen por qué tener el mismo valor.

¿Os dais cuenta de cómo se complejiza todo? Seguramente estéis pensando... ¡Víctor! ¡Pero si todo eso ya se veía claro en el test anterior! ¡No hace falta ser tan quisquilloso! Pues en este caso, tan sencillo y con código tan limpio (sí, modestia aparte 😆), seguramente no aporten muchos estos cambios. Pero os invito a hacer esta misma reflexión en tests con los que trabajéis o cuando vayáis a crear un test sobre un proyecto legacy. Y es que, ¿queréis que os cuente un secreto? **¿Queréis que os diga cómo se genera código legacy? Haciendo presunciones**. Sí, haciendo presunciones o suposiciones. Lo repito porque esto es superimportante. **Tenemos que escribir código y hacer cualquier tipo de acción sobre nuestro proyecto pensando siempre si alguien que entre nuevo sin tener ni idea del proyecto, va a poder entenderlo o no.**

Seguro que tenéis algún compañero/a o amigo/a que os habla sin poner en contexto antes las cosas y sin daros todos los datos y tenéis que estar todo el rato preguntándole y sacándole la información con sacacorchos. Pues en este caso ocurre lo mismo. Si te *cazas* pensando "pero esto yo ya lo sé", "esto es evidente", "es de cajón", etc. Para. Para y añade la información que estás omitiendo. Ya sea en forma de nombre de método, nombre de variable, texto en un string, comentario de código... Como sea, pero hazlo. Y el/la que venga detrás, que puedes ser tú mismo/a, te lo agradecerá profundamente.

#### Utilizando Bogus

Para ser honestos, no tengo mucha experiencia con [**Bogus**](https://github.com/bchavez/Bogus) porque, en uno de los proyectos en los que trabajé donde se utilizaba, enseguida se comenzó a reemplazar por AutoFixture y, en el siguiente, fui yo el que propuso sustituirlo por la misma librería. Pero veamos como sería nuestro ejemplo haciendo uso de Bogus:

```
[Fact]
public void AddEmployee()
{
    // Arrange
    var faker = new Faker();
    int employeeId = faker.Random.Number(1, int.MaxValue);
    int companyId = faker.Random.Number(1, int.MaxValue);
    var addEmployeeCommand = new AddEmployeeCommand(employeeId, companyId);
    // Act
    var result = _addEmployeeCommandHandler.Handle(addEmployeeCommand);
    // Assert
    result.IsFailure.Should().BeFalse();
    _employeeRepository.Verify(r => r.Add(new Employee(employeeId, companyId)));
}
```

Fijaros como, de un plumazo, **hemos eliminado casi por completo los problemas que comenté que tenía el test anterior**. Ahora queda claro que employeeId y companyId tienen que ser dos enteros positivos cualesquiera y no tienen por qué ser tener el mismo valor.

No quiero que se me malinterprete con este post. Bogus es una herramienta genial, y su uso no tiene por qué estar reñido con el de AutoFixture. **Ambas librerías son diferentes y, para según qué casos, una de ellas es más fácil de usar y entender que la otra.** Sin embargo, en base a mi experiencia hasta ahora, he comprobado que, para la mayoría de casos, es suficiente con usar AutoFixture y los tests quedan muy simplificados y legibles gracias a esta librería.

#### Utilizando AutoFixture

Este es un buen momento para explicar cuál es la **diferencia fundamental entre Bogus y [AutoFixture](https://github.com/AutoFixture/AutoFixture): Bogus te permite especificar cómo se debe rellenar cada dato de entrada de manera personalizada con múltiples opciones diferentes, mientras que AutoFixture intenta automatizar y quitarte del mayor trabajo posible a la hora de definir estos datos de entrada**. [Este post](https://matthewregis.dev/posts/comparing-fake-data-generator-with-bogus-vs-autofixture) lo explica muy bien.

Veamos una versión de nuestro test utilizando AutoFixture que es parecida al ejemplo anterior con Bogus.

```
[Fact]
public void AddEmployee()
{
    // Arrange
    var fixture = new Fixture();
    int employeeId = fixture.Create<int>();
    int companyId = fixture.Create<int>();
    var addEmployeeCommand = new AddEmployeeCommand(employeeId, companyId);
    // Act
    var result = _addEmployeeCommandHandler.Handle(addEmployeeCommand);
    // Assert
    result.IsFailure.Should().BeFalse();
    _employeeRepository.Verify(r => r.Add(new Employee(employeeId, companyId)));
}
```

Como podéis comprobar, este ejemplo es casi igual que el de Bogus pero incluso en este caso tan simple, ya podemos ver la diferencia de customización entre uno y otro. Mientras Bogus nos "forzaba" (o habilitaba) a escoger un rango para los enteros que se generen, AutoFixture da por hecho que nos da igual su valor. De hecho, generar un rango como el que nos ofrece Bogus no es para nada tan sencillo con AutoFixture. Lo interesante, sin embargo, es que en mi experiencia individual es mucho más común el caso en el que el valor nos da igual que el contrario. De ahí la gran relevancia de la simplificación que nos ofrece AutoFixture.

Ahora es buen momento para recordar el primer *code snippet* del post:

```
[Theory, AutoData]
public void AddEmployee(int employeeId, int companyId)
{
    // Arrange
    var addEmployeeCommand = new AddEmployeeCommand(employeeId, companyId);
    // Act
    var result = _addEmployeeCommandHandler.Handle(addEmployeeCommand);
    // Assert
    result.IsFailure.Should().BeFalse();
    _employeeRepository.Verify(r => r.Add(new Employee(employeeId, companyId)));
}
```

Como veis, AutoFixture contiene el atributo *AutoData* que nos permite definir esos valores irrelevantes como parámetros del test. No me digaís que no mola 😄.

Pero es que además, podríamos hacer algo como esto 🤯:

```
[Theory, AutoData]
public void AddEmployee(AddEmployeeCommand command)
{
    // Act
    var result = _addEmployeeCommandHandler.Handle(command);
    // Assert
    result.IsFailure.Should().BeFalse();
    _employeeRepository.Verify(r => r.Add(new Employee(command.EmployeeId, command.CompanyId)));
}
```

Brutal. No me digáis que no 😁. Como he comentado, este ejemplo es muy sencillo y con él trataba no sólo de explicar la diferencia entre estas 3 posibilidades sino también de alertar sobre las suposiciones que hacemos al escribir los tests, código productivo, documentación, e incluso mensajes, que pueden llegar a ser un dolor de cabeza para la persona que venga detrás o interlocutor que... ¡Adivina! En efecto, puedes ser tú 😉.
