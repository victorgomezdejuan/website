---
title: 'OData en .NET sin Entity Framework'
description: 'Cómo construir una OData RESTful API en una aplicación web de .NET sin hacer uso de Entity Framework Core y de delegar toda la lógica en la librería de Microsoft.'
pubDate: 'Mar 4 2023'
---
### Qué es OData y para qué sirve

Son muchos los proyectos en los que surge la necesidad de crear una API web para que sea consumida por un ente "interno" conocido (frontend web o app móvil, por ejemplo) o por terceros desconocidos (si se trata de una API comercial o pública). En cualquiera de los dos casos, aunque a un nivel diferente, suele surgir el problema de **cómo definir los endpoints de esa API para que sean lo más estándar posible** (y por tanto entendible y mantenible) y, al mismo tiempo, que satisfaga las necesidades de los clientes que la llamen **sin necesidad de añadir complejidad innecesaria** tanto por parte de la parte llamante como del propio backend que soporta dicha API.

No son pocos los proyectos que optan por hacer una API completamente personalizada sobre la marcha, creando endpoints que ofrezcan la funcionalidad necesaria para desarrollar las diferentes *user stories* que se van realizando. Este enfoque no tiene nada de malo per sé, pero puede derivar en una API difícil de entender para alguien nuevo que vaya a hacer uso de la misma o que tenga que mantenerla. Sin un acuerdo previo, la API puede convertirse en una amalgama de endpoints completamente independientes, al menos desde el punto de vista de los que hacen uso de la misma.

