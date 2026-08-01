---
title: 'EF Core vs Dapper vs ADO .NET'
description: 'Diferencias fundamentales en la utilización de EF Core, Dapper y ADO.NET para el acceso a base de datos en .NET y C#.'
pubDate: 'Dec 28 2023'
---
### Acceso a base de datos con aplicaciones .NET y C#

Dependiendo de los años de experiencia que tengas trabajando con proyectos de .NET y los proyectos en los que te haya tocado trabajar, es posible que ya hayas utilizado alguna de estas librerías para el acceso a base de datos: **Entity Framework (EF) Core, Dapper, ADO.NET** y quizás alguna otra.

En base a mi experiencia al menos, lo que he podido comprobar es que parece que **EF Core se ha convertido en la librería estándar** para este tipo de funcionalidad. **ADO.NET**, por otra parte, puede ser la librería que con gran probabilidad te encuentres si tienes que trabajar en **proyectos legacy** que fueron creados hace algunos años. Y, por último, **Dapper** **parece estar cogiendo cada vez más fuerza** sobre todo para operaciones de lectura sobre base de datos debido a ciertas ventajas que comentaré más adelante.

### Diferencias fundamentales

Veamos algunas de las características de estas librerías que nos ayudarán a entender en qué se diferencian unas de otras y en qué casos puede tener más sentido escoger cada una de ellas.

##### **EF Core**

