---
title: 'Una alternativa a las subqueries en SQL Server:  CROSS APPLY y OUTER APPLY'
description: 'CROSS APPLY y OUTER APPLY: Una forma flexible y, muchas veces, más eficiente de utilizar subqueries en tus consultas SQL en SQL Server.'
pubDate: 'Jan 7 2022'
---
### El impacto de las subqueries en el rendimiento

Intentamos evitarlas a toda costa, no nos gustan, sabemos que van a tener un impacto muy negativo en el rendimiento de nuestras consultas... Pero a veces no nos queda otra que incluirlas. Son las temidas subqueries, tan odiadas como (a veces) necesarias. Y es que, para la mayoría de casos, cuando queremos obtener datos de una tabla que no sea sobre la que se hace la consulta principal, **solemos optar por los clásicos INNER JOIN, RIGHT (OUTER) JOIN o LEFT (OUTER) JOIN**. Hay más posibilidades, por supuesto, pero éstas son las más populares. **Sin embargo, hay casos para los que estas opciones no son válidas**, como cuando la tabla a introducir en la select para relacionarla con la principal tiene una *relación de muchos a uno (\*:1) o de muchos a muchos (\*:\*)*. Es decir, para cada fila de la tabla principal, hay ninguna, una o varias filas de la tabla secundaria. Esto hace que nuestros datos se dupliquen y que ***sólo* podamos salvar la papeleta con el socorrido GROUP BY**. Pero esta última opción algunas veces es poco elegante (aplicando agregados en campos sobre los que en realidad no aplica) y otra veces, directamente inviable. Antes de nada, me gustaría comentar que **la mejor solución a aplicar depende mucho de cada caso concreto**, y que, en consultas críticas o especialmente complejas, merece la pena preparar la misma query con diferentes técnicas y testear el rendimiento de cada una. Además, soy consciente también de que existen múltiples posibilidades para conseguir el mismo resultado, cada vez más, afortunadamente, en SQL Server. A este respecto, podríamos hablar también de [**las tablas temporates**](https://www.sqlservertutorial.net/sql-server-basics/sql-server-temporary-tables/), [**las CTEs**](https://docs.microsoft.com/es-es/sql/t-sql/queries/with-common-table-expression-transact-sql?view=sql-server-ver15), [**ROW\_NUMBER**](https://docs.microsoft.com/es-es/sql/t-sql/functions/row-number-transact-sql?view=sql-server-ver15), etc., etc. Sin embargo, no es objeto de este post realizar un análisis megaprofundo de las diferentes posibilidades (daría más bien para un libro), sino presentarte una nueva alternativa para esos casos en los que los JOINs tal cual no son válidos, o poco eficientes, o requeriría de añadir demasiada complejidad a la query.

### Ejemplo de la problemática

Perdón por chapa. Sé que estas cosas normalmente se entienden mejor con ejemplos. Así que vamos a ello ?. Pongamos que tenemos una base de datos con la típica tabla para pedidos de venta llamada SaleOrder. En ella tenemos datos como el identificador del pedido (Id), descripción del pedido (Desc) e identificador del cliente (CustomerId).

| Id | Desc | CustomerId |
| --- | --- | --- |
| O1111 | Bicycles Mountain View 2021 Q2 | C1234 |
| 02222 | Motorbikes > 250 Top Vision | C2345 |
| O3333 | K98455 Top Series Skill Factory | C3456 |

Sin embargo, en esta tabla no tenemos el dato del importe total de la factura, ya que se calcula en base a la suma del importe de las líneas del pedido, aplicando el impuesto y descuento correspondiente. Supongamos, por tanto, que en la tabla de líneas de pedidos (SaleOrderLine) tenemos, entre otros, los datos del identificador del pedido (SaleOrderId), el número de línea (Position), el identificador de artículo (ItemId), la cantidad a vender (Quantity) y el precio de venta unitario (UnitPrice).

| SaleOrderId | Position | ItemId | Quantity | UnitPrice |
| --- | --- | --- | --- | --- |
| O1111 | 1 | I9876 | 10 | 525.30 |
| 01111 | 2 | I4581 | 35 | 675.10 |
| 02222 | 1 | I4433 | 150 | 300.55 |

¿Qué haríamos, por ejemplo, si quisieramos sacar el listado de los pedidos con su importe de venta antes de impuestos y descuento? Fácil, ¿verdad? Podríamos, por ejemplo, hacer una consulta sobre las dos tablas utilizando un GROUP BY. Algo así:

```
SELECT SaleOrder.Id, SUM(SaleOrderLine.Quantity * SaleOrderLine.UnitPrice) Amount
```

```
FROM SaleOrder
```

```
INNER JOIN SaleOrderLine ON SaleOrder.Id = SaleOrderLine.SaleOrderId
```

```
GROUP BY SaleOrder.Id
```

Hasta aquí todo fácil, ¿verdad? Para este tipo de consultas, SQL está más que preparado para ponérnoslo fácil y ofrecernos un gran rendimiento. Sin embargo, pongámoslo un poco más difícil. Supongamos que tenemos una tabla llamada SaleOrderHistory donde vamos guardando los cambios de estado de cada pedido (creado, pendiente de envío, enviado, pagado, etc.) con la fecha en la cuál se produce ese cambio. Algo así:

| SaleOrderId | Date | StatusId |
| --- | --- | --- |
| O1111 | 2021-08-11 | 1 |
| O1111 | 2021-09-20 | 4 |
| O2222 | 2021-10-01 | 1 |
| O2222 | 2021-10-25 | 2 |

¿Cómo haríamos en este caso si quisieramos obtener, para todos los pedidos iniciados en 2021, su estado a día 31 de diciembre de 2021 y su importe total? Aquí ya la cosa se complica, porque tenemos que asociar la tabla de pedidos no sólo a la tabla de líneas de pedidos sino también a la tabla de estados de pedidos. Y ambas tienen una relación de muchos a 1 con la tabla principal. ¿Cuál es la solución probablemente más intuitiva? Añadir, a la SELECT que hemos hecho anteriormente una subquery sobre la tabla SaleOrderHistory ya sea en la parte de SELECT o en la parte de FROM. Algo como:

```
SELECT SaleOrder.Id, SUM (SaleOrderLine.UnitPrice * SaleOrderLine.OrderQty) Amount
, (
  SELECT TOP 1 SaleOrderHistory.StatusId
  FROM SaleOrderHistory
  WHERE SaleOrderHistory.Date < '20220101'
  AND SaleOrder.Id = SaleOrderHistory.SaleOrderId
  ORDER BY SaleOrderHistory.Date DESC
) StatusId
FROM SaleOrder
INNER JOIN SaleOrderLine ON SaleOrder.Id = SaleOrderLine.SaleOrderId
WHERE SaleOrder.CreationDate >= '20210101'
GROUP BY SaleOrder.Id
```

En este caso, sinceramente, no le veo nada de malo a priori a esta query. Hace lo que tiene que hacer, y probablemente, con un rendimiento aceptable. Sin embargo, quiero aprovechar este ejemplo para presentarte la opción de utilizar CROSS/OUTER APPLY y que coméntemos sus posibilidades más allá de sencillos ejemplos como éste. **La diferencia entre CROSS APPLY y OUTER APPLY es básicamente la misma que entre INNER JOIN Y LEFT JOIN**. Es decir, en la primera, si no hay "match" de registros entre las tablas asociadades no se devuelve un resultado, mientras que en la segunda siempre se mantiene el registro de la tabla de izquierda. En nuestro caso, la query equivalente quedaría así:

```
SELECT SaleOrder.Id, SUM (SaleOrderLine.UnitPrice * SaleOrderLine.OrderQty) Amount, History.StatusId
FROM SaleOrder
INNER JOIN SaleOrderLine ON SaleOrder.Id = SaleOrderLine.SaleOrderId
CROSS APPLY (
SELECT TOP 1 SaleOrderHistory.StatusId
FROM SaleOrderHistory
WHERE SaleOrderHistory.Date < '20220101'
AND SaleOrder.Id = SaleOrderHistory.SaleOrderId
ORDER BY SaleOrderHistory.Date DESC
) History
WHERE SaleOrder.CreationDate >= '20210101'
GROUP BY SaleOrder.Id, History.StatusId
```

¿Qué estamos haciendo en este caso? ¡Exactamente lo mismo! Por cada registro que salga de la INNER JOIN entre SaleOrder y SaleOrderLine, obtendremos el último estado de ese pedido anterior al 01/01/2022. Es decir, el último estado del año 2021. En este caso, además, he aplicado CROSS APPLY en lugar de OUTER APPLY porque, como sé que los pedidos han sido creados con anterioridad, como mínimo tendrán un registro en la tabla SaleOrderHistory de cuando se crearon. Quiero que notes que esta misma lógica puedes utilizarla para obtener el dato Amount, y añadir un nuevo CROSS APPLY sobre esta query en lugar de utilizar el INNER JOIN con el GROUP BY. Ahí te dejo el reto ?.

### Ventajas de CROSS APPLY y OUTER APPLY

Para mí las **ventajas** de este enfoque son varias, aunque ya te digo que depende (Y MUCHO) de cada caso:

-   Las **queries** quedan mucho **más limpias y legibles**, al aplicar las subqueries siempre siguiendo la misma lógica y en el mismo lugar (el FROM).
-   En mi experiencia, con grandes cantidades de datos tanto en la tabla principal como en las secundarios, **suele ser más rápido**.
-   **La flexibilidad que aporta** CROSS/OUTER APPLY es muy a tener en cuenta. Puedes ver que además de aplicar la cláusula TOP 1 con ORDER BY, podemos optar (para otros casos) por TOP N > 1, GROUP BY, FOR XML PATH, STRING\_AGG...
-   Al contrario que las CTEs o las tablas temporales, **se aplican dentro de la misma query**, con los beneficios de rendimiento que eso puede aportar.
-   **Permite obtener más de un dato** de la subquery, lo cuál me ha sido útil más de una vez. Alguna vez he cogido varias subqueries que estaban en el SELECT y las he podido reimplementar con un sólo CROSS/OUTER APPLY.