En la época del boom de los microservicios, además, muchas veces cada microservicio suele estar basado en una entidad específica (un microservicio para clientes, otro para pedidos, otro para facturas, etc.) y todos ellos siguen un patrón muy parecido al menos para las llamadas principales. Esto es, las [**operaciones CRUD**](https://www.sumologic.com/glossary/crud/#:~:text=with%20Sumo%20Logic-,What%20is%20CRUD%3F,%2C%20read%2C%20update%20and%20delete.) sobre esas entidades.

Para ayudarnos con esta estandarización, hace tiempo se popularizaron las [**API REST**](https://www.redhat.com/es/topics/api/what-is-a-rest-api), que establecen una serie de reglas sobre cómo debemos **implementar nuestros nuevos endpoints de manera que alguien que quiera hacer uso de ellos puedo aprender a hacerlo rápidamente y evitando suposiciones erróneas**. No es el objetivo de este artículo explicar este tipo de APIs, pero sí es recomendable entenderlas antes de seguir leyéndolo, así que te invito a que investigues un poco antes si no conoces este tipo de APIs todavía. Para poneros un poco en contexto, digamos que establecen reglas tales como que las *queries* (peticiones de información) se hagan con el método HTTP GET y las modificaciones (de una entidad, por ejemplo) con POST.

Sin embargo, **REST no es un protocolo ni un estándar**, y por tanto **no puede entrar en el detalle necesario para establecer un contrato claro entre los clientes de la API y el servidor de la misma**. Nos ofrece un marco (muy útil en la mayoría de casos), pero corre de nuestra parte el detalle de la API sobre ese marco.

Es aquí donde entran opciones como [**OData**](https://www.odata.org/). **OData (Open Data Protocol) sí es un protocolo y sí es un estándar**, de manera que nos ayuda a definir de forma muy rápida cómo definir los endpoints de nuestra API. Ejemplos de llamadas a APIs OData pueden ser:

-   *GET serviceRoot/People*
-   *GET serviceRoot/People('russellwhyte')*
-   *GET serviceRoot/People?$filter=FirstName eq 'Scott'*
-   *GET serviceRoot/People('scottketchum')/Trips?$orderby=EndsAt desc*
-   *GET serviceRoot/People?$top=2*
-   *GET serviceRoot/People?$skip=18*

Sin embargo, (casi) todo lo que añadas a tu proyecto software va a tener su lado bueno y su lado malo. Y en el caso de OData, esto no es diferente. Una mayor estandarización conlleva una mayor facilidad para acordar la definición de tu API, pero, a cambio, esto conlleva una mayor rigidez también. Hacer algo que "se salga" de OData, una vez que lo has integrado en tu proyecto, puede ser problemático en muchos sentidos. A favor de este punto hay que decir que OData ya intenta minimizar el impacto de este aspecto negativo dejando bastante flexibilidad en el protocolo (a través de las llamadas *Functions* y *Actions*).

No obstante, al igual que el objetivo de este artículo no es explicar los que es una API REST, tampoco lo es explicar qué es OData. Así que si no sabes lo qué es, puedes primero informarte en su [**página oficial**](https://www.odata.org/), por ejemplo, o en cualquieras de los múltiples artículos escritos sobre este protocolo.

### OData en .NET

**OData es un estándar creado por Microsoft** y, por tanto, se trata de un protocolo bastante bien soportado por [**.NET**](https://dotnet.microsoft.com/es-es/learn/dotnet/what-is-dotnet), sobre todo a través de las librerías [ODataLib](http://www.nuget.org/packages/Microsoft.OData.Core/), [EdmLib](http://www.nuget.org/packages/Microsoft.OData.Edm/) y [OData Client for .NET](http://www.nuget.org/packages/Microsoft.OData.Client). El objetivo de esta última es ofrecer una manera rápida y sencilla de crear una API de OData sobre tu proyecto web hecho en .NET sin necesidad apenas de crear código adicional en caso de que utilices [**Entity Framework Core**](https://learn.microsoft.com/es-es/ef/core/) para el acceso a tu base de datos.

Para este último caso, por tanto, no te será difícil encontrar artículos donde explican como desplegar una API compatible con OData de forma muy, muy fácil. Ejemplos de ello pueden ser [este artículo](https://devblogs.microsoft.com/odata/tutorial-creating-a-service-with-odata-8-0/) o [éste](https://code-maze.com/aspnetcore-webapi-using-odata/). La potencia de esta librería es innegable. A través de objetos IQueryable, convierte las queries HTTP recibidas de los clientes en código SQL que se ejecuta sobre tu base de datos. **No tienes que hacer ningún tipo de mapeo ni lógica adicional** para gestionar un montón de casos comunes de consultas como filtrado por ciertos campos, ordenación, agregación, paginado, obtener entidades relacionadas, etc. Es decir, estas librerías se encargan tanto del mapeo de las *query strings* como de la lógica de negocio asociada a esas consultas y del acceso a base de datos. Es un todo en uno, como muchas veces ocurre con Microsoft, y como seguro sabrás se trata siempre de un arma de doble filo.

Puede que te interese manejar mejor qué tipo de consultas se pueden realizar sobre tus endpoints o cuáles no. O cómo gestionar la lógica de esas operaciones. También puede ocurrir que tengas proyectos en los cuáles no quieras hacer uso Entity Framework Core, o no al menos de su utilidad para crear sentencias SQL a partir de instrucciones de LINQ. Ya sea por rendimiento, por querer gestionar las sentencias SQL a mano, por expertise del equipo en otro ORM...

Si este es tu caso, puede que te preguntes si es posible, a pesar de ello, hacer uso de las librerías proporcionadas por Microsoft para OData y, en caso de que así sea, si merece la pena o no. La respuesta para la primera duda es que sí y la segunda.... Tendrás que responderla tú mismo/a, ya que eso lo tiene que evaluar cada equipo en función de su experiencia y el proyecto que tenga entre manos 😊.

En nuestro caso, no queríamos hacer uso de las librería de OData de la forma descrita en los artículos citados más arriba porque **el microservicio en el que queríamos implementar el protocolo OData seguía una arquitectura hexagonal** y ese uso de la librería en la que la lógica de presentación, la de negocio y la de acceso a base de datos se encontraban en la misma función y clase, rompía con la armonía del resto del módulo y podía llevar a problemas de mantenimiento posterior.

Un aspecto importante que creo que debes conocer también es que las librerías de OData para .NET son muy potentes. Están muy curradas. Éstas, te proporcionan una gran flexibilidad para decidir cuándo y cómo quieres beneficiarte de ellas. Así, por tanto, puedes hacer uso de toda su potencia (por ejemplo de la conversión HTTP requests -> sentencias SQL) en algunos casos, y customizar la lógica a seguir en otros. Sin embargo, nada es *gratis*, y una vez que decides hacer uso de esta librería para facilitarte parte de tu vida, habrá otras ocasiones en que,  si quieres salirte un poco de su camino estándar, no resulte tan sencillo.

### OData sin Entity Framework

Déjame mostrarte por tanto cómo puedes crear una API compatible con OData en .NET usando las librerías estándar de Microsoft pero "puenteando" su funcionalidad para no hacer uso de ciertas características (como la conversión automática de peticiones HTTP en sentencias SQL).

En nuestro caso, la funcionalidad que añadimos primero a nuestra API fue la relativa a las operaciones de *$select, $filter, $orderby, $skip* y *$top*, aunque queríamos dejar la abierta la posibilidad de añadir nuevas operaciones como la de *$count*, que tenía muchas papeletas de ser añadida en el futuro cercano.

Como os he explicado antes, el microservicio en el que queríamos implementar el protocolo OData seguía una arquitectura hexagonal, así que veamos capa por capa (o clase por clase) las modificaciones que tuvimos realizar sobre lo que serían unas clases estándar sin hacer uso de este protocolo.

### Capa de presentación/API/controlador

Esta es la capa encargada de las comunicaciones con el exterior y, por tanto, la que proporciona la interfaz compatible con OData. La función que implementa el endpoint de consulta sobre la entidad Customer, en este caso, pinta tal que así:

```
[FilterEnableQuery]
public async Task<IEnumerable<CustomerDto>> Get(ODataQueryOptions<CustomerDto> queryOptions)
{
    QueryFilter filter = _filterParser.Parse(queryOptions);
    IEnumerable<Patient> customers = await _customerService.GetCustomers(filter);
    return customers.Select(p => p.ToCustomerDto()).ToList();
}
```

El atributo *FilterEnableQuery* se encarga de establecer qué funcionalidad se delega en la librería de OData (y cuál no) y el objeto \_filterParser convierte las *ODataQueryOptions* recibidas por el endpoint en un objeto QueryFilter definido por la aplicación (agnóstico al ecosistema OData). De esta manera conseguimos que todo el tema de OData que desacoplado de la capa de lógica de aplicación.

Veamos entonces el contenido de la clase *FilterEnableQuery:*

```
public class FilterEnableQueryAttribute : EnableQueryAttribute
{
    public override IQueryable ApplyQuery(IQueryable queryable, ODataQueryOptions queryOptions)
    {
        var ignoreQueryOptions =
            AllowedQueryOptions.Filter |
            AllowedQueryOptions.OrderBy |
            AllowedQueryOptions.Skip |
            AllowedQueryOptions.Top;
        return queryOptions.ApplyTo(queryable, ignoreQueryOptions);
    }
}
```

Y la clase *FilterConverter*, que es el tipo de dato de la variable *\_filterParser*.

```
public class FilterConverter<T> : IFilterConverter<T>
{
    public const BindingFlags PROPERTY_FLAGS = BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance;
    private readonly QueryFilter filter = new();
    private ODataQueryOptions? queryOptions;
    public QueryFilter Parse(ODataQueryOptions<T> queryOptions)
    {
        this.queryOptions = queryOptions;
        FillFilter();
        return filter;
    }
    private void FillFilter()
    {
        FillSelectItems();
        FillFilterItems();
        FillSortItems();
        FillPagination();
    }
    private void FillSelectItems()
    {
        SelectItemPropertyTranslator<T> translator = new();
        if (queryOptions!.SelectExpand is not null)
            foreach (SelectItem item in queryOptions.SelectExpand.SelectExpandClause.SelectedItems)
                filter.SelectProperties.Add(item.TranslateWith(translator));
    }
    private void FillFilterItems()
    {
        QueryNodeFilterItemVisitor<T> visitor = new();
        if (queryOptions!.Filter is not null)
            if (queryOptions.Filter.FilterClause.Expression.Kind.Equals(QueryNodeKind.BinaryOperator))
                filter.FilterItems.AddRange(queryOptions.Filter.FilterClause.Expression.Accept(visitor));
    }
    private void FillSortItems()
    {
        QueryNodeSortItemConverter<T> parser = new();
        if (queryOptions!.OrderBy is not null)
            foreach (OrderByNode node in queryOptions.OrderBy.OrderByNodes)
                filter.SortItems.Add(parser.Parse((OrderByPropertyNode)node));
    }
    private void FillPagination()
    {
        FillSkip();
        FillTop();
    }
    private void FillSkip()
    {
        if (queryOptions!.Skip is not null)
            filter.Pagination.Skip = queryOptions.Skip.Value;
    }
    private void FillTop()
    {
        if (queryOptions!.Top is not null)
            filter.Pagination.Top = queryOptions.Top.Value;
    }
}
```

Esta clase tiene bastante complejidad por la propia idiosincrasia de la librería de OData de Microsoft, pero quedaros con la idea de que, a partir de un objeto *ODataQueryOptions<T>*, obtiene un objeto de tipo *QueryFilter* completamente agnóstico de la librería OData. Es decir, partiendo de un objeto (muy complejo) de la librería de OData, crea un objeto fácilmente entendible y utilizable por cualquiera para realizar filtrados sobre colecciones o bases datos de una determinada entidad.

Os dejo [**aquí**](https://www.victorgomezdejuan.com/wp-content/uploads/2023/03/Filter.zip) un fichero .zip con la clase FilterConverter y las clases de las que hace uso, para que, con tiempo y una caña, podáis analizarlas y entenderlas.

Veamos ahora la clase QueryFilter para que veáis que no os miento 😄. Esta clase además, ya pertenecería a la capa de lógica de aplicación, por lo que pasemos también a ver qué se cuece ahí.

### Capa de aplicación/servicio/core

```
public enum FilterOperator
{
    Equal,
    NotEqual,
    GreaterThan,
    GreaterThanOrEqual,
    LessThan,
    LessThanOrEqual
}
public enum SortType
{
    Ascending,
    Descending
}
public class QueryFilter
{
    public List<PropertyInfo> SelectProperties { get; } = new List<PropertyInfo>();
    public List<QueryFilterItem> FilterItems { get; } = new List<QueryFilterItem>();
    public List<SortItem> SortItems { get; } = new List<SortItem>();
    public Pagination Pagination { get; set; } = new();
}
public class QueryFilterItem
{
    public QueryFilterItem(PropertyInfo property, FilterOperator optr, object value)
    {
        Property = property;
        Operator = optr;
        Value = value;
    }
    public PropertyInfo Property { get; set; }
    public FilterOperator Operator { get; set; }
    public object Value { get; set; }
}
public class SortItem
{
    public SortItem(PropertyInfo property, SortType sortType)
    {
        Property = property;
        SortType = sortType;
    }
    public PropertyInfo Property { get; set; }
    public SortType SortType { get; set; }
}
public class Pagination
{
    public int? Skip { get; set; }
    public int? Top { get; set; }
}
```

Esta clase encapsula la información necesaria para poder realizar operaciones de filtrado y ordenación sobre cualquier entidad. De ahí el uso del tipo *PropertyInfo*.

Si recordáis, el objeto de tipo *QueryFilter* que generábamos a partir del objeto *ODataQueryOptions<CustomerDto>* que nos hacía llegar la librería de OData, se lo pasábamos al método *\_customerService.GetCustomers* para que nos devolviera, en este caso, los clientes en base a esos criterios de filtrado y ordenación. Así que veamos ahora que hace esta clase-método:

```
    public class CustomerService : ICustomerService
    {
        private readonly ICustomerRepository _customerRepository;
        public PatientService(ICustomerRepository customerRepository)
            => _customerRepository = customerRepository;
        public async Task<IEnumerable<Customer>> GetCustomers(QueryFilter filter)
            => await _customerRepository.GetCustomers(filter);
    }
```

¡Poca sorpresa aquí! Si nos fijamos bien, en realidad la capa de presentación se encarga de convertir el objeto *ODataQueryOptions* (capa presentación) al objeto *QueryFilter* (capa de lógica de aplicación) y por tanto será la capa de acceso de base de datos la que recibirá ese objeto *QueryFilter* por parte del core de la aplicación (recordemos la [**arquitectura hexagonal**](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)) y lo interpretará para crear la query correspondiente.

Así que... ¡Pasemos a la siguiente capa!

### Capa de acceso a base de datos / repositorio

El método de la clase repositorio que recibe el objeto *QueryFilter*, como tal, es muy simple:

```
public class NpgsqlCustomerRepository : ICustomerRepository
{
    private readonly DatabaseOptions _dbOptions;
    private readonly IQueryExecutor _queryExecutor;
    public NpgsqlCustomerRepository(IOptions<DatabaseOptions> databaseOptions, IQueryExecutor queryExecutor)
    {
        _dbOptions = databaseOptions.Value;
        _queryExecutor = queryExecutor;
    }
    public async Task<IEnumerable<Customer>> GetCustomers(QueryFilter filter)
    {
        var sqlBuilder = new SqlQueryBuilder(filter, _dbOptions);
        return await _queryExecutor.Query<Customer>(sqlBuilder.GetSql(), sqlBuilder.GetParameters());
    }
}
```

Sin embargo, hace uso de un objeto muy interesante: *sqlBuilder*. Este objeto es de tipo *SqlQueryBuilder*, así que veamos la implementación de esa clase, que es dónde ocurre la segunda parte de la magia de la solución presentada en este artículo.

```
public class SqlQueryBuilder
{
    private readonly QueryFilter _filter;
    private readonly DatabaseOptions _dbOptions;
    private readonly Dictionary<string, object> _parameters;
    private const string ID_FIELD_NAME = "Id";
    public SqlQueryBuilder(QueryFilter filter, DatabaseOptions dbOptions)
    {
        _filter = filter;
        _dbOptions = dbOptions;
        _parameters = new Dictionary<string, object>();
    }
    public string GetSql()
    {
        string fromClause = GetFromClause();
        string selectClause = GetSelectClause();
        string sql = $@"SELECT {selectClause} FROM {fromClause}";
        string whereClause = GetWhereClause();
        if (!string.IsNullOrEmpty(whereClause))
            sql = $"{sql} WHERE {whereClause}";
        string orderClause = GetOrderByClause();
        if (!string.IsNullOrEmpty(orderClause))
            sql = $"{sql} ORDER BY {orderClause}";
        return sql;
    }
    public Dictionary<string, object> GetParameters()
        => _parameters;
    private string GetSelectClause()
    {
        if (_filter.SelectProperties.Count == 0)
            return "*";
        List<string> columnNames = _filter.SelectProperties.Select(sp => sp.Name).ToList();
        string selectClause = string.Join(",", columnNames.Select(col => @$"""{col}"""));
        return selectClause;
    }
    private string GetFromClause()
        => $"{_dbOptions.Schema}.{_dbOptions.Table}";
    private string GetWhereClause()
    {
        StringBuilder whereClause = new();
        bool firstExpression = true;
        foreach (QueryFilterItem item in _filter.FilterItems)
        {
            string columnName = item.Property.Name;
            if (item.Value is null)
            {
                if (item.Operator.Equals(FilterOperator.Equal))
                    return $"({columnName} IS NULL)";
                if (item.Operator.Equals(FilterOperator.NotEqual))
                    return $"({columnName} IS NOT NULL)";
            }
            string operatorSymbol = GetOperatorSymbol(item.Operator);
            string paramName = $"@p{_parameters.Count}";
            _parameters.Add(paramName, item.Value);
            if (!firstExpression)
                whereClause.AppendLine("AND");
            whereClause.AppendLine(@$"(""{columnName}"" {operatorSymbol} {paramName})");
            firstExpression = false;
        }
        return whereClause.ToString();
    }
    private static string GetOperatorSymbol(FilterOperator @operator)
    {
        return @operator switch
        {
            FilterOperator.Equal => "=",
            FilterOperator.NotEqual => "!=",
            FilterOperator.GreaterThan => ">",
            FilterOperator.GreaterThanOrEqual => ">=",
            FilterOperator.LessThan => "<",
            FilterOperator.LessThanOrEqual => "<=",
            _ => string.Empty,
        };
    }
    private string GetOrderByClause()
    {
        string orderClause = GetOnlyOrderByClause();
        string skipTopClause = GetSkipTopClause();
        if (string.IsNullOrEmpty(skipTopClause))
            return orderClause;
        return $"{orderClause} {skipTopClause}";
    }
    private string GetOnlyOrderByClause()
    {
        string orderByClause = string.Empty;
        if (_filter.SortItems.Count > 0)
        {
            List<string> sortExpressions = _filter.SortItems
                .Select(sp => $@"""{sp.Property.Name}"" " + GetSortSymbol(sp.SortType))
                .ToList();
            orderByClause = string.Join(",", sortExpressions);
        }
        else
            orderByClause = $@"""{ID_FIELD_NAME}""";
        return orderByClause;
    }
    private static string GetSortSymbol(SortType sortType)
    {
        return sortType switch
        {
            SortType.Ascending => "ASC",
            SortType.Descending => "DESC",
            _ => string.Empty,
        };
    }
    private string GetSkipTopClause()
    {
        if (_filter.Pagination.Top is not null)
            return $"OFFSET {_filter.Pagination.Skip ?? 0} ROWS FETCH NEXT {_filter.Pagination.Top} ROWS ONLY";
        if (_filter.Pagination.Skip is not null)
            return $"OFFSET {_filter.Pagination.Skip} ROWS";
        return string.Empty;
    }
}
```

Dejo en tu tejado el analizar e interpretar esta clase (la hice antes de conocer muchos conceptos de clean code, sorry), pero quiero que te quedes sobre todo con su objetivo: transformar el objeto de tipo QueryFilter, en una query SQL para ser ejecutada con tu ORM o librería de acceso a base de datos de confianza (o con la que te haya tocado trabajar 😄). En nuestro caso utilizamos [**Dapper**](https://github.com/DapperLib/Dapper) y **[PostgreSQL](https://www.postgresql.org/).**

Las **clases clave**, por tanto, son:

-   **FilterConverter**: Convierte el objeto de query propio de la librería de OData *ODataQueryOptions* en un objeto agnóstico de tipo *QueryFilter* (definido por nosotros) extrayendo de éste nada más que lo que nos interesa para hacer nuestras operaciones.
-   **SqlQueryBuilder:** Convierte un objeto *QueryFilter* en una consulta SQL parametrizada.

Y con esto yo creo que es suficiente para que entiendas la idea y puedas implementar OData en tus aplicaciones sin necesidad de romper tu arquitectura o delegar todas las operaciones en las librerías proporcionadas por Microsoft. Happy coding!