[**Entity Framework Core**](https://learn.microsoft.com/es-es/ef/core/) es la actual librería estándar que nos ofrece Microsoft para que nuestra aplicación .NET interactúe con nuestra(s) base(s) de datos.

EF Core se trata de un **[ORM](https://www2.deloitte.com/es/es/pages/technology/articles/que-es-orm.html)** completísimo que encaja a la perfección con el resto de librerías y frameworks estándar del mundo .NET.

Un ORM, de manera muy simplificada, es una capa de software que ayuda a que nuestra lógica de negocio y presentación no se mezcle con detalles de acceso a base de datos (comunmente código SQL y mapeo de datos puros a objetos .NET y viceversa). Es decir, crea una abstracción para hacer nuestro código más legible y mantenible. Al mismo, tiempo, al hacer uso de una librería externa, hace mucho trabajo en la sombra para que no tengamos que reinventar la rueda. Estos ORMs normalmente te ofrecen la oportunidad de trabajar con varios tipos de bases de datos diferentes: MySQL, PostgreSQL, SQL Server, etc.

En el caso de EF Core, nos **provee de una cantidad considerable de funcionalidad para crear consultas complejas así como modificar fácilmente los datos que persiste nuestra aplicación**. Asímismo, ofrece una gran cantidad de parámetros de configuración para adaptar esos accesos a tus necesidades específicas. Todo esto lo logra a través de [**una implementación muy rica de los patrones de diseño Repository y Unit Of Work**](https://arbems.com/en/repository-pattern-unit-of-work-in-ef-core/#:~:text=A%20repository%20is%20nothing%20more,operations%20on%20that%20specific%20persistence.).

Así visto... EF Core parece maravilloso, ¿no? ¿Por qué entonces deberíamos plantearnos otras opciones? La verdad es que los desarrolladores que trabajamos normalmente con .NET estamos de enhorabuena últimamente, porque las mejoras que Microsoft ha incluido en las últimas versiones tanto de .NET Core como de EF Core son de quitarse el sombrero. En el caso de EF Core no paran de introducir nuevas funcionalidades y, al mismo tiempo, mejorar el rendimiento de manera considerable. Pero es imposible tener todo, y, por ejemplo, una librería tan potente como EF Core significa que tienes que hacer frente a mayor complejidad a la hora de utilizarla, y, al hacer tantas cosas por ti *under the hood*, le resulta prácticamente imposible ofrecer un rendimiento mejor que otras opciones más ligeras.

 Así que veamos esas opciones 🙂.

##### Dapper

[**Dapper**](https://github.com/DapperLib/Dapper) es, si no me equivoco, el micro ORM de moda en el ecosistema Microsoft-.NET. En esa corta frase ya puedes ver la diferencia fundamental entre EF Core y Dapper: Dapper es un **micro** ORM. Es decir, es una versión ligera de EF Core, por así decirlo.

La diferencia fundamental que puedes encontrar en la mayoría de proyectos entre usar una opción u otra es que con Dapper normalmente escribes las consultas a realizar sobre la base de datos en SQL y con EF Core normalmente confías esa generación de código SQL a la librería. Esto no es del todo así, ya que EF Core también ofrece esa opción y de manera bastante optimizada en su última versión, pero Dapper sigue siendo algo más rápido y sobre todo, mucho más fácil de configurar y con mucha menos magia negra por debajo que te pueda dar alguna sorpresa.

**Es posible que te interese utilizar Dapper** en lugar de EF Core si se dan alguna de estas circunstancias:

-   Tú y/o tu equipo sois unos **amantes de SQL**.
-   Necesitas tener la **flexibilidad de cambiar y mantener las sentencias concretas SQL** que se ejecutan sobre tu base de datos.
-   Necesitas **optimizar al menos algunas de las consultas** que realizas sobre tu base de datos.
-   No necesitas la mayoría de funcionalidades que ofrece un ORM completo y **sólo quieres poder hacer un mapeo fácil entre objetos .NET y tipos SQL**.

Como te comentaba anteriormente, esto no es del todo cierto, ni es una cosa de blanco o negro, ya que Microsoft ha puesto mucho enfásis de hacer EF Core sumamente adaptable a tus necesidades y ha mejorado el rendimiento hasta llegar a cotas bastantes altas. No obstante, si eres un usuario/a fiel de EF Core y te animas a probar Dapper, estoy seguro de que te sorprenderá la simplifidad asociada a añadir sólo una fina capa entre tu aplicación y tu base de datos en lugar de la considerable abstracción y parafernalia normalmente incluida en los proyectos que hacen uso de EF Core. Si has trabajado con ADO.NET, es como añadir una librería que elimina el trabajo más tedioso que normalmente asocias a ADO.NET.

##### ADO.NET

ADO.NET era la librería estándar para acceso a base de datos en las aplicaciones .NET. Esto cambió con la entrada de Entity Framework en escena y, más tarde, EF Core. Así, hoy en día es bastante raro ver un nuevo proyecto basado en .NET que haga uso directo de ADO.NET.

En realidad hay pocas **razones para hacer uso directo de esta librería** para tu acceso a base datos, pero puede que alguna de éstas se de en tu caso:

-   Necesitas una **hiperoptimización del acceso a base de datos**. Dapper es una fina capa de abstracción sobre ADO.NET, así que en teoría al menos, haciendo uso directo de ADO.NET, puedes ganar cierto rendimiento. En la práctica, sin embargo, [**esto no es tan fácil**](https://stackoverflow.com/questions/47786450/dapper-vs-ado-net-with-reflection-which-is-faster), ya que necesitas tener un buen conocimiento de cómo funciona esta librería de bajo nivel.
-   **Tu aplicación es super simple**. Es posible que tu aplicación sea tan simple que hasta la funcionalidad de mapeo objeto-relacional te sobre. En ese caso, probablemente te interesa más utilizar directamente ADO.NET.
-   En una **aplicación legacy** que hace uso de ADO.NET. Esta es quizás la razón menos convicente, ya que un buen desarrollador/a tratará de mejorar poco a poco la aplicación para hacerla más mantenible. Aunque puede haber casos en que realizar estas mejoras no merezca la pena. Es decir, la adoptas como animal de compañía porque intentar erradicarla sería un *overkill*.

### Diferencias en el código

Bueno... Pues... Como solemos decir casi siempre... Show me the code! 😄

Para ello he preparado una pequeña aplicación de consola basada en un par de acciones que podrían ser necesarias en una aplicación para una clínica veterinaria que puedes ver y descargar [**aquí**](https://github.com/victorgomezdejuan/pet-clinic).

A continuación podemos ver las diferencias notables en líneas de código a escribir para el caso de una inserción y consulta sencillas:

#### EF Core

```
public void Add(Pet pet)
{
    context.Pets.Add(pet);
    context.SaveChanges();
}
public Pet GetById(int id) => context.Pets.Single(p => p.Id == id);
```

#### Dapper

```
public void Add(Pet pet)
{
    using var connection = new SqlConnection(connString);
    var sql = "INSERT INTO Pets (Id, Name, Type, Weight) VALUES (@Id, @Name, @Type, @Weight)";
    connection.Exe cute(sql, pet);
}
public Pet GetById(int id)
{
    using var connection = new SqlConnection(connString);
    var sql = "SELECT Id, Name, Type, Weight FROM Pets WHERE Id = @Id";
    return connection.QuerySingle<Pet>(sql, new { Id = id });
}
```

#### ADO.NET

```
    public void Add(Pet pet)
    {
        string query = "INSERT INTO Pets (Id, Name, Type, Weight) VALUES (@Id, @Name, @Type, @Weight)";
        using var connection = new SqlConnection(connString);
        var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@Id", pet.Id);
        command.Parameters.AddWithValue("@Name", pet.Name);
        command.Parameters.AddWithValue("@Type", pet.Type);
        command.Parameters.AddWithValue("@Weight", pet.Weight);
        connection.Open();
        command.ExecuteNonQuery();
        connection.Close();
    }
    public Pet GetById(int id)
    {
        string query = "SELECT Id, Name, Type, Weight FROM Pets WHERE Id = @Id";
        using var connection = new SqlConnection(connString);
        var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@Id", id);
        connection.Open();
        using SqlDataReader reader = command.ExecuteReader();
        if (reader.Read())
        {
            return new(
                 reader.GetInt32(0),
                 reader.GetString(1),
                 (AnimalType)reader.GetInt32(2),
                 reader.GetDouble(3));
        }
        throw new Exception("No elements or more than one element.");
    }
```

Como veis, la diferencia de líneas de código a escribir es considerable, si bien, en honor a la verdad, hay que decir que EF Core es el único que nos obliga a definir un [**DbContext**](https://learn.microsoft.com/en-us/ef/core/dbcontext-configuration/).

### Bonus track

Hace unos meses dí con [**una propuesta bastante**](https://www.milanjovanovic.tech/blog/cqrs-pattern-with-mediatr) interesante del creador de contenidos [**Milan Jovanović**](https://www.youtube.com/@MilanJovanovicTech) en la que hace uso del patrón [**CQRS**](https://www.netmentor.es/entrada/patron-cqrs-explicado-10-minutos) para separar acciones de lectura y escritura y utilizar diferentes enfoques/librerías para cada tipo de acción. En su caso, EF Core para acciones de escritura y Dapper para acciones de lectura.
